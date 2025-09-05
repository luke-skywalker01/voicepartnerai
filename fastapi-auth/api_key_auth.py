"""
API Key Authentication System for VoicePartnerAI
Provides authentication via API keys in addition to JWT tokens
"""

import logging
from typing import Optional, Union, Tuple
from datetime import datetime, timezone

from fastapi import Depends, HTTPException, status, Header, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from database import get_db
from models import User, APIKey, APIKeyScope
from api_key_manager import APIKeyManager
from auth import get_current_user  # Your existing JWT auth
from workspace_permissions import WorkspacePermissions

logger = logging.getLogger(__name__)

# Security scheme for API key authentication
api_key_header = HTTPBearer(scheme_name="API Key", description="API Key Authentication")

class APIKeyAuth:
    """Authentication context from API key."""
    
    def __init__(self, api_key_record: APIKey, user: User):
        self.api_key_record = api_key_record
        self.user = user
        self.workspace_id = api_key_record.workspace_id
        self.scopes = api_key_record.scopes
        self.user_id = user.id
    
    def has_scope(self, required_scope: Union[str, APIKeyScope]) -> bool:
        """Check if the API key has the required scope."""
        if isinstance(required_scope, APIKeyScope):
            required_scope = required_scope.value
        
        return (
            required_scope in self.scopes or 
            APIKeyScope.FULL_ACCESS.value in self.scopes
        )
    
    def can_access_workspace(self, workspace_id: int) -> bool:
        """Check if the API key can access the specified workspace."""
        return self.workspace_id == workspace_id
    
    def has_workspace_permission(self, db: Session, permission: str) -> bool:
        """Check if the user has the required workspace permission."""
        return WorkspacePermissions.user_has_permission(
            db, self.user_id, self.workspace_id, permission
        )

class AuthenticationResult:
    """Result of authentication attempt."""
    
    def __init__(self, user: User, auth_method: str, api_key_auth: Optional[APIKeyAuth] = None):
        self.user = user
        self.auth_method = auth_method  # "jwt" or "api_key"
        self.api_key_auth = api_key_auth
        self.workspace_id = api_key_auth.workspace_id if api_key_auth else None

async def authenticate_api_key(
    request: Request,
    x_api_key: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> Optional[APIKeyAuth]:
    """
    Authenticate using API key from X-API-Key header.
    
    Returns APIKeyAuth object if valid, None otherwise.
    """
    if not x_api_key:
        return None
    
    try:
        # Validate the API key
        api_key_record = APIKeyManager.validate_api_key(db, x_api_key)
        
        if not api_key_record:
            logger.warning(f"Invalid API key used from IP {request.client.host}")
            return None
        
        # Check IP restrictions
        client_ip = request.client.host if request.client else None
        if not APIKeyManager.check_ip_restriction(api_key_record, client_ip):
            logger.warning(f"API key {api_key_record.key_prefix}... blocked due to IP restriction. Client IP: {client_ip}")
            return None
        
        # Check rate limits
        rate_limit_status = APIKeyManager.check_rate_limit(db, api_key_record, client_ip)
        if rate_limit_status.get("rate_limited"):
            limit_type = rate_limit_status.get("limit_type", "unknown")
            logger.warning(f"API key {api_key_record.key_prefix}... rate limited ({limit_type})")
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded: {limit_type}ly limit reached"
            )
        
        # Get the user associated with the API key
        user = db.query(User).filter(User.id == api_key_record.user_id).first()
        if not user:
            logger.error(f"User not found for API key {api_key_record.key_prefix}...")
            return None
        
        # Log the API usage (this will be done by middleware)
        # APIKeyManager.log_api_usage() is called by the middleware
        
        logger.info(f"API key authentication successful: {api_key_record.key_prefix}... for user {user.id}")
        
        return APIKeyAuth(api_key_record, user)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"API key authentication error: {e}")
        return None

async def get_current_user_flexible(
    request: Request,
    db: Session = Depends(get_db),
    # Try JWT authentication first
    jwt_user: Optional[User] = Depends(lambda: None),  # We'll handle JWT separately
    # Try API key authentication
    api_key_auth: Optional[APIKeyAuth] = Depends(authenticate_api_key)
) -> AuthenticationResult:
    """
    Flexible authentication that accepts either JWT or API key.
    
    Priority:
    1. JWT token (if present and valid)
    2. API key (if present and valid)
    3. Raise authentication error
    """
    # Try JWT authentication first
    try:
        from auth import get_current_user
        jwt_user = await get_current_user(request, db)
        if jwt_user:
            return AuthenticationResult(jwt_user, "jwt")
    except HTTPException:
        # JWT auth failed, continue to API key auth
        pass
    except Exception as e:
        logger.debug(f"JWT authentication attempt failed: {e}")
    
    # Try API key authentication
    if api_key_auth:
        return AuthenticationResult(api_key_auth.user, "api_key", api_key_auth)
    
    # Both authentication methods failed
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required. Provide either a valid JWT token or API key.",
        headers={"WWW-Authenticate": "Bearer"}
    )

async def require_api_key_auth(
    api_key_auth: Optional[APIKeyAuth] = Depends(authenticate_api_key)
) -> APIKeyAuth:
    """
    Dependency that requires API key authentication specifically.
    
    Use this for endpoints that should only accept API key authentication.
    """
    if not api_key_auth:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Valid API key required",
            headers={"X-API-Key": "Required"}
        )
    
    return api_key_auth

