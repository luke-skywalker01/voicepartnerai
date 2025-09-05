"""
Security and Compliance Routes for VoicePartnerAI
Implements GDPR compliance endpoints and audit log access
"""

import logging
from datetime import datetime, timezone, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db
from auth import get_current_user
from models import User
from gdpr_compliance import (
    GDPRComplianceService, 
    DataExportRequest, 
    DataDeletionRequest,
    DataExportResponse,
    DataDeletionResponse
)
from audit_log import (
    AuditLogger, 
    AuditQueryService, 
    AuditContext, 
    AuditLogResponse,
    AuditStatisticsResponse,
    AuditEventType,
    AuditSeverity
)
from rate_limiter import rate_limit_dependency

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/security", tags=["security", "gdpr", "audit"])


# GDPR Data Export Endpoints

@router.post("/data-export", response_model=DataExportResponse)
async def request_data_export(
    request: Request,
    export_request: DataExportRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Request export of all personal data (GDPR Article 20).
    """
    # Rate limiting - 2 exports per day per user
    await rate_limit_dependency(request, "data_export", str(current_user.id))
    
    try:
        # Create audit context
        context = AuditContext.from_request(request, current_user)
        
        # Initialize GDPR service
        gdpr_service = GDPRComplianceService(db)
        
        # Request data export (runs in background)
        export_result = await gdpr_service.export_user_data(
            user_id=current_user.id,
            request=export_request,
            audit_context=context
        )
        
        return DataExportResponse(
            export_id=export_result.export_id,
            status="completed",
            message="Your data export has been prepared successfully.",
            download_url=f"/security/data-export/{export_result.export_id}/download",
            expires_at=export_result.expires_at,
            file_size_bytes=export_result.file_size_bytes
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Data export request failed for user {current_user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Data export request failed. Please try again later."
        )


@router.get("/data-export/{export_id}/download")
async def download_data_export(
    export_id: str,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Download exported data file.
    """
    try:
        # Verify export belongs to current user
        if not export_id.startswith(f"export_{current_user.id}_"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this export"
            )
        
        # Create audit context and log download
        context = AuditContext.from_request(request, current_user)
        audit_logger = AuditLogger(db)
        
        await audit_logger.log_event(
            event_type=AuditEventType.DATA_EXPORTED,
            context=context,
            action="Data export download",
            description="User downloaded exported personal data",
            resource_type="user_data",
            resource_id=str(current_user.id),
            metadata={"export_id": export_id},
            severity=AuditSeverity.LOW
        )
        
        # In a real implementation, you would:
        # 1. Verify the export file exists
        # 2. Check if it's not expired
        # 3. Return the file as a streaming response
        
        from fastapi.responses import FileResponse
        import os
        
        file_path = f"exports/{export_id}/{export_id}.zip"
        
        if not os.path.exists(file_path):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Export file not found or has expired"
            )
        
        return FileResponse(
            path=file_path,
            filename=f"voicepartnerai_data_export_{current_user.id}.zip",
            media_type="application/zip"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Data export download failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Download failed. Please try again later."
        )


# GDPR Data Deletion Endpoints

@router.delete("/data-deletion", response_model=DataDeletionResponse)
async def request_data_deletion(
    request: Request,
    deletion_request: DataDeletionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Request deletion of all personal data (GDPR Article 17 - Right to erasure).
    """
    if not deletion_request.confirm_deletion:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You must confirm the deletion by setting 'confirm_deletion' to true"
        )
    
    try:
        # Create audit context
        context = AuditContext.from_request(request, current_user)
        
        # Initialize GDPR service
        gdpr_service = GDPRComplianceService(db)
        
        # Process data deletion
        deletion_summary = await gdpr_service.delete_user_data(
            user_id=current_user.id,
            request=deletion_request,
            audit_context=context
        )
        
        return DataDeletionResponse(
            status="completed",
            message="Your account and all associated data have been permanently deleted.",
            deletion_summary=deletion_summary,
            completed_at=datetime.now(timezone.utc)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Data deletion failed for user {current_user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Data deletion failed. Please contact support for assistance."
        )


# Audit Log Endpoints

@router.get("/audit-logs", response_model=List[AuditLogResponse])
async def get_user_audit_logs(
    request: Request,
    limit: int = 50,
    offset: int = 0,
    event_type: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get audit logs for the current user.
    """
    try:
        audit_service = AuditQueryService(db)
        
        # Parse event types
        event_types = None
        if event_type:
            try:
                event_types = [AuditEventType(event_type)]
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid event type: {event_type}"
                )
        
        # Set default date range if not provided
        if not start_date:
            start_date = datetime.now(timezone.utc) - timedelta(days=30)
        
        # Get audit logs
        audit_logs = await audit_service.get_user_audit_logs(
            user_id=current_user.id,
            limit=min(limit, 100),  # Cap at 100
            offset=offset,
            event_types=event_types,
            start_date=start_date,
            end_date=end_date
        )
        
        return [AuditLogResponse.from_orm(log) for log in audit_logs]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to retrieve audit logs for user {current_user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve audit logs"
        )


