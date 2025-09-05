"""
API Key Management Routes for VoicePartnerAI
Provides endpoints for developers to manage their API keys
"""

from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, validator, Field

from database import get_db
from auth import get_current_user  # Your existing auth system
from models import User, APIKeyScope
from api_key_manager import APIKeyManager
from workspace_permissions import require_workspace_membership

router = APIRouter(prefix="/api/v1/api-keys", tags=["API Keys"])

# Pydantic Models for API Key Management

class APIKeyCreate(BaseModel):
    """Schema for creating a new API key."""
    name: str = Field(..., min_length=1, max_length=100, description="Human-readable name for the API key")
    description: Optional[str] = Field(None, max_length=500, description="Optional description of the API key's purpose")
    scopes: List[APIKeyScope] = Field(default=[APIKeyScope.READ, APIKeyScope.WRITE], description="Permissions granted to this API key")
    rate_limit_per_minute: int = Field(default=60, ge=1, le=1000, description="Requests per minute limit")
    rate_limit_per_hour: int = Field(default=1000, ge=1, le=50000, description="Requests per hour limit")
    rate_limit_per_day: int = Field(default=10000, ge=1, le=1000000, description="Requests per day limit")
    allowed_ips: Optional[List[str]] = Field(None, description="List of allowed IP addresses (optional)")
    expires_in_days: Optional[int] = Field(None, ge=1, le=365, description="Number of days until expiration (optional)")
    
    @validator('scopes')
    def validate_scopes(cls, v):
        if not v:
            raise ValueError('At least one scope must be specified')
        return v
    
    @validator('allowed_ips')
    def validate_ips(cls, v):
        if v:
            # Basic IP validation (could be enhanced)
            import ipaddress
            for ip in v:
                try:
                    ipaddress.ip_address(ip)
                except ValueError:
                    raise ValueError(f'Invalid IP address: {ip}')
        return v

