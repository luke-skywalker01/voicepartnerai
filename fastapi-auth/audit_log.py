"""
Audit Log System for VoicePartnerAI
Comprehensive logging of all user actions for security and compliance
"""

import logging
import asyncio
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from enum import Enum
from dataclasses import dataclass
import json

from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, ForeignKey, Index, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Session, relationship
from sqlalchemy.dialects.postgresql import JSONB
from pydantic import BaseModel

from database import Base
from models import User

logger = logging.getLogger(__name__)


class AuditEventType(str, Enum):
    """Types of events that should be audited."""
    
    # Authentication events
    LOGIN = "login"
    LOGOUT = "logout"
    LOGIN_FAILED = "login_failed"
    PASSWORD_CHANGED = "password_changed"
    PASSWORD_RESET_REQUESTED = "password_reset_requested"
    PASSWORD_RESET_COMPLETED = "password_reset_completed"
    EMAIL_VERIFIED = "email_verified"
    
    # User management
    USER_CREATED = "user_created"
    USER_UPDATED = "user_updated"
    USER_DELETED = "user_deleted"
    USER_DEACTIVATED = "user_deactivated"
    USER_REACTIVATED = "user_reactivated"
    
    # Workspace management
    WORKSPACE_CREATED = "workspace_created"
    WORKSPACE_UPDATED = "workspace_updated"
    WORKSPACE_DELETED = "workspace_deleted"
    WORKSPACE_MEMBER_ADDED = "workspace_member_added"
    WORKSPACE_MEMBER_REMOVED = "workspace_member_removed"
    WORKSPACE_MEMBER_ROLE_CHANGED = "workspace_member_role_changed"
    
    # Assistant management
    ASSISTANT_CREATED = "assistant_created"
    ASSISTANT_UPDATED = "assistant_updated"
    ASSISTANT_DELETED = "assistant_deleted"
    ASSISTANT_PUBLISHED = "assistant_published"
    ASSISTANT_UNPUBLISHED = "assistant_unpublished"
    
    # API Key management
    API_KEY_CREATED = "api_key_created"
    API_KEY_UPDATED = "api_key_updated"
    API_KEY_DELETED = "api_key_deleted"
    API_KEY_USED = "api_key_used"
    
    # Phone number management
    PHONE_NUMBER_PURCHASED = "phone_number_purchased"
    PHONE_NUMBER_RELEASED = "phone_number_released"
    PHONE_NUMBER_CONFIGURED = "phone_number_configured"
    
    # Billing events
    PAYMENT_METHOD_ADDED = "payment_method_added"
    PAYMENT_METHOD_UPDATED = "payment_method_updated"
    PAYMENT_METHOD_DELETED = "payment_method_deleted"
    PAYMENT_PROCESSED = "payment_processed"
    PAYMENT_FAILED = "payment_failed"
    SUBSCRIPTION_CREATED = "subscription_created"
    SUBSCRIPTION_UPDATED = "subscription_updated"
    SUBSCRIPTION_CANCELLED = "subscription_cancelled"
    
    # Data access events
    DATA_EXPORTED = "data_exported"
    DATA_DELETED = "data_deleted"
    
    # Security events
    UNAUTHORIZED_ACCESS_ATTEMPT = "unauthorized_access_attempt"
    SUSPICIOUS_ACTIVITY = "suspicious_activity"
    RATE_LIMIT_EXCEEDED = "rate_limit_exceeded"