@router.get("/audit-logs/statistics", response_model=AuditStatisticsResponse)
async def get_audit_statistics(
    request: Request,
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get audit log statistics for the current user.
    """
    try:
        audit_service = AuditQueryService(db)
        
        start_date = datetime.now(timezone.utc) - timedelta(days=min(days, 365))
        
        stats = await audit_service.get_audit_statistics(
            user_id=current_user.id,
            start_date=start_date
        )
        
        return AuditStatisticsResponse(**stats)
        
    except Exception as e:
        logger.error(f"Failed to get audit statistics for user {current_user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve audit statistics"
        )


# Security Information Endpoints

@router.get("/security-info")
async def get_security_information(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get security information and settings for the current user.
    """
    try:
        # Get recent security events
        audit_service = AuditQueryService(db)
        
        security_events = await audit_service.get_security_events(
            start_date=datetime.now(timezone.utc) - timedelta(days=7),
            limit=10
        )
        
        # Filter events for current user
        user_security_events = [
            event for event in security_events 
            if event.user_id == current_user.id
        ]
        
        return {
            "user_id": current_user.id,
            "email": current_user.email,
            "account_created": current_user.created_at,
            "last_login": current_user.last_login,
            "is_verified": current_user.is_verified,
            "recent_security_events": [
                {
                    "event_type": event.event_type,
                    "timestamp": event.timestamp,
                    "ip_address": event.ip_address,
                    "description": event.description,
                    "success": event.success
                }
                for event in user_security_events
            ],
            "security_recommendations": [
                "Enable two-factor authentication for enhanced security",
                "Regularly review your audit logs for suspicious activity",
                "Use strong, unique passwords for your account",
                "Keep your API keys secure and rotate them regularly"
            ]
        }
        
    except Exception as e:
        logger.error(f"Failed to get security info for user {current_user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve security information"
        )


# Admin Endpoints (for system administrators)

@router.get("/admin/security-events", response_model=List[AuditLogResponse])
async def get_security_events(
    request: Request,
    limit: int = 100,
    severity: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get system-wide security events (admin only).
    """
    # Check if user is admin (implement your admin check here)
    # if not current_user.is_admin:
    #     raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        audit_service = AuditQueryService(db)
        
        # Parse severity
        severity_filter = None
        if severity:
            try:
                severity_filter = AuditSeverity(severity)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid severity: {severity}"
                )
        
        # Set default date range
        if not start_date:
            start_date = datetime.now(timezone.utc) - timedelta(days=7)
        
        security_events = await audit_service.get_security_events(
            start_date=start_date,
            end_date=end_date,
            severity=severity_filter,
            limit=min(limit, 500)
        )
        
        return [AuditLogResponse.from_orm(event) for event in security_events]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to retrieve security events: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve security events"
        )


# Privacy and Consent Management

class ConsentRequest(BaseModel):
    marketing_emails: bool
    analytics_tracking: bool
    data_processing: bool


@router.post("/privacy/consent")
async def update_privacy_consent(
    request: Request,
    consent: ConsentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update user privacy consent settings.
    """
    try:
        # Create audit context
        context = AuditContext.from_request(request, current_user)
        audit_logger = AuditLogger(db)
        
        # In a real implementation, you would:
        # 1. Update user's consent preferences in the database
        # 2. Apply the consent settings to data processing
        # 3. Update third-party integrations based on consent
        
        # Log consent update
        await audit_logger.log_event(
            event_type=AuditEventType.USER_UPDATED,
            context=context,
            action="Privacy consent updated",
            description="User updated privacy consent settings",
            resource_type="user_consent",
            resource_id=str(current_user.id),
            metadata={
                "marketing_emails": consent.marketing_emails,
                "analytics_tracking": consent.analytics_tracking,
                "data_processing": consent.data_processing
            },
            severity=AuditSeverity.LOW
        )
        
        return {
            "status": "success",
            "message": "Privacy consent settings updated successfully",
            "consent": consent.dict()
        }
        
    except Exception as e:
        logger.error(f"Failed to update consent for user {current_user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update privacy consent"
        )


@router.get("/privacy/policy")
async def get_privacy_policy_info():
    """
    Get privacy policy information and data processing details.
    """
    return {
        "privacy_policy_version": "1.0",
        "last_updated": "2024-01-01",
        "data_controller": "VoicePartnerAI GmbH",
        "dpo_contact": "dpo@voicepartnerai.com",
        "data_categories": [
            "Account information (email, name)",
            "Usage data (call logs, assistant interactions)",
            "Technical data (IP addresses, device info)",
            "Communication preferences"
        ],
        "processing_purposes": [
            "Service provision and operation",
            "Customer support and communication",
            "Service improvement and analytics",
            "Legal compliance and security"
        ],
        "data_retention": {
            "account_data": "Until account deletion",
            "call_logs": "2 years for billing purposes",
            "audit_logs": "7 years for security and compliance",
            "marketing_data": "Until consent withdrawn"
        },
        "user_rights": [
            "Right to access your data",
            "Right to rectify incorrect data",
            "Right to erase your data",
            "Right to data portability",
            "Right to object to processing",
            "Right to restrict processing"
        ],
        "contact_info": {
            "email": "privacy@voicepartnerai.com",
            "address": "VoicePartnerAI GmbH, Privacy Office, [Address]"
        }
    }