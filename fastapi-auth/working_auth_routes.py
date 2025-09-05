"""
Working Authentication Routes - Focus on E-Mail Auth
Simple, reliable authentication without complex dependencies
"""

import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr

from database import get_db
from models import User
from auth import verify_password, get_password_hash, create_access_token, get_current_user

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
    is_active: bool = True
    is_verified: bool = True
    created_at: datetime

    class Config:
        from_attributes = True


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


@router.post("/register")
async def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user - SIMPLIFIED VERSION"""
    try:
        logger.info(f"Registration attempt for: {user_data.email}")
        
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == user_data.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="E-Mail ist bereits registriert"
            )

        # Create new user - SIMPLIFIED without workspace dependency
        hashed_password = get_password_hash(user_data.password)
        new_user = User(
            email=user_data.email,
            hashed_password=hashed_password,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            is_active=True,
            is_verified=True  # Skip email verification
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        logger.info(f"User registered successfully: {user_data.email} (ID: {new_user.id})")
        
        return {
            "success": True,
            "message": "Registrierung erfolgreich! Sie können sich jetzt anmelden.",
            "user_id": new_user.id
        }

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registrierung fehlgeschlagen: {str(e)}"
        )


@router.post("/login", response_model=LoginResponse)
async def login_user(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Login user and return access token - WORKING VERSION"""
    try:
        logger.info(f"Login attempt for: {form_data.username}")
        
        # Find user by email
        user = db.query(User).filter(User.email == form_data.username).first()
        
        if not user:
            logger.warning(f"User not found: {form_data.username}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Ungültige E-Mail oder Passwort",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        if not verify_password(form_data.password, user.hashed_password):
            logger.warning(f"Invalid password for user: {form_data.username}")
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
        access_token_expires = timedelta(hours=24)  # 24 hour session
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
        logger.error(f"Login error for {form_data.username}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut."
        )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information."""
    return UserResponse.model_validate(current_user)


@router.post("/logout")
async def logout_user():
    """Logout user (client should delete token)."""
    return {"message": "Erfolgreich abgemeldet"}


# Google OAuth endpoint
@router.post("/google/login")
async def google_login():
    """Simple Google OAuth placeholder."""
    return {
        "message": "Google OAuth wird implementiert",
        "status": "pending"
    }

# Simple test endpoint
@router.get("/test")
async def test_auth():
    """Test endpoint to verify auth routes are working."""
    return {
        "message": "Auth routes are working!",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "endpoints": {
            "register": "POST /api/auth/register",
            "login": "POST /api/auth/login", 
            "google/login": "POST /api/auth/google/login",
            "me": "GET /api/auth/me",
            "logout": "POST /api/auth/logout"
        }
    }