def require_api_key_scope(required_scope: Union[str, APIKeyScope]):
    """
    Dependency factory that requires a specific API key scope.
    
    Usage:
    @app.get("/api/v1/data")
    async def get_data(auth: APIKeyAuth = Depends(require_api_key_scope(APIKeyScope.READ))):
        ...
    """
    async def check_scope(
        api_key_auth: APIKeyAuth = Depends(require_api_key_auth)
    ) -> APIKeyAuth:
        if not api_key_auth.has_scope(required_scope):
            scope_name = required_scope.value if isinstance(required_scope, APIKeyScope) else required_scope
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required scope: {scope_name}"
            )
        
        return api_key_auth
    
    return check_scope

def require_workspace_access(workspace_id: int):
    """
    Dependency factory that requires access to a specific workspace.
    
    Works with both JWT and API key authentication.
    """
    async def check_workspace_access(
        auth_result: AuthenticationResult = Depends(get_current_user_flexible),
        db: Session = Depends(get_db)
    ) -> AuthenticationResult:
        
        if auth_result.auth_method == "api_key":
            # For API key auth, check if key is scoped to the workspace
            if not auth_result.api_key_auth.can_access_workspace(workspace_id):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"API key does not have access to workspace {workspace_id}"
                )
        else:
            # For JWT auth, check workspace membership
            if not WorkspacePermissions.get_user_workspace_role(db, auth_result.user.id, workspace_id):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"User does not have access to workspace {workspace_id}"
                )
        
        return auth_result
    
    return check_workspace_access

# Middleware for API key usage logging

class APIKeyLoggingMiddleware:
    """Middleware to log API key usage for rate limiting and analytics."""
    
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        
        # Track request start time
        start_time = datetime.now()
        
        # Create request wrapper to capture response details
        response_details = {"status_code": 200, "response_time_ms": 0}
        
        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                response_details["status_code"] = message["status"]
                response_details["response_time_ms"] = int(
                    (datetime.now() - start_time).total_seconds() * 1000
                )
            await send(message)
        
        # Process request
        await self.app(scope, receive, send_wrapper)
        
        # Log API key usage if it was an API key request
        await self._log_api_key_usage(scope, response_details)
    
    async def _log_api_key_usage(self, scope, response_details):
        """Log API key usage to database."""
        try:
            # Extract API key from headers
            headers = dict(scope.get("headers", []))
            x_api_key = headers.get(b"x-api-key")
            
            if not x_api_key:
                return  # Not an API key request
            
            x_api_key = x_api_key.decode()
            
            # Get database session (this is a simplified version)
            from database import SessionLocal
            db = SessionLocal()
            
            try:
                # Find the API key record
                api_key_record = APIKeyManager.validate_api_key(db, x_api_key)
                
                if api_key_record:
                    # Extract request details
                    method = scope.get("method", "GET")
                    path = scope.get("path", "/")
                    query_string = scope.get("query_string", b"").decode()
                    endpoint = f"{path}?{query_string}" if query_string else path
                    
                    # Extract client details
                    client_info = scope.get("client", ["unknown", 0])
                    client_ip = client_info[0] if client_info else None
                    
                    # Get user agent from headers
                    user_agent = headers.get(b"user-agent")
                    user_agent = user_agent.decode() if user_agent else None
                    
                    # Log the usage
                    APIKeyManager.log_api_usage(
                        db=db,
                        api_key_id=api_key_record.id,
                        endpoint=endpoint,
                        method=method,
                        status_code=response_details["status_code"],
                        ip_address=client_ip,
                        user_agent=user_agent,
                        response_time_ms=response_details["response_time_ms"]
                    )
                    
            finally:
                db.close()
                
        except Exception as e:
            logger.error(f"Failed to log API key usage: {e}")

# Utility functions for checking authentication method

def get_auth_method(auth_result: AuthenticationResult) -> str:
    """Get the authentication method used."""
    return auth_result.auth_method

def is_api_key_auth(auth_result: AuthenticationResult) -> bool:
    """Check if request was authenticated via API key."""
    return auth_result.auth_method == "api_key"

def is_jwt_auth(auth_result: AuthenticationResult) -> bool:
    """Check if request was authenticated via JWT."""
    return auth_result.auth_method == "jwt"

def get_api_key_info(auth_result: AuthenticationResult) -> Optional[dict]:
    """Get API key information if authenticated via API key."""
    if auth_result.api_key_auth:
        return {
            "key_id": auth_result.api_key_auth.api_key_record.id,
            "key_name": auth_result.api_key_auth.api_key_record.name,
            "key_prefix": auth_result.api_key_auth.api_key_record.key_prefix,
            "scopes": auth_result.api_key_auth.scopes,
            "workspace_id": auth_result.api_key_auth.workspace_id
        }
    return None

# Example usage in route handlers

async def example_protected_route(
    auth_result: AuthenticationResult = Depends(get_current_user_flexible),
    db: Session = Depends(get_db)
):
    """
    Example of a route that accepts both JWT and API key authentication.
    """
    if is_api_key_auth(auth_result):
        # Special handling for API key requests
        api_key_info = get_api_key_info(auth_result)
        logger.info(f"API key request from key: {api_key_info['key_name']}")
        
        # Check if API key has required permissions
        if not auth_result.api_key_auth.has_scope(APIKeyScope.READ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="API key requires 'read' scope"
            )
    
    # Process request normally
    return {"user_id": auth_result.user.id, "auth_method": auth_result.auth_method}

async def example_api_key_only_route(
    api_key_auth: APIKeyAuth = Depends(require_api_key_scope(APIKeyScope.WRITE))
):
    """
    Example of a route that only accepts API key authentication with specific scope.
    """
    return {
        "message": "API key authentication successful",
        "workspace_id": api_key_auth.workspace_id,
        "scopes": api_key_auth.scopes
    }