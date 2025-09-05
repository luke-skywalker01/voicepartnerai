"""
Authentication Routes with Email Integration
Demonstrates integration of lifecycle emails with auth endpoints
"""

import logging
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr

from database import get_db
from models import User, Workspace, WorkspaceMember, WorkspaceRole
from auth import verify_password, get_password_hash, create_access_token, get_current_user
from email_automation import send_welcome_email, send_password_reset, send_email_verification

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["authentication"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


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
    is_active: bool
    is_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


class RegistrationResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str


class EmailVerificationRequest(BaseModel):
    email: EmailStr


@router.post("/register", response_model=RegistrationResponse, status_code=status.HTTP_201_CREATED)
async def register_user(
    user_data: UserCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Register a new user with automatic welcome email.
    """
    try:
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == user_data.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email already exists"
            )
        
        # Create new user
        hashed_password = get_password_hash(user_data.password)
        db_user = User(
            email=user_data.email,
            hashed_password=hashed_password,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            is_active=True,
            is_verified=False,  # Email verification required
            created_at=datetime.now(timezone.utc)
        )
        
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        # Create access token
        access_token = create_access_token(data={"sub": db_user.email})
        
        # Create default workspace for user
        default_workspace = Workspace(
            name=f"{user_data.first_name}'s Workspace",
            slug=f"{user_data.first_name.lower()}-workspace-{secrets.token_hex(4)}",
            description="Your personal workspace",
            plan="free",
            created_at=datetime.now(timezone.utc)
        )
        
        db.add(default_workspace)
        db.commit()
        db.refresh(default_workspace)
        
        # Add user as owner of the workspace
        membership = WorkspaceMember(
            user_id=db_user.id,
            workspace_id=default_workspace.id,
            role=WorkspaceRole.OWNER,
            is_active=True,
            joined_at=datetime.now(timezone.utc)
        )
        
        db.add(membership)
        db.commit()
        
        # Send welcome email in background
        background_tasks.add_task(send_welcome_email, db_user, db)
        
        # Send email verification
        verification_token = secrets.token_urlsafe(32)
        # In production, store this token in database or Redis with expiration
        background_tasks.add_task(send_email_verification, db_user, verification_token, db)
        
        logger.info(f"New user registered: {db_user.email}")
        
        return RegistrationResponse(
            access_token=access_token,
            token_type="bearer",
            user=UserResponse.from_orm(db_user)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"User registration failed: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed. Please try again."
        )


@router.post("/login", response_model=LoginResponse)
async def login_user(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    Authenticate user and return access token.
    """
    try:
        # Find user by email
        user = db.query(User).filter(User.email == form_data.username).first()
        
        if not user or not verify_password(form_data.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account is deactivated",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Update last login
        user.last_login = datetime.now(timezone.utc)
        db.commit()
        
        # Create access token
        access_token = create_access_token(data={"sub": user.email})
        
        logger.info(f"User logged in: {user.email}")
        
        return LoginResponse(
            access_token=access_token,
            token_type="bearer",
            user=UserResponse.from_orm(user)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"User login failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed. Please try again."
        )


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user)
):
    """
    Get current user's profile information.
    """
    return UserResponse.from_orm(current_user)


@router.post("/forgot-password")
async def request_password_reset(
    request: PasswordResetRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Request password reset email.
    """
    try:
        # Find user by email
        user = db.query(User).filter(User.email == request.email).first()
        
        # Always return success to avoid user enumeration
        # But only send email if user exists
        if user and user.is_active:
            # Generate reset token
            reset_token = secrets.token_urlsafe(32)
            
            # In production, store this token in database or Redis with expiration
            # For now, we'll just send the email
            background_tasks.add_task(send_password_reset, user, reset_token, db)
            
            logger.info(f"Password reset requested for: {user.email}")
        
        return {"message": "If the email exists, a password reset link has been sent"}
        
    except Exception as e:
        logger.error(f"Password reset request failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Password reset request failed. Please try again."
        )


@router.post("/reset-password")
async def confirm_password_reset(
    request: PasswordResetConfirm,
    db: Session = Depends(get_db)
):
    """
    Confirm password reset with token.
    """
    try:
        # In production, validate token from database or Redis
        # For demo purposes, we'll accept any token format
        if len(request.token) < 10:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset token"
            )
        
        # For demo, we'll use a placeholder user lookup
        # In production, the token would contain user info or be stored with user ID
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Password reset confirmation requires token storage implementation"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Password reset confirmation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Password reset failed. Please try again."
        )


@router.post("/resend-verification")
async def resend_verification_email(
    request: EmailVerificationRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Resend email verification.
    """
    try:
        # Find user by email
        user = db.query(User).filter(User.email == request.email).first()
        
        if user and user.is_active and not user.is_verified:
            # Generate new verification token
            verification_token = secrets.token_urlsafe(32)
            
            # Send verification email
            background_tasks.add_task(send_email_verification, user, verification_token, db)
            
            logger.info(f"Verification email resent to: {user.email}")
        
        return {"message": "If the email exists and is unverified, a verification link has been sent"}
        
    except Exception as e:
        logger.error(f"Verification email resend failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Verification email resend failed. Please try again."
        )


@router.post("/verify-email")
async def verify_email(
    token: str,
    db: Session = Depends(get_db)
):
    """
    Verify email address with token.
    """
    try:
        # In production, validate token from database or Redis
        # For demo purposes, we'll accept any valid token format
        if len(token) < 10:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired verification token"
            )
        
        # For demo, we'll use a placeholder implementation
        # In production, the token would be linked to a specific user
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Email verification requires token storage implementation"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Email verification failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Email verification failed. Please try again."
        )


@router.post("/logout")
async def logout_user(
    current_user: User = Depends(get_current_user)
):
    """
    Logout user (client should discard token).
    """
    logger.info(f"User logged out: {current_user.email}")
    return {"message": "Successfully logged out"}


# Health check for email service
@router.get("/email-health")
async def check_email_service_health():
    """
    Check email service configuration and connectivity.
    """
    try:
        from email_service import email_service
        
        status = await email_service.verify_configuration()
        
        return {
            "status": "healthy" if status["providers_available"] else "degraded",
            "details": status
        }
        
    except Exception as e:
        logger.error(f"Email health check failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e)
        }