class AuditSeverity(str, Enum):
    """Severity levels for audit events."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class AuditLog(Base):
    """Audit log table for tracking all user actions."""
    
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Event information
    event_type = Column(String(50), nullable=False, index=True)
    severity = Column(String(20), nullable=False, default=AuditSeverity.MEDIUM)
    timestamp = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), index=True)
    
    # User information
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    user_email = Column(String(255), nullable=True, index=True)  # Denormalized for faster queries
    
    # Request information
    ip_address = Column(String(45), nullable=True, index=True)  # IPv6 support
    user_agent = Column(Text, nullable=True)
    request_id = Column(String(50), nullable=True, index=True)
    
    # Resource information
    resource_type = Column(String(50), nullable=True, index=True)  # e.g., "assistant", "workspace"
    resource_id = Column(String(50), nullable=True, index=True)
    resource_name = Column(String(255), nullable=True)
    
    # Event details
    action = Column(String(100), nullable=False)  # Specific action taken
    description = Column(Text, nullable=True)
    
    # Additional context data
    event_metadata = Column(JSON, nullable=True)  # JSON for cross-database compatibility
    
    # Changes tracking
    old_values = Column(JSON, nullable=True)  # Previous state
    new_values = Column(JSON, nullable=True)  # New state
    
    # Success/failure
    success = Column(Boolean, nullable=False, default=True)
    error_message = Column(Text, nullable=True)
    
    # Relationships
    user = relationship("User", backref="audit_logs")
    
    # Indexes for common queries
    __table_args__ = (
        Index('idx_audit_user_timestamp', 'user_id', 'timestamp'),
        Index('idx_audit_event_timestamp', 'event_type', 'timestamp'),
        Index('idx_audit_resource', 'resource_type', 'resource_id'),
        Index('idx_audit_ip_timestamp', 'ip_address', 'timestamp'),
    )


@dataclass
class AuditContext:
    """Context information for audit logging."""
    user_id: Optional[int] = None
    user_email: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    request_id: Optional[str] = None
    
    @classmethod
    def from_request(cls, request, user: Optional[User] = None):
        """Create audit context from FastAPI request."""
        return cls(
            user_id=user.id if user else None,
            user_email=user.email if user else None,
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            request_id=getattr(request.state, 'request_id', None)
        )


class AuditLogger:
    """Centralized audit logging service."""
    
    def __init__(self, db: Session):
        self.db = db
    
    async def log_event(
        self,
        event_type: AuditEventType,
        context: AuditContext,
        action: str,
        description: Optional[str] = None,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        resource_name: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        old_values: Optional[Dict[str, Any]] = None,
        new_values: Optional[Dict[str, Any]] = None,
        success: bool = True,
        error_message: Optional[str] = None,
        severity: AuditSeverity = AuditSeverity.MEDIUM
    ) -> AuditLog:
        """Log an audit event."""
        try:
            audit_log = AuditLog(
                event_type=event_type.value,
                severity=severity.value,
                user_id=context.user_id,
                user_email=context.user_email,
                ip_address=context.ip_address,
                user_agent=context.user_agent,
                request_id=context.request_id,
                resource_type=resource_type,
                resource_id=str(resource_id) if resource_id else None,
                resource_name=resource_name,
                action=action,
                description=description,
                metadata=metadata,
                old_values=old_values,
                new_values=new_values,
                success=success,
                error_message=error_message
            )
            
            self.db.add(audit_log)
            self.db.commit()
            self.db.refresh(audit_log)
            
            # Log to application logger for immediate visibility
            log_level = self._get_log_level(severity)
            logger.log(
                log_level,
                f"AUDIT: {event_type.value} - {action} by user {context.user_email or 'anonymous'} "
                f"from {context.ip_address} {'SUCCESS' if success else 'FAILED'}"
            )
            
            return audit_log
            
        except Exception as e:
            logger.error(f"Failed to log audit event: {e}")
            # Don't re-raise to avoid breaking the main application flow
            return None
    
    async def log_login_attempt(
        self,
        context: AuditContext,
        email: str,
        success: bool,
        error_message: Optional[str] = None
    ):
        """Log login attempt."""
        event_type = AuditEventType.LOGIN if success else AuditEventType.LOGIN_FAILED
        severity = AuditSeverity.LOW if success else AuditSeverity.MEDIUM
        
        return await self.log_event(
            event_type=event_type,
            context=context,
            action=f"Login attempt for {email}",
            description=f"User {'successfully logged in' if success else 'failed to log in'}",
            metadata={"email": email},
            success=success,
            error_message=error_message,
            severity=severity
        )
    
    async def log_resource_change(
        self,
        event_type: AuditEventType,
        context: AuditContext,
        resource_type: str,
        resource_id: str,
        resource_name: str,
        action: str,
        old_values: Optional[Dict[str, Any]] = None,
        new_values: Optional[Dict[str, Any]] = None
    ):
        """Log resource creation, update, or deletion."""
        return await self.log_event(
            event_type=event_type,
            context=context,
            action=action,
            description=f"{action} {resource_type} '{resource_name}'",
            resource_type=resource_type,
            resource_id=resource_id,
            resource_name=resource_name,
            old_values=old_values,
            new_values=new_values,
            severity=AuditSeverity.MEDIUM
        )
    
    async def log_security_event(
        self,
        event_type: AuditEventType,
        context: AuditContext,
        action: str,
        description: str,
        metadata: Optional[Dict[str, Any]] = None
    ):
        """Log security-related events."""
        return await self.log_event(
            event_type=event_type,
            context=context,
            action=action,
            description=description,
            metadata=metadata,
            severity=AuditSeverity.HIGH
        )
    
    def _get_log_level(self, severity: AuditSeverity) -> int:
        """Convert audit severity to logging level."""
        mapping = {
            AuditSeverity.LOW: logging.INFO,
            AuditSeverity.MEDIUM: logging.WARNING,
            AuditSeverity.HIGH: logging.ERROR,
            AuditSeverity.CRITICAL: logging.CRITICAL
        }
        return mapping.get(severity, logging.INFO)


class AuditQueryService:
    """Service for querying audit logs."""
    
    def __init__(self, db: Session):
        self.db = db
    
    async def get_user_audit_logs(
        self,
        user_id: int,
        limit: int = 100,
        offset: int = 0,
        event_types: Optional[List[AuditEventType]] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> List[AuditLog]:
        """Get audit logs for a specific user."""
        query = self.db.query(AuditLog).filter(AuditLog.user_id == user_id)
        
        if event_types:
            query = query.filter(AuditLog.event_type.in_([et.value for et in event_types]))
        
        if start_date:
            query = query.filter(AuditLog.timestamp >= start_date)
        
        if end_date:
            query = query.filter(AuditLog.timestamp <= end_date)
        
        return query.order_by(AuditLog.timestamp.desc()).offset(offset).limit(limit).all()
    
    async def get_resource_audit_logs(
        self,
        resource_type: str,
        resource_id: str,
        limit: int = 50
    ) -> List[AuditLog]:
        """Get audit logs for a specific resource."""
        return self.db.query(AuditLog).filter(
            AuditLog.resource_type == resource_type,
            AuditLog.resource_id == resource_id
        ).order_by(AuditLog.timestamp.desc()).limit(limit).all()
    
    async def get_security_events(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        severity: Optional[AuditSeverity] = None,
        limit: int = 100
    ) -> List[AuditLog]:
        """Get security-related audit events."""
        security_events = [
            AuditEventType.LOGIN_FAILED,
            AuditEventType.UNAUTHORIZED_ACCESS_ATTEMPT,
            AuditEventType.SUSPICIOUS_ACTIVITY,
            AuditEventType.RATE_LIMIT_EXCEEDED
        ]
        
        query = self.db.query(AuditLog).filter(
            AuditLog.event_type.in_([se.value for se in security_events])
        )
        
        if start_date:
            query = query.filter(AuditLog.timestamp >= start_date)
        
        if end_date:
            query = query.filter(AuditLog.timestamp <= end_date)
        
        if severity:
            query = query.filter(AuditLog.severity == severity.value)
        
        return query.order_by(AuditLog.timestamp.desc()).limit(limit).all()
    
    async def get_audit_statistics(
        self,
        user_id: Optional[int] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """Get audit log statistics."""
        query = self.db.query(AuditLog)
        
        if user_id:
            query = query.filter(AuditLog.user_id == user_id)
        
        if start_date:
            query = query.filter(AuditLog.timestamp >= start_date)
        
        if end_date:
            query = query.filter(AuditLog.timestamp <= end_date)
        
        total_events = query.count()
        failed_events = query.filter(AuditLog.success == False).count()
        
        # Count by event type
        from sqlalchemy import func
        event_counts = query.with_entities(
            AuditLog.event_type,
            func.count(AuditLog.id).label('count')
        ).group_by(AuditLog.event_type).all()
        
        # Count by severity
        severity_counts = query.with_entities(
            AuditLog.severity,
            func.count(AuditLog.id).label('count')
        ).group_by(AuditLog.severity).all()
        
        return {
            "total_events": total_events,
            "failed_events": failed_events,
            "success_rate": (total_events - failed_events) / total_events if total_events > 0 else 0,
            "event_type_breakdown": {et: count for et, count in event_counts},
            "severity_breakdown": {severity: count for severity, count in severity_counts}
        }


# Audit logging decorators and utilities
def audit_action(
    event_type: AuditEventType,
    action: str,
    resource_type: Optional[str] = None,
    severity: AuditSeverity = AuditSeverity.MEDIUM
):
    """Decorator to automatically audit function calls."""
    def decorator(func):
        async def async_wrapper(*args, **kwargs):
            # Extract context from kwargs if available
            context = kwargs.get('audit_context')
            db = kwargs.get('db')
            
            if context and db:
                audit_logger = AuditLogger(db)
                
                try:
                    result = await func(*args, **kwargs)
                    
                    await audit_logger.log_event(
                        event_type=event_type,
                        context=context,
                        action=action,
                        resource_type=resource_type,
                        success=True,
                        severity=severity
                    )
                    
                    return result
                    
                except Exception as e:
                    await audit_logger.log_event(
                        event_type=event_type,
                        context=context,
                        action=action,
                        resource_type=resource_type,
                        success=False,
                        error_message=str(e),
                        severity=AuditSeverity.HIGH
                    )
                    
                    raise
            else:
                return await func(*args, **kwargs)
        
        def sync_wrapper(*args, **kwargs):
            return asyncio.run(async_wrapper(*args, **kwargs))
        
        return async_wrapper if asyncio.iscoroutinefunction(func) else sync_wrapper
    
    return decorator


# Pydantic models for API responses
class AuditLogResponse(BaseModel):
    id: int
    event_type: str
    severity: str
    timestamp: datetime
    user_email: Optional[str]
    ip_address: Optional[str]
    resource_type: Optional[str]
    resource_id: Optional[str]
    resource_name: Optional[str]
    action: str
    description: Optional[str]
    success: bool
    error_message: Optional[str]
    
    class Config:
        from_attributes = True


class AuditStatisticsResponse(BaseModel):
    total_events: int
    failed_events: int
    success_rate: float
    event_type_breakdown: Dict[str, int]
    severity_breakdown: Dict[str, int]