"""
Einfacher Auth-Test ohne komplexe Dependencies
"""
import logging
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from jose import jwt
import os

from database import get_db
from models import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["authentication"])

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
SECRET_KEY = os.getenv("SECRET_KEY", "demo-secret-key")
ALGORITHM = "HS256"

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(hours=24)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str

class UserResponse(BaseModel):
    id: int
    email: str
    first_name: str
    last_name: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

@router.post("/register")
def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """Einfache Registrierung ohne komplexe Logik"""
    try:
        # Check if user exists
        existing_user = db.query(User).filter(User.email == user_data.email).first()
        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="E-Mail bereits registriert"
            )

        # Create user
        hashed_password = get_password_hash(user_data.password)
        new_user = User(
            email=user_data.email,
            hashed_password=hashed_password,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            is_active=True,
            is_verified=True
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        return {
            "success": True,
            "message": "Registrierung erfolgreich!",
            "user_id": new_user.id
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Registration error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Registrierung fehlgeschlagen: {str(e)}"
        )

@router.post("/login", response_model=LoginResponse)
def login_user(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Einfacher Login"""
    try:
        user = db.query(User).filter(User.email == form_data.username).first()
        
        if not user or not verify_password(form_data.password, user.hashed_password):
            raise HTTPException(
                status_code=401,
                detail="Ungültige Anmeldedaten"
            )

        access_token = create_access_token(data={"sub": user.email})
        
        return LoginResponse(
            access_token=access_token,
            token_type="bearer",
            user=UserResponse.model_validate(user)
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Anmeldung fehlgeschlagen"
        )

@router.post("/google/login")
def google_login():
    """Placeholder für Google Login"""
    return {"message": "Google Login wird implementiert"}

@router.get("/test")
def test_auth():
    """Test endpoint"""
    return {"message": "Simple auth working!", "timestamp": datetime.now().isoformat()}