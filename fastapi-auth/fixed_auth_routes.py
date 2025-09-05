"""
Fixed Authentication Routes ohne E-Mail Abhängigkeiten
Includes Google OAuth integration
"""

import logging
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
import httpx
import os

from database import get_db
from models import User, Workspace, WorkspaceMember, WorkspaceRole
from auth import verify_password, get_password_hash, create_access_token, get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["authentication"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# Google OAuth Configuration
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI = "http://localhost:8002/auth/google/callback"

# Pydantic models
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str


class UserResponse(BaseModel):
    id: int
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    is_active: bool = True
    is_verified: bool = False
    created_at: datetime

    class Config:
        from_attributes = True


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


class GoogleLoginRequest(BaseModel):
    credential: str  # Google JWT token


@router.post("/register", response_model=dict)
async def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user without email sending."""
    try:
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == user_data.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="E-Mail ist bereits registriert"
            )

        # Create new user
        hashed_password = get_password_hash(user_data.password)
        new_user = User(
            email=user_data.email,
            hashed_password=hashed_password,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            is_active=True,
            is_verified=True  # Skip email verification for now
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        # Create a default workspace for the user
        workspace_name = f"{user_data.first_name}'s Workspace"
        if len(workspace_name) > 50:
            workspace_name = f"Workspace {new_user.id}"
            
        default_workspace = Workspace(
            name=workspace_name,
            slug=f"workspace-{new_user.id}",
            description="Ihr persönlicher Workspace",
            plan="free",
            credits_limit=100.0,
            current_credits=100.0  # Start with 100 free credits
        )
        db.add(default_workspace)
        db.commit()
        db.refresh(default_workspace)

        # Add user as owner of the workspace
        membership = WorkspaceMember(
            user_id=new_user.id,
            workspace_id=default_workspace.id,
            role=WorkspaceRole.OWNER,
            is_active=True
        )
        db.add(membership)
        
        # Set current workspace
        new_user.current_workspace_id = default_workspace.id
        db.commit()

        logger.info(f"User registered successfully: {user_data.email}")
        
        return {
            "success": True,
            "message": "Registrierung erfolgreich! Sie können sich jetzt anmelden.",
            "user_id": new_user.id
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut."
        )


@router.post("/login", response_model=LoginResponse)
async def login_user(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Login user and return access token."""
    try:
        # Find user by email
        user = db.query(User).filter(User.email == form_data.username).first()
        
        if not user or not verify_password(form_data.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Ungültige E-Mail oder Passwort",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account ist deaktiviert",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Create access token
        access_token_expires = timedelta(hours=24)  # Longer session
        access_token = create_access_token(
            data={"sub": user.email},
            expires_delta=access_token_expires
        )

        logger.info(f"User logged in successfully: {user.email}")

        return LoginResponse(
            access_token=access_token,
            token_type="bearer",
            user=UserResponse.model_validate(user)
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut."
        )


@router.get("/google/login")
async def google_login():
    """Initiate Google OAuth login."""
    google_auth_url = (
        f"https://accounts.google.com/o/oauth2/auth?"
        f"client_id={GOOGLE_CLIENT_ID}&"
        f"redirect_uri={GOOGLE_REDIRECT_URI}&"
        f"scope=openid email profile&"
        f"response_type=code&"
        f"access_type=offline"
    )
    
    return {"auth_url": google_auth_url}


@router.get("/google/callback")
async def google_callback(code: str, db: Session = Depends(get_db)):
    """Handle Google OAuth callback."""
    try:
        # Exchange code for tokens
        token_url = "https://oauth2.googleapis.com/token"
        token_data = {
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": GOOGLE_REDIRECT_URI,
        }
        
        async with httpx.AsyncClient() as client:
            token_response = await client.post(token_url, data=token_data)
            token_response.raise_for_status()
            tokens = token_response.json()
        
        # Get user info from Google
        user_info_url = f"https://www.googleapis.com/oauth2/v2/userinfo?access_token={tokens['access_token']}"
        async with httpx.AsyncClient() as client:
            user_response = await client.get(user_info_url)
            user_response.raise_for_status()
            google_user = user_response.json()
        
        # Check if user exists
        user = db.query(User).filter(User.email == google_user["email"]).first()
        
        if not user:
            # Create new user from Google data
            user = User(
                email=google_user["email"],
                hashed_password=get_password_hash(secrets.token_urlsafe(32)),  # Random password
                first_name=google_user.get("given_name", ""),
                last_name=google_user.get("family_name", ""),
                is_active=True,
                is_verified=True,
                avatar_url=google_user.get("picture")
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            
            # Create default workspace
            default_workspace = Workspace(
                name=f"{user.first_name}'s Workspace",
                slug=f"workspace-{user.id}",
                description="Ihr persönlicher Workspace",
                plan="free",
                credits_limit=100.0,
                current_credits=100.0
            )
            db.add(default_workspace)
            db.commit()
            db.refresh(default_workspace)
            
            # Add user as owner
            membership = WorkspaceMember(
                user_id=user.id,
                workspace_id=default_workspace.id,
                role=WorkspaceRole.OWNER,
                is_active=True
            )
            db.add(membership)
            user.current_workspace_id = default_workspace.id
            db.commit()
        
        # Create access token
        access_token = create_access_token(
            data={"sub": user.email},
            expires_delta=timedelta(hours=24)
        )
        
        # Redirect to dashboard with token
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "redirect_url": "/dashboard"
        }
        
    except Exception as e:
        logger.error(f"Google OAuth error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google Anmeldung fehlgeschlagen"
        )


@router.post("/google/login")
async def google_login_direct(request: GoogleLoginRequest, db: Session = Depends(get_db)):
    """Direct Google login with credential token."""
    try:
        # Verify Google JWT token
        verify_url = f"https://oauth2.googleapis.com/tokeninfo?id_token={request.credential}"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(verify_url)
            response.raise_for_status()
            google_user = response.json()
        
        # Verify audience (your Google Client ID)
        if GOOGLE_CLIENT_ID and google_user.get("aud") != GOOGLE_CLIENT_ID:
            raise HTTPException(status_code=401, detail="Invalid token audience")
        
        # Check if user exists
        user = db.query(User).filter(User.email == google_user["email"]).first()
        
        if not user:
            # Create new user
            user = User(
                email=google_user["email"],
                hashed_password=get_password_hash(secrets.token_urlsafe(32)),
                first_name=google_user.get("given_name", ""),
                last_name=google_user.get("family_name", ""),
                is_active=True,
                is_verified=True,
                avatar_url=google_user.get("picture")
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            
            # Create workspace
            default_workspace = Workspace(
                name=f"{user.first_name}'s Workspace",
                slug=f"workspace-{user.id}",
                description="Ihr persönlicher Workspace",
                plan="free"
            )
            db.add(default_workspace)
            db.commit()
            db.refresh(default_workspace)
            
            membership = WorkspaceMember(
                user_id=user.id,
                workspace_id=default_workspace.id,
                role=WorkspaceRole.OWNER,
                is_active=True
            )
            db.add(membership)
            user.current_workspace_id = default_workspace.id
            db.commit()
        
        # Create access token
        access_token = create_access_token(
            data={"sub": user.email},
            expires_delta=timedelta(hours=24)
        )
        
        return LoginResponse(
            access_token=access_token,
            token_type="bearer",
            user=UserResponse.model_validate(user)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Google login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google Anmeldung fehlgeschlagen"
        )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information."""
    return UserResponse.model_validate(current_user)


@router.post("/logout")
async def logout_user():
    """Logout user (client should delete token)."""
    return {"message": "Erfolgreich abgemeldet"}