class APIKeyUpdate(BaseModel):
    """Schema for updating an existing API key."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    scopes: Optional[List[APIKeyScope]] = None
    rate_limit_per_minute: Optional[int] = Field(None, ge=1, le=1000)
    rate_limit_per_hour: Optional[int] = Field(None, ge=1, le=50000)
    rate_limit_per_day: Optional[int] = Field(None, ge=1, le=1000000)
    allowed_ips: Optional[List[str]] = None
    expires_in_days: Optional[int] = Field(None, ge=1, le=365)

class APIKeyResponse(BaseModel):
    """Schema for API key response (without the actual key)."""
    id: int
    key_prefix: str
    name: str
    description: Optional[str]
    scopes: List[str]
    is_active: bool
    last_used_at: Optional[str]
    usage_count: int
    rate_limits: Dict[str, int]
    allowed_ips: Optional[List[str]]
    expires_at: Optional[str]
    created_at: str
    updated_at: Optional[str]

class APIKeyCreateResponse(BaseModel):
    """Schema for API key creation response (includes the actual key)."""
    id: int
    api_key: str = Field(..., description="The actual API key - save this securely as it won't be shown again!")
    key_prefix: str
    name: str
    description: Optional[str]
    scopes: List[str]
    rate_limits: Dict[str, int]
    allowed_ips: Optional[List[str]]
    expires_at: Optional[str]
    created_at: str
    is_active: bool

class APIKeyUsageStats(BaseModel):
    """Schema for API key usage statistics."""
    period_days: int
    total_requests: int
    successful_requests: int
    error_requests: int
    success_rate: float
    total_tokens_used: int
    total_credits_consumed: float
    average_response_time_ms: float
    endpoint_breakdown: Dict[str, Dict[str, int]]

# API Key Management Endpoints

@router.post("/", response_model=APIKeyCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_api_key(
    api_key_data: APIKeyCreate,
    workspace_id: int = Query(..., description="Workspace ID to create the API key for"),
    current_user: User = Depends(get_current_user),
    membership = Depends(require_workspace_membership),
    db: Session = Depends(get_db)
):
    """
    Create a new API key for external development access.
    
    **Important**: The actual API key is only returned once in this response. 
    Store it securely as it cannot be retrieved again.
    
    **Scopes available**:
    - `read`: Read-only access to resources
    - `write`: Create and modify resources
    - `admin`: Administrative operations (requires admin role)
    - `full_access`: All operations (requires owner role)
    
    **Rate Limits**:
    - Default limits are applied but can be customized
    - Limits are enforced per API key across all requests
    
    **IP Restrictions**:
    - Optional: Restrict API key usage to specific IP addresses
    - Leave empty to allow access from any IP
    
    **Example**:
    ```json
    {
        "name": "My Mobile App",
        "description": "API key for iOS/Android app",
        "scopes": ["read", "write"],
        "rate_limit_per_minute": 120,
        "expires_in_days": 365
    }
    ```
    """
    try:
        # Calculate expiration date if specified
        expires_at = None
        if api_key_data.expires_in_days:
            expires_at = datetime.now(timezone.utc) + timedelta(days=api_key_data.expires_in_days)
        
        # Create the API key
        result = APIKeyManager.create_api_key(
            db=db,
            user_id=current_user.id,
            workspace_id=workspace_id,
            name=api_key_data.name,
            description=api_key_data.description,
            scopes=api_key_data.scopes,
            rate_limit_per_minute=api_key_data.rate_limit_per_minute,
            rate_limit_per_hour=api_key_data.rate_limit_per_hour,
            rate_limit_per_day=api_key_data.rate_limit_per_day,
            allowed_ips=api_key_data.allowed_ips,
            expires_at=expires_at
        )
        
        return APIKeyCreateResponse(**result)
        
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create API key")

@router.get("/", response_model=List[APIKeyResponse])
async def list_api_keys(
    workspace_id: int = Query(..., description="Workspace ID to list API keys for"),
    current_user: User = Depends(get_current_user),
    membership = Depends(require_workspace_membership),
    db: Session = Depends(get_db)
):
    """
    List all API keys for the current user in the specified workspace.
    
    **Returns**:
    - All API keys created by the current user
    - Key prefixes for identification (actual keys are never returned)
    - Usage statistics and current status
    - Rate limit configurations
    
    **Note**: Only shows API keys you created. Workspace admins can see all keys via the admin endpoints.
    """
    try:
        api_keys = APIKeyManager.get_user_api_keys(db, current_user.id, workspace_id)
        return [APIKeyResponse(**key) for key in api_keys]
        
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to list API keys")

@router.get("/{api_key_id}", response_model=APIKeyResponse)
async def get_api_key(
    api_key_id: int,
    workspace_id: int = Query(..., description="Workspace ID"),
    current_user: User = Depends(get_current_user),
    membership = Depends(require_workspace_membership),
    db: Session = Depends(get_db)
):
    """
    Get details of a specific API key.
    
    **Returns**:
    - Complete API key metadata
    - Current usage statistics
    - Rate limit status
    
    **Access**: Only the creator of the API key or workspace admins can view details.
    """
    try:
        # Get all user's API keys and find the specific one
        api_keys = APIKeyManager.get_user_api_keys(db, current_user.id, workspace_id)
        api_key = next((key for key in api_keys if key["id"] == api_key_id), None)
        
        if not api_key:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="API key not found")
        
        return APIKeyResponse(**api_key)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to get API key")

@router.put("/{api_key_id}", response_model=APIKeyResponse)
async def update_api_key(
    api_key_id: int,
    api_key_data: APIKeyUpdate,
    workspace_id: int = Query(..., description="Workspace ID"),
    current_user: User = Depends(get_current_user),
    membership = Depends(require_workspace_membership),
    db: Session = Depends(get_db)
):
    """
    Update an existing API key's settings.
    
    **What can be updated**:
    - Name and description
    - Scopes and permissions
    - Rate limits
    - IP restrictions
    - Expiration date
    
    **What cannot be updated**:
    - The actual API key value (create a new key instead)
    - Creation date
    - Usage statistics
    
    **Example**:
    ```json
    {
        "name": "Updated Mobile App Key",
        "rate_limit_per_minute": 200,
        "scopes": ["read", "write", "admin"]
    }
    ```
    """
    try:
        # Calculate new expiration date if specified
        expires_at = None
        if api_key_data.expires_in_days:
            expires_at = datetime.now(timezone.utc) + timedelta(days=api_key_data.expires_in_days)
        
        # Update the API key
        success = APIKeyManager.update_api_key(
            db=db,
            api_key_id=api_key_id,
            user_id=current_user.id,
            workspace_id=workspace_id,
            name=api_key_data.name,
            description=api_key_data.description,
            scopes=api_key_data.scopes,
            rate_limit_per_minute=api_key_data.rate_limit_per_minute,
            rate_limit_per_hour=api_key_data.rate_limit_per_hour,
            rate_limit_per_day=api_key_data.rate_limit_per_day,
            allowed_ips=api_key_data.allowed_ips,
            expires_at=expires_at
        )
        
        if not success:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="API key not found or no permission")
        
        # Return updated API key details
        api_keys = APIKeyManager.get_user_api_keys(db, current_user.id, workspace_id)
        api_key = next((key for key in api_keys if key["id"] == api_key_id), None)
        
        if not api_key:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="API key not found")
        
        return APIKeyResponse(**api_key)
        
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update API key")

@router.delete("/{api_key_id}", status_code=status.HTTP_204_NO_CONTENT)
async def revoke_api_key(
    api_key_id: int,
    workspace_id: int = Query(..., description="Workspace ID"),
    current_user: User = Depends(get_current_user),
    membership = Depends(require_workspace_membership),
    db: Session = Depends(get_db)
):
    """
    Revoke (deactivate) an API key.
    
    **Effect**:
    - The API key becomes immediately inactive
    - All future requests with this key will be rejected
    - Usage history is preserved for audit purposes
    - The operation cannot be undone - create a new key if needed
    
    **Access**: Only the creator of the API key or workspace admins can revoke keys.
    
    **Warning**: This action is irreversible. Make sure to update any applications using this key.
    """
    try:
        success = APIKeyManager.revoke_api_key(
            db=db,
            api_key_id=api_key_id,
            user_id=current_user.id,
            workspace_id=workspace_id
        )
        
        if not success:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="API key not found or no permission")
        
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to revoke API key")

@router.get("/{api_key_id}/usage", response_model=APIKeyUsageStats)
async def get_api_key_usage(
    api_key_id: int,
    workspace_id: int = Query(..., description="Workspace ID"),
    days: int = Query(default=30, ge=1, le=365, description="Number of days to analyze"),
    current_user: User = Depends(get_current_user),
    membership = Depends(require_workspace_membership),
    db: Session = Depends(get_db)
):
    """
    Get detailed usage statistics for an API key.
    
    **Statistics include**:
    - Total requests and success rate
    - Endpoint usage breakdown
    - Token consumption (for AI endpoints)
    - Credit usage and costs
    - Average response times
    - Error analysis
    
    **Time Period**:
    - Specify the number of days to analyze (1-365)
    - Default: 30 days
    
    **Access**: Only the creator of the API key or workspace admins can view usage stats.
    
    **Example Response**:
    ```json
    {
        "period_days": 30,
        "total_requests": 1250,
        "successful_requests": 1200,
        "error_requests": 50,
        "success_rate": 96.0,
        "total_tokens_used": 45000,
        "total_credits_consumed": 12.50,
        "average_response_time_ms": 450.2,
        "endpoint_breakdown": {
            "/api/v1/assistants": {"count": 800, "errors": 10},
            "/api/v1/calls": {"count": 450, "errors": 40}
        }
    }
    ```
    """
    try:
        stats = APIKeyManager.get_api_key_usage_stats(
            db=db,
            api_key_id=api_key_id,
            user_id=current_user.id,
            workspace_id=workspace_id,
            days=days
        )
        
        if "error" in stats:
            if "No permission" in stats["error"]:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=stats["error"])
            else:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="API key not found")
        
        return APIKeyUsageStats(**stats)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to get usage statistics")

# Admin endpoints (for workspace owners/admins)

@router.get("/admin/all", response_model=List[APIKeyResponse])
async def list_all_workspace_api_keys(
    workspace_id: int = Query(..., description="Workspace ID"),
    current_user: User = Depends(get_current_user),
    membership = Depends(require_workspace_membership),
    db: Session = Depends(get_db)
):
    """
    **[Admin Only]** List all API keys in the workspace.
    
    **Access**: Requires workspace admin or owner role.
    
    **Returns**:
    - All API keys created by any user in the workspace
    - Creator information for each key
    - Usage statistics and status
    
    **Use Cases**:
    - Audit API key usage across the team
    - Monitor security and compliance
    - Manage team's external integrations
    """
    try:
        # Check admin permission
        from workspace_permissions import WorkspacePermissions
        if not WorkspacePermissions.user_has_permission(db, current_user.id, workspace_id, 'member_remove'):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
        
        # Get all API keys in the workspace
        from models import APIKey
        api_keys = db.query(APIKey).filter(APIKey.workspace_id == workspace_id).all()
        
        result = []
        for key in api_keys:
            # Get creator info
            creator = db.query(User).filter(User.id == key.user_id).first()
            creator_email = creator.email if creator else "Unknown"
            
            key_data = {
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
                "updated_at": key.updated_at.isoformat() if key.updated_at else None,
                "creator_email": creator_email  # Additional field for admin view
            }
            result.append(key_data)
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to list workspace API keys")

# Utility endpoints

@router.get("/scopes", response_model=Dict[str, str])
async def get_available_scopes():
    """
    Get all available API key scopes and their descriptions.
    
    **Returns**: A dictionary mapping scope names to their descriptions.
    
    **Use this endpoint** to understand what permissions each scope grants
    before creating or updating API keys.
    """
    return {
        "read": "Read-only access to all resources the user has access to",
        "write": "Create and modify resources (assistants, files, tools, etc.)",
        "admin": "Administrative operations within the workspace (requires admin role)",
        "full_access": "Complete access to all operations (requires owner role)"
    }

@router.post("/validate", response_model=Dict[str, Any])
async def validate_api_key_endpoint(
    api_key: str = Query(..., description="API key to validate"),
    db: Session = Depends(get_db)
):
    """
    **[Development/Testing Only]** Validate an API key and return its details.
    
    **Warning**: This endpoint should be removed or protected in production.
    
    **Use Cases**:
    - Test API key validity during development
    - Debug authentication issues
    - Verify key permissions and rate limits
    
    **Returns**:
    - API key validation status
    - Associated user and workspace information
    - Current rate limit status
    - Scope and permission details
    """
    try:
        api_key_record = APIKeyManager.validate_api_key(db, api_key)
        
        if not api_key_record:
            return {
                "valid": False,
                "message": "Invalid, expired, or inactive API key"
            }
        
        # Get rate limit status
        rate_limit_status = APIKeyManager.check_rate_limit(db, api_key_record)
        
        return {
            "valid": True,
            "api_key_id": api_key_record.id,
            "name": api_key_record.name,
            "user_id": api_key_record.user_id,
            "workspace_id": api_key_record.workspace_id,
            "scopes": api_key_record.scopes,
            "usage_count": api_key_record.usage_count,
            "last_used_at": api_key_record.last_used_at.isoformat() if api_key_record.last_used_at else None,
            "rate_limit_status": rate_limit_status,
            "expires_at": api_key_record.expires_at.isoformat() if api_key_record.expires_at else None
        }
        
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to validate API key")