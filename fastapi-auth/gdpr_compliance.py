"""
GDPR Compliance Module for VoicePartnerAI
Implements data export and deletion functionality according to GDPR requirements
"""

import logging
import asyncio
import json
import zipfile
import tempfile
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Union
from pathlib import Path
import shutil

from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from fastapi import HTTPException, status
from pydantic import BaseModel

from models import (
    User, Workspace, WorkspaceMember, Assistant, CallLog, 
    PhoneNumber, APIKey, APIKeyUsage
)
from audit_log import AuditLogger, AuditContext, AuditEventType, AuditSeverity

logger = logging.getLogger(__name__)


class DataExportRequest(BaseModel):
    """Request model for data export."""
    include_call_logs: bool = True
    include_assistants: bool = True
    include_api_keys: bool = False  # Sensitive data, opt-in
    include_audit_logs: bool = True
    format: str = "json"  # json, csv, xml


class DataDeletionRequest(BaseModel):
    """Request model for data deletion."""
    confirm_deletion: bool
    delete_workspaces: bool = True
    anonymize_call_logs: bool = True  # Keep logs but remove personal data
    reason: Optional[str] = None


class DataExportResult(BaseModel):
    """Result of data export operation."""
    export_id: str
    user_id: int
    created_at: datetime
    file_size_bytes: int
    file_path: str
    expires_at: datetime
    status: str


