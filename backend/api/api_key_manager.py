"""
API Key Management System for VoicePartnerAI
Handles creation, validation, and management of API keys for external developers
"""

import secrets
import hashlib
import logging
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func

from models import APIKey, APIKeyUsage, APIKeyScope, User, Workspace
from workspace_permissions import WorkspacePermissions

logger = logging.getLogger(__name__)

class APIKeyManager:
    """Service for managing API keys securely."""
    
    @staticmethod
    def generate_api_key() -> str:
        """
        Generate a secure API key.
        Format: vp_[environment]_[32-char-random-string]
        """
        # Generate cryptographically secure random string
        random_part = secrets.token_urlsafe(24)  # 32 chars when base64url encoded
        
        # Create key with prefix for identification
        api_key = f"vp_live_{random_part}"
        
        return api_key
    
    @staticmethod
    def hash_api_key(api_key: str) -> str:
        """Hash API key for secure storage."""
        return hashlib.sha256(api_key.encode()).hexdigest()
    
    @staticmethod
    def get_key_prefix(api_key: str) -> str:
        """Extract display prefix from API key."""
        if len(api_key) >= 8:
            return api_key[:8]
        return api_key
    
    @staticmethod
    def create_api_key(
        db: Session,
        user_id: int,
        workspace_id: int,
        name: str,
        description: Optional[str] = None,
        scopes: List[APIKeyScope] = None,
        rate_limit_per_minute: int = 60,
        rate_limit_per_hour: int = 1000,
        rate_limit_per_day: int = 10000,
        allowed_ips: Optional[List[str]] = None,
        expires_at: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Create a new API key for a user in a workspace.
        
        Returns both the plain text key (only shown once) and the database record.
        """
        try:
            # Validate user has permission to create API keys in this workspace
            if not WorkspacePermissions.user_has_permission(db, user_id, workspace_id, 'resource_create'):
                raise ValueError("User does not have permission to create API keys in this workspace")
            
            # Generate API key
            plain_api_key = APIKeyManager.generate_api_key()
            key_hash = APIKeyManager.hash_api_key(plain_api_key)
            key_prefix = APIKeyManager.get_key_prefix(plain_api_key)
            
            # Default scopes if none provided
            if scopes is None:
                scopes = [APIKeyScope.READ, APIKeyScope.WRITE]
            
            # Convert scopes to list of strings for JSON storage
            scopes_list = [scope.value for scope in scopes]
            
            # Create API key record
            api_key_record = APIKey(
                key_prefix=key_prefix,
                key_hash=key_hash,
                name=name,
                description=description,
                scopes=scopes_list,
                user_id=user_id,
                workspace_id=workspace_id,
                rate_limit_per_minute=rate_limit_per_minute,
                rate_limit_per_hour=rate_limit_per_hour,
                rate_limit_per_day=rate_limit_per_day,
                allowed_ips=allowed_ips,
                expires_at=expires_at,
                is_active=True
            )
            
            db.add(api_key_record)
            db.commit()
            db.refresh(api_key_record)
            
            logger.info(f"API key created for user {user_id} in workspace {workspace_id}: {key_prefix}...")
            
            return {
                "id": api_key_record.id,
                "api_key": plain_api_key,  # Only returned once!
                "key_prefix": key_prefix,
                "name": name,
                "description": description,
                "scopes": scopes_list,
                "rate_limits": {
                    "per_minute": rate_limit_per_minute,
                    "per_hour": rate_limit_per_hour,
                    "per_day": rate_limit_per_day
                },
                "allowed_ips": allowed_ips,
                "expires_at": expires_at.isoformat() if expires_at else None,
                "created_at": api_key_record.created_at.isoformat(),
                "is_active": True
            }
            
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to create API key: {e}")
            raise
    
    @staticmethod
    def validate_api_key(db: Session, api_key: str) -> Optional[APIKey]:
        """
        Validate an API key and return the associated record.
        
        Returns None if key is invalid, expired, or inactive.
        """
        try:
            key_hash = APIKeyManager.hash_api_key(api_key)
            
            # Find API key record
            api_key_record = db.query(APIKey).filter(
                APIKey.key_hash == key_hash,
                APIKey.is_active == True
            ).first()
            
            if not api_key_record:
                return None
            
            # Check if key has expired
            if api_key_record.expires_at and datetime.now(timezone.utc) > api_key_record.expires_at:
                logger.warning(f"API key {api_key_record.key_prefix}... has expired")
                return None
            
            # Update last used timestamp and usage count
            api_key_record.last_used_at = datetime.now(timezone.utc)
            api_key_record.usage_count += 1
            db.commit()
            
            return api_key_record
            
        except Exception as e:
            logger.error(f"Error validating API key: {e}")
            return None
    
    @staticmethod
    def check_rate_limit(db: Session, api_key_record: APIKey, client_ip: str = None) -> Dict[str, Any]:
        """
        Check if API key has exceeded rate limits.
        
        Returns rate limit status and remaining quotas.
        """
        try:
            now = datetime.now(timezone.utc)
            
            # Time windows for rate limiting
            minute_window = now - timedelta(minutes=1)
            hour_window = now - timedelta(hours=1)
            day_window = now - timedelta(days=1)
            
            # Count usage in each time window
            minute_usage = db.query(APIKeyUsage).filter(
                APIKeyUsage.api_key_id == api_key_record.id,
                APIKeyUsage.timestamp >= minute_window
            ).count()
            
            hour_usage = db.query(APIKeyUsage).filter(
                APIKeyUsage.api_key_id == api_key_record.id,
                APIKeyUsage.timestamp >= hour_window
            ).count()
            
            day_usage = db.query(APIKeyUsage).filter(
                APIKeyUsage.api_key_id == api_key_record.id,
                APIKeyUsage.timestamp >= day_window
            ).count()
            
            # Check limits
            rate_limited = False
            limit_type = None
            
            if minute_usage >= api_key_record.rate_limit_per_minute:
                rate_limited = True
                limit_type = "minute"
            elif hour_usage >= api_key_record.rate_limit_per_hour:
                rate_limited = True
                limit_type = "hour"
            elif day_usage >= api_key_record.rate_limit_per_day:
                rate_limited = True
                limit_type = "day"
            
            return {
                "rate_limited": rate_limited,
                "limit_type": limit_type,
                "usage": {
                    "minute": minute_usage,
                    "hour": hour_usage,
                    "day": day_usage
                },
                "limits": {
                    "minute": api_key_record.rate_limit_per_minute,
                    "hour": api_key_record.rate_limit_per_hour,
                    "day": api_key_record.rate_limit_per_day
                },
                "remaining": {
                    "minute": max(0, api_key_record.rate_limit_per_minute - minute_usage),
                    "hour": max(0, api_key_record.rate_limit_per_hour - hour_usage),
                    "day": max(0, api_key_record.rate_limit_per_day - day_usage)
                }
            }
            
        except Exception as e:
            logger.error(f"Error checking rate limit: {e}")
            return {
                "rate_limited": False,
                "error": str(e)
            }
    
    @staticmethod
    def check_ip_restriction(api_key_record: APIKey, client_ip: str) -> bool:
        """
        Check if client IP is allowed for this API key.
        
        Returns True if IP is allowed or no restrictions are set.
        """
        if not api_key_record.allowed_ips:
            return True  # No IP restrictions
        
        # Simple IP matching (could be enhanced with CIDR support)
        return client_ip in api_key_record.allowed_ips
    
    @staticmethod
    def log_api_usage(
        db: Session,
        api_key_id: int,
        endpoint: str,
        method: str,
        status_code: int,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        response_time_ms: Optional[int] = None,
        tokens_used: Optional[int] = None,
        credits_consumed: Optional[float] = None,
        error_message: Optional[str] = None,
        error_code: Optional[str] = None
    ):
        """Log API key usage for monitoring and rate limiting."""
        try:
            usage_record = APIKeyUsage(
                api_key_id=api_key_id,
                endpoint=endpoint,
                method=method,
                status_code=status_code,
                ip_address=ip_address,
                user_agent=user_agent,
                response_time_ms=response_time_ms,
                tokens_used=tokens_used,
                credits_consumed=credits_consumed,
                error_message=error_message,
                error_code=error_code
            )
            
            db.add(usage_record)
            db.commit()
            
        except Exception as e:
            logger.error(f"Failed to log API usage: {e}")
            db.rollback()
    
    @staticmethod
    def get_user_api_keys(db: Session, user_id: int, workspace_id: int) -> List[Dict[str, Any]]:
        """
        Get all API keys for a user in a workspace.
        
        Never returns the actual key values, only metadata.
        """
        try:
            api_keys = db.query(APIKey).filter(
                APIKey.user_id == user_id,
                APIKey.workspace_id == workspace_id
            ).order_by(APIKey.created_at.desc()).all()
            
            result = []
            for key in api_keys:
                result.append({
                    "id": key.id,
                    "key_prefix": key.key_prefix,
                    "name": key.name,
                    "description": key.description,
                    "scopes": key.scopes,
                    "is_active": key.is_active,
                    "last_used_at": key.last_used_at.isoformat() if key.last_used_at else None,
                    "usage_count": key.usage_count,
                    "rate_limits": {
                        "per_minute": key.rate_limit_per_minute,
                        "per_hour": key.rate_limit_per_hour,
                        "per_day": key.rate_limit_per_day
                    },
                    "allowed_ips": key.allowed_ips,
                    "expires_at": key.expires_at.isoformat() if key.expires_at else None,
                    "created_at": key.created_at.isoformat(),
                    "updated_at": key.updated_at.isoformat() if key.updated_at else None
                })
            
            return result
            
        except Exception as e:
            logger.error(f"Error getting user API keys: {e}")
            return []
    
    @staticmethod
    def revoke_api_key(db: Session, api_key_id: int, user_id: int, workspace_id: int) -> bool:
        """
        Revoke (deactivate) an API key.
        
        Only the owner or workspace admin can revoke keys.
        """
        try:
            # Find the API key
            api_key = db.query(APIKey).filter(
                APIKey.id == api_key_id,
                APIKey.workspace_id == workspace_id
            ).first()
            
            if not api_key:
                return False
            
            # Check permission - either owner of key or workspace admin
            if api_key.user_id != user_id:
                if not WorkspacePermissions.user_has_permission(db, user_id, workspace_id, 'member_remove'):
                    raise ValueError("No permission to revoke this API key")
            
            # Deactivate the key
            api_key.is_active = False
            api_key.updated_at = datetime.now(timezone.utc)
            
            db.commit()
            
            logger.info(f"API key revoked: {api_key.key_prefix}... by user {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error revoking API key: {e}")
            db.rollback()
            return False
    
    @staticmethod
    def update_api_key(
        db: Session,
        api_key_id: int,
        user_id: int,
        workspace_id: int,
        name: Optional[str] = None,
        description: Optional[str] = None,
        scopes: Optional[List[APIKeyScope]] = None,
        rate_limit_per_minute: Optional[int] = None,
        rate_limit_per_hour: Optional[int] = None,
        rate_limit_per_day: Optional[int] = None,
        allowed_ips: Optional[List[str]] = None,
        expires_at: Optional[datetime] = None
    ) -> bool:
        """Update API key settings."""
        try:
            # Find the API key
            api_key = db.query(APIKey).filter(
                APIKey.id == api_key_id,
                APIKey.workspace_id == workspace_id
            ).first()
            
            if not api_key:
                return False
            
            # Check permission
            if api_key.user_id != user_id:
                if not WorkspacePermissions.user_has_permission(db, user_id, workspace_id, 'resource_edit_all'):
                    raise ValueError("No permission to update this API key")
            
            # Update fields
            if name is not None:
                api_key.name = name
            if description is not None:
                api_key.description = description
            if scopes is not None:
                api_key.scopes = [scope.value for scope in scopes]
            if rate_limit_per_minute is not None:
                api_key.rate_limit_per_minute = rate_limit_per_minute
            if rate_limit_per_hour is not None:
                api_key.rate_limit_per_hour = rate_limit_per_hour
            if rate_limit_per_day is not None:
                api_key.rate_limit_per_day = rate_limit_per_day
            if allowed_ips is not None:
                api_key.allowed_ips = allowed_ips
            if expires_at is not None:
                api_key.expires_at = expires_at
            
            api_key.updated_at = datetime.now(timezone.utc)
            db.commit()
            
            logger.info(f"API key updated: {api_key.key_prefix}... by user {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error updating API key: {e}")
            db.rollback()
            return False
    
    @staticmethod
    def get_api_key_usage_stats(
        db: Session,
        api_key_id: int,
        user_id: int,
        workspace_id: int,
        days: int = 30
    ) -> Dict[str, Any]:
        """Get usage statistics for an API key."""
        try:
            # Verify permission
            api_key = db.query(APIKey).filter(
                APIKey.id == api_key_id,
                APIKey.workspace_id == workspace_id
            ).first()
            
            if not api_key:
                return {}
            
            if api_key.user_id != user_id:
                if not WorkspacePermissions.user_has_permission(db, user_id, workspace_id, 'analytics_view_all'):
                    raise ValueError("No permission to view usage stats")
            
            # Get usage data for the specified period
            since_date = datetime.now(timezone.utc) - timedelta(days=days)
            
            usage_records = db.query(APIKeyUsage).filter(
                APIKeyUsage.api_key_id == api_key_id,
                APIKeyUsage.timestamp >= since_date
            ).all()
            
            # Calculate statistics
            total_requests = len(usage_records)
            successful_requests = len([r for r in usage_records if 200 <= r.status_code < 300])
            error_requests = len([r for r in usage_records if r.status_code >= 400])
            
            # Group by endpoint
            endpoint_stats = {}
            for record in usage_records:
                endpoint = record.endpoint
                if endpoint not in endpoint_stats:
                    endpoint_stats[endpoint] = {"count": 0, "errors": 0}
                endpoint_stats[endpoint]["count"] += 1
                if record.status_code >= 400:
                    endpoint_stats[endpoint]["errors"] += 1
            
            # Calculate totals
            total_tokens = sum(r.tokens_used for r in usage_records if r.tokens_used)
            total_credits = sum(r.credits_consumed for r in usage_records if r.credits_consumed)
            avg_response_time = sum(r.response_time_ms for r in usage_records if r.response_time_ms) / max(1, len([r for r in usage_records if r.response_time_ms]))
            
            return {
                "period_days": days,
                "total_requests": total_requests,
                "successful_requests": successful_requests,
                "error_requests": error_requests,
                "success_rate": (successful_requests / max(1, total_requests)) * 100,
                "total_tokens_used": total_tokens,
                "total_credits_consumed": total_credits,
                "average_response_time_ms": round(avg_response_time, 2) if avg_response_time else 0,
                "endpoint_breakdown": endpoint_stats
            }
            
        except Exception as e:
            logger.error(f"Error getting API key usage stats: {e}")
            return {"error": str(e)}