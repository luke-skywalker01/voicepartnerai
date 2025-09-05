"""
Simple Authentication Routes
Basic working auth without complex email integration
"""

import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr

from database import get_db
from models import User, Workspace, WorkspaceMember, WorkspaceRole
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
    is_verified: bool = False
    created_at: datetime

    class Config:
        from_attributes = True


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


@router.post("/register", response_model=dict)
async def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user."""
    try:
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == user_data.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

        # Create new user
        hashed_password = get_password_hash(user_data.password)
        new_user = User(
            email=user_data.email,
            hashed_password=hashed_password,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            is_active=True,
            is_verified=False
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        # Create a default workspace for the user
        default_workspace = Workspace(
            name=f"{user_data.first_name}'s Workspace",
            slug=f"workspace-{new_user.id}",
            description="Your personal workspace",
            plan="free"
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
            "message": "User registered successfully",
            "user_id": new_user.id
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
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
    """Login user and return access token."""
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
                detail="Account is disabled",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Create access token
        access_token_expires = timedelta(minutes=30)
        access_token = create_access_token(
            data={"sub": user.email},
            expires_delta=access_token_expires
        )

        logger.info(f"User logged in successfully: {user.email}")

        return LoginResponse(
            access_token=access_token,
            token_type="bearer",
            user=UserResponse.from_orm(user)
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed. Please try again."
        )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information."""
    return UserResponse.from_orm(current_user)


@router.post("/logout")
async def logout_user():
    """Logout user (client should delete token)."""
    return {"message": "Successfully logged out"}