class GDPRComplianceService:
    """Service for GDPR compliance operations."""
    
    def __init__(self, db: Session):
        self.db = db
        self.export_base_path = Path("exports")
        self.export_base_path.mkdir(exist_ok=True)
    
    async def export_user_data(
        self,
        user_id: int,
        request: DataExportRequest,
        audit_context: AuditContext
    ) -> DataExportResult:
        """
        Export all user data according to GDPR Article 20 (Right to data portability).
        """
        try:
            # Verify user exists
            user = self.db.query(User).filter(User.id == user_id).first()
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User not found"
                )
            
            # Create export directory
            export_id = f"export_{user_id}_{int(datetime.now().timestamp())}"
            export_dir = self.export_base_path / export_id
            export_dir.mkdir(exist_ok=True)
            
            # Collect all user data
            export_data = await self._collect_user_data(user, request)
            
            # Generate export files
            if request.format.lower() == "json":
                file_path = await self._create_json_export(export_dir, export_data, user)
            elif request.format.lower() == "csv":
                file_path = await self._create_csv_export(export_dir, export_data, user)
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Unsupported export format"
                )
            
            # Get file size
            file_size = file_path.stat().st_size
            
            # Create export result
            result = DataExportResult(
                export_id=export_id,
                user_id=user_id,
                created_at=datetime.now(timezone.utc),
                file_size_bytes=file_size,
                file_path=str(file_path),
                expires_at=datetime.now(timezone.utc).replace(hour=23, minute=59, second=59) + 
                          datetime.timedelta(days=30),  # Expire after 30 days
                status="completed"
            )
            
            # Log audit event
            audit_logger = AuditLogger(self.db)
            await audit_logger.log_event(
                event_type=AuditEventType.DATA_EXPORTED,
                context=audit_context,
                action="User data export",
                description=f"User exported personal data (format: {request.format})",
                resource_type="user_data",
                resource_id=str(user_id),
                metadata={
                    "export_id": export_id,
                    "file_size_bytes": file_size,
                    "format": request.format,
                    "includes": {
                        "call_logs": request.include_call_logs,
                        "assistants": request.include_assistants,
                        "api_keys": request.include_api_keys,
                        "audit_logs": request.include_audit_logs
                    }
                },
                severity=AuditSeverity.MEDIUM
            )
            
            logger.info(f"Data export completed for user {user_id}, export_id: {export_id}")
            return result
            
        except Exception as e:
            logger.error(f"Data export failed for user {user_id}: {e}")
            
            # Log audit event for failure
            audit_logger = AuditLogger(self.db)
            await audit_logger.log_event(
                event_type=AuditEventType.DATA_EXPORTED,
                context=audit_context,
                action="User data export",
                description="User data export failed",
                resource_type="user_data",
                resource_id=str(user_id),
                success=False,
                error_message=str(e),
                severity=AuditSeverity.HIGH
            )
            
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Data export failed. Please try again later."
            )
    
    async def delete_user_data(
        self,
        user_id: int,
        request: DataDeletionRequest,
        audit_context: AuditContext
    ) -> Dict[str, Any]:
        """
        Delete user data according to GDPR Article 17 (Right to erasure).
        """
        if not request.confirm_deletion:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Deletion must be explicitly confirmed"
            )
        
        try:
            # Verify user exists
            user = self.db.query(User).filter(User.id == user_id).first()
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User not found"
                )
            
            deletion_summary = {
                "user_id": user_id,
                "email": user.email,
                "deletion_timestamp": datetime.now(timezone.utc),
                "deleted_items": {},
                "anonymized_items": {},
                "retained_items": {}
            }
            
            # Start database transaction
            try:
                # 1. Delete API Keys and Usage
                api_keys = self.db.query(APIKey).filter(APIKey.user_id == user_id).all()
                api_key_count = len(api_keys)
                
                for api_key in api_keys:
                    # Delete usage records
                    self.db.query(APIKeyUsage).filter(APIKeyUsage.api_key_id == api_key.id).delete()
                    # Delete API key
                    self.db.delete(api_key)
                
                deletion_summary["deleted_items"]["api_keys"] = api_key_count
                
                # 2. Handle Call Logs
                call_logs = self.db.query(CallLog).filter(CallLog.owner_id == user_id).all()
                call_log_count = len(call_logs)
                
                if request.anonymize_call_logs:
                    # Anonymize rather than delete for billing/analytics purposes
                    for call_log in call_logs:
                        call_log.caller_number = "***ANONYMIZED***"
                        call_log.owner_id = None
                        call_log.assistant_id = None
                        call_log.keywords_extracted = None
                        
                    deletion_summary["anonymized_items"]["call_logs"] = call_log_count
                else:
                    # Complete deletion
                    for call_log in call_logs:
                        self.db.delete(call_log)
                    deletion_summary["deleted_items"]["call_logs"] = call_log_count
                
                # 3. Delete Phone Numbers
                phone_numbers = self.db.query(PhoneNumber).filter(PhoneNumber.owner_id == user_id).all()
                phone_count = len(phone_numbers)
                
                for phone in phone_numbers:
                    self.db.delete(phone)
                
                deletion_summary["deleted_items"]["phone_numbers"] = phone_count
                
                # 4. Handle Assistants
                assistants = self.db.query(Assistant).filter(Assistant.owner_id == user_id).all()
                assistant_count = len(assistants)
                
                for assistant in assistants:
                    self.db.delete(assistant)
                
                deletion_summary["deleted_items"]["assistants"] = assistant_count
                
                # 5. Handle Workspace Memberships
                memberships = self.db.query(WorkspaceMember).filter(WorkspaceMember.user_id == user_id).all()
                membership_count = len(memberships)
                
                for membership in memberships:
                    self.db.delete(membership)
                
                deletion_summary["deleted_items"]["workspace_memberships"] = membership_count
                
                # 6. Handle Owned Workspaces
                if request.delete_workspaces:
                    owned_workspaces = self.db.query(Workspace).join(WorkspaceMember).filter(
                        and_(
                            WorkspaceMember.user_id == user_id,
                            WorkspaceMember.role == "owner"
                        )
                    ).all()
                    
                    workspace_count = len(owned_workspaces)
                    
                    for workspace in owned_workspaces:
                        # Delete all members first
                        self.db.query(WorkspaceMember).filter(
                            WorkspaceMember.workspace_id == workspace.id
                        ).delete()
                        
                        # Delete workspace
                        self.db.delete(workspace)
                    
                    deletion_summary["deleted_items"]["owned_workspaces"] = workspace_count
                
                # 7. Anonymize Audit Logs (retain for security/compliance)
                from audit_log import AuditLog
                audit_logs = self.db.query(AuditLog).filter(AuditLog.user_id == user_id).all()
                audit_count = len(audit_logs)
                
                for audit_log in audit_logs:
                    audit_log.user_id = None
                    audit_log.user_email = "***DELETED_USER***"
                    if audit_log.metadata:
                        # Remove any personal identifiers from metadata
                        metadata = audit_log.metadata.copy()
                        if 'email' in metadata:
                            metadata['email'] = "***DELETED***"
                        audit_log.metadata = metadata
                
                deletion_summary["anonymized_items"]["audit_logs"] = audit_count
                
                # 8. Finally, delete the user account
                original_email = user.email
                self.db.delete(user)
                
                # Commit all changes
                self.db.commit()
                
                deletion_summary["deleted_items"]["user_account"] = 1
                deletion_summary["status"] = "completed"
                
                # Log audit event (before user deletion)
                audit_logger = AuditLogger(self.db)
                await audit_logger.log_event(
                    event_type=AuditEventType.DATA_DELETED,
                    context=audit_context,
                    action="Complete user data deletion",
                    description=f"User account and associated data deleted (GDPR Article 17)",
                    resource_type="user_data",
                    resource_id=str(user_id),
                    metadata={
                        "original_email": original_email,
                        "deletion_reason": request.reason,
                        "deletion_summary": deletion_summary
                    },
                    severity=AuditSeverity.HIGH
                )
                
                logger.info(f"User data deletion completed for user {user_id}")
                return deletion_summary
                
            except Exception as e:
                self.db.rollback()
                raise e
                
        except Exception as e:
            logger.error(f"User data deletion failed for user {user_id}: {e}")
            
            # Log audit event for failure
            audit_logger = AuditLogger(self.db)
            await audit_logger.log_event(
                event_type=AuditEventType.DATA_DELETED,
                context=audit_context,
                action="User data deletion",
                description="User data deletion failed",
                resource_type="user_data",
                resource_id=str(user_id),
                success=False,
                error_message=str(e),
                severity=AuditSeverity.CRITICAL
            )
            
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Data deletion failed. Please contact support."
            )
    
    async def _collect_user_data(self, user: User, request: DataExportRequest) -> Dict[str, Any]:
        """Collect all user data for export."""
        data = {
            "export_info": {
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "user_id": user.id,
                "format_version": "1.0",
                "gdpr_compliance": "Article 20 - Right to data portability"
            },
            "user_profile": {
                "id": user.id,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "is_active": user.is_active,
                "is_verified": user.is_verified,
                "created_at": user.created_at.isoformat() if user.created_at else None,
                "last_login": user.last_login.isoformat() if user.last_login else None
            }
        }
        
        # Workspace memberships
        memberships = self.db.query(WorkspaceMember).filter(WorkspaceMember.user_id == user.id).all()
        data["workspace_memberships"] = [
            {
                "workspace_id": m.workspace_id,
                "role": m.role,
                "is_active": m.is_active,
                "joined_at": m.joined_at.isoformat() if m.joined_at else None
            }
            for m in memberships
        ]
        
        # Assistants
        if request.include_assistants:
            assistants = self.db.query(Assistant).filter(Assistant.owner_id == user.id).all()
            data["assistants"] = [
                {
                    "id": a.id,
                    "name": a.name,
                    "description": a.description,
                    "system_prompt": a.system_prompt,
                    "llm_model": a.llm_model,
                    "temperature": a.temperature,
                    "voice_id": a.voice_id,
                    "language": a.language,
                    "first_message": a.first_message,
                    "created_at": a.created_at.isoformat() if a.created_at else None
                }
                for a in assistants
            ]
        
        # Phone numbers
        phone_numbers = self.db.query(PhoneNumber).filter(PhoneNumber.owner_id == user.id).all()
        data["phone_numbers"] = [
            {
                "id": p.id,
                "number": p.number,
                "provider": p.provider,
                "region": p.region,
                "purchased_at": p.purchased_at.isoformat() if p.purchased_at else None,
                "usage_statistics": p.usage
            }
            for p in phone_numbers
        ]
        
        # Call logs
        if request.include_call_logs:
            call_logs = self.db.query(CallLog).filter(CallLog.owner_id == user.id).all()
            data["call_logs"] = [
                {
                    "id": c.id,
                    "call_sid": c.call_sid,
                    "caller_number": c.caller_number,
                    "called_number": c.called_number,
                    "direction": c.direction,
                    "start_time": c.start_time.isoformat() if c.start_time else None,
                    "end_time": c.end_time.isoformat() if c.end_time else None,
                    "duration_seconds": c.duration_seconds,
                    "status": c.status,
                    "credits_consumed": float(c.credits_consumed) if c.credits_consumed else 0,
                    "cost_eur": float(c.cost_eur) if c.cost_eur else 0,
                    "country_code": c.country_code,
                    "region": c.region
                }
                for c in call_logs
            ]
        
        # API Keys (sensitive - only if explicitly requested)
        if request.include_api_keys:
            api_keys = self.db.query(APIKey).filter(APIKey.user_id == user.id).all()
            data["api_keys"] = [
                {
                    "id": k.id,
                    "name": k.name,
                    "description": k.description,
                    "key_prefix": k.key_prefix,
                    "scopes": k.scopes,
                    "is_active": k.is_active,
                    "created_at": k.created_at.isoformat() if k.created_at else None,
                    "last_used_at": k.last_used_at.isoformat() if k.last_used_at else None,
                    "usage_count": k.usage_count,
                    "rate_limits": {
                        "per_minute": k.rate_limit_per_minute,
                        "per_hour": k.rate_limit_per_hour,
                        "per_day": k.rate_limit_per_day
                    }
                }
                for k in api_keys
            ]
        
        # Audit logs
        if request.include_audit_logs:
            from audit_log import AuditLog
            audit_logs = self.db.query(AuditLog).filter(AuditLog.user_id == user.id).limit(1000).all()
            data["audit_logs"] = [
                {
                    "id": l.id,
                    "event_type": l.event_type,
                    "timestamp": l.timestamp.isoformat(),
                    "action": l.action,
                    "description": l.description,
                    "ip_address": l.ip_address,
                    "success": l.success,
                    "resource_type": l.resource_type,
                    "resource_id": l.resource_id
                }
                for l in audit_logs
            ]
        
        return data
    
    async def _create_json_export(self, export_dir: Path, data: Dict[str, Any], user: User) -> Path:
        """Create JSON export file."""
        file_path = export_dir / f"voicepartnerai_data_export_{user.id}.json"
        
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False, default=str)
        
        # Create a ZIP file with the JSON
        zip_path = export_dir / f"voicepartnerai_data_export_{user.id}.zip"
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            zipf.write(file_path, file_path.name)
            
            # Add README
            readme_content = self._generate_export_readme(user)
            readme_path = export_dir / "README.txt"
            with open(readme_path, 'w', encoding='utf-8') as readme_f:
                readme_f.write(readme_content)
            zipf.write(readme_path, readme_path.name)
        
        # Clean up individual files
        file_path.unlink()
        readme_path.unlink()
        
        return zip_path
    
    async def _create_csv_export(self, export_dir: Path, data: Dict[str, Any], user: User) -> Path:
        """Create CSV export files."""
        import csv
        
        zip_path = export_dir / f"voicepartnerai_data_export_{user.id}.zip"
        
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            # Export each data type as separate CSV
            for data_type, records in data.items():
                if data_type in ['export_info', 'user_profile']:
                    continue
                    
                if isinstance(records, list) and records:
                    csv_path = export_dir / f"{data_type}.csv"
                    
                    with open(csv_path, 'w', newline='', encoding='utf-8') as csvfile:
                        if records:
                            fieldnames = records[0].keys()
                            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
                            writer.writeheader()
                            writer.writerows(records)
                    
                    zipf.write(csv_path, csv_path.name)
                    csv_path.unlink()
            
            # Add user profile as separate CSV
            profile_path = export_dir / "user_profile.csv"
            with open(profile_path, 'w', newline='', encoding='utf-8') as csvfile:
                writer = csv.DictWriter(csvfile, fieldnames=data['user_profile'].keys())
                writer.writeheader()
                writer.writerow(data['user_profile'])
            
            zipf.write(profile_path, profile_path.name)
            profile_path.unlink()
            
            # Add README
            readme_content = self._generate_export_readme(user)
            readme_path = export_dir / "README.txt"
            with open(readme_path, 'w', encoding='utf-8') as readme_f:
                readme_f.write(readme_content)
            zipf.write(readme_path, readme_path.name)
            readme_path.unlink()
        
        return zip_path
    
    def _generate_export_readme(self, user: User) -> str:
        """Generate README file for data export."""
        return f"""
VoicePartnerAI - Personal Data Export
=====================================

Export Date: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}
User: {user.email}
User ID: {user.id}

This archive contains all your personal data stored in VoicePartnerAI,
exported in compliance with GDPR Article 20 (Right to data portability).

Files included:
- user_profile: Your account information
- assistants: AI assistants you've created
- phone_numbers: Phone numbers you've purchased/configured
- call_logs: Record of all calls made through your assistants
- api_keys: API keys you've generated (if requested)
- audit_logs: Security and activity logs for your account
- workspace_memberships: Your workspace memberships and roles

Data Protection:
- This export contains personal data and should be handled securely
- The download link will expire after 30 days
- Delete this file securely when no longer needed

Questions?
If you have any questions about this data export, please contact our
support team at support@voicepartnerai.com

Legal Notice:
This export is provided under GDPR Article 20. The data is provided in
a structured, commonly used and machine-readable format.
        """.strip()
    
    async def cleanup_expired_exports(self):
        """Clean up expired export files."""
        try:
            current_time = datetime.now(timezone.utc)
            
            for export_dir in self.export_base_path.iterdir():
                if export_dir.is_dir():
                    # Check if directory is older than 30 days
                    dir_age = current_time - datetime.fromtimestamp(
                        export_dir.stat().st_ctime, tz=timezone.utc
                    )
                    
                    if dir_age.days > 30:
                        shutil.rmtree(export_dir)
                        logger.info(f"Cleaned up expired export directory: {export_dir}")
            
        except Exception as e:
            logger.error(f"Failed to cleanup expired exports: {e}")


# Pydantic response models
class DataExportResponse(BaseModel):
    export_id: str
    status: str
    message: str
    download_url: Optional[str] = None
    expires_at: Optional[datetime] = None
    file_size_bytes: Optional[int] = None


class DataDeletionResponse(BaseModel):
    status: str
    message: str
    deletion_summary: Dict[str, Any]
    completed_at: datetime