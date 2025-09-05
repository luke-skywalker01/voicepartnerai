"""
Ultra-einfache Auth - garantiert funktionierend
"""
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/auth", tags=["authentication"])

# In-Memory Storage für Demo
demo_users = {}

class UserCreate(BaseModel):
    email: str
    password: str
    first_name: str
    last_name: str

@router.post("/register")
def register_user(user_data: UserCreate):
    """Ultra-simple registration"""
    
    # Check if user exists
    if user_data.email in demo_users:
        return {
            "success": False,
            "detail": "E-Mail bereits registriert"
        }
    
    # Add user to memory
    demo_users[user_data.email] = {
        "email": user_data.email,
        "password": user_data.password,
        "first_name": user_data.first_name,
        "last_name": user_data.last_name
    }
    
    return {
        "success": True,
        "message": "Registrierung erfolgreich!",
        "email": user_data.email
    }

@router.post("/login")
def login_user(user_data: dict):
    """Ultra-simple login"""
    username = user_data.get("username")
    password = user_data.get("password")
    
    if username not in demo_users:
        return {
            "success": False,
            "detail": "Benutzer nicht gefunden"
        }
    
    user = demo_users[username]
    if user["password"] != password:
        return {
            "success": False,
            "detail": "Falsches Passwort"
        }
    
    return {
        "success": True,
        "message": "Login erfolgreich!",
        "access_token": "demo-token",
        "token_type": "bearer",
        "user": {
            "email": user["email"],
            "first_name": user["first_name"],
            "last_name": user["last_name"]
        }
    }

@router.post("/google/login")
def google_login():
    return {"message": "Google Login wird implementiert"}

@router.get("/test")
def test_endpoint():
    return {
        "message": "Ultra simple auth working!",
        "registered_users": len(demo_users),
        "users": list(demo_users.keys())
    }