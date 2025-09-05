"""
Minimale Auth ohne jede Dependency
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import json
import os
from datetime import datetime

router = APIRouter(prefix="/auth", tags=["authentication"])

# Simple file-based storage for demo
USERS_FILE = "demo_users.json"

class UserCreate(BaseModel):
    email: str
    password: str
    first_name: str
    last_name: str

def load_users():
    """Load users from file"""
    if os.path.exists(USERS_FILE):
        try:
            with open(USERS_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            return {}
    return {}

def save_users(users):
    """Save users to file"""
    with open(USERS_FILE, 'w', encoding='utf-8') as f:
        json.dump(users, f, indent=2, ensure_ascii=False)

@router.post("/register")
def register_user(user_data: UserCreate):
    """Super simple registration"""
    try:
        users = load_users()
        
        # Check if user exists
        if user_data.email in users:
            raise HTTPException(
                status_code=400,
                detail="E-Mail bereits registriert"
            )
        
        # Add user
        users[user_data.email] = {
            "email": user_data.email,
            "password": user_data.password,  # In production: hash this!
            "first_name": user_data.first_name,
            "last_name": user_data.last_name,
            "created_at": datetime.now().isoformat()
        }
        
        save_users(users)
        
        return {
            "success": True,
            "message": "Registrierung erfolgreich!",
            "email": user_data.email
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Registrierung fehlgeschlagen: {str(e)}"
        )

class LoginRequest(BaseModel):
    username: str
    password: str

@router.post("/login")  
def login_user(login_data: LoginRequest):
    """Super simple login"""
    try:
        users = load_users()
        
        if login_data.username not in users:
            raise HTTPException(
                status_code=401,
                detail="Benutzer nicht gefunden"
            )
        
        user = users[login_data.username]
        if user["password"] != login_data.password:
            raise HTTPException(
                status_code=401,
                detail="Falsches Passwort"
            )
        
        return {
            "success": True,
            "message": "Login erfolgreich!",
            "user": {
                "email": user["email"],
                "first_name": user["first_name"],
                "last_name": user["last_name"]
            },
            "access_token": "demo-token-123",
            "token_type": "bearer"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Login fehlgeschlagen: {str(e)}"
        )

@router.post("/google/login")
def google_login():
    """Placeholder Google login"""
    return {"message": "Google Login wird implementiert"}

@router.get("/test")
def test_endpoint():
    """Test if auth is working"""
    users = load_users()
    return {
        "message": "Minimal auth working!",
        "users_count": len(users),
        "timestamp": datetime.now().isoformat()
    }