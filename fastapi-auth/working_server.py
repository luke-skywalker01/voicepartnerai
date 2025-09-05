"""
Funktionierender Server - nur das Notwendige
"""
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="VoicePartnerAI",
    description="AI-Powered Voice Assistant Platform",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
try:
    app.mount("/static", StaticFiles(directory="static"), name="static")
    app.mount("/assets", StaticFiles(directory="static/assets"), name="assets")
    logger.info("Static files mounted successfully")
except Exception as e:
    logger.warning(f"Could not mount static files: {e}")

# In-memory user storage
users_db = {}

class UserCreate(BaseModel):
    email: str
    password: str
    first_name: str
    last_name: str

class LoginRequest(BaseModel):
    username: str
    password: str

# Auth endpoints
@app.post("/api/auth/register")
def register_user(user_data: UserCreate):
    """Register new user"""
    try:
        logger.info(f"Registration attempt for: {user_data.email}")
        
        if user_data.email in users_db:
            return {
                "success": False,
                "detail": "E-Mail bereits registriert"
            }
        
        users_db[user_data.email] = {
            "email": user_data.email,
            "password": user_data.password,
            "first_name": user_data.first_name,
            "last_name": user_data.last_name
        }
        
        logger.info(f"User registered: {user_data.email}")
        return {
            "success": True,
            "message": "Registrierung erfolgreich!"
        }
        
    except Exception as e:
        logger.error(f"Registration error: {e}")
        return {
            "success": False,
            "detail": f"Registrierung fehlgeschlagen: {str(e)}"
        }

@app.post("/api/auth/login")
def login_user(login_data: LoginRequest):
    """Login user"""
    try:
        username = login_data.username
        password = login_data.password
        
        logger.info(f"=== LOGIN DEBUG ===")
        logger.info(f"Received data: {login_data}")
        logger.info(f"Username: {username}")
        logger.info(f"Password: {password}")
        logger.info(f"Current users in DB: {list(users_db.keys())}")
        logger.info(f"User exists: {username in users_db}")
        
        if username not in users_db:
            return {
                "success": False,
                "detail": "Benutzer nicht gefunden"
            }
        
        user = users_db[username]
        logger.info(f"Stored password: {user['password']}")
        logger.info(f"Provided password: {password}")
        logger.info(f"Password match: {user['password'] == password}")
        
        if user["password"] != password:
            return {
                "success": False,
                "detail": "Falsches Passwort"
            }
        
        logger.info(f"User logged in: {username}")
        return {
            "access_token": "demo-token",
            "token_type": "bearer",
            "user": {
                "email": user["email"],
                "first_name": user["first_name"],
                "last_name": user["last_name"]
            }
        }
        
    except Exception as e:
        logger.error(f"Login error: {e}")
        return {
            "success": False,
            "detail": f"Login fehlgeschlagen: {str(e)}"
        }

@app.post("/api/auth/google/login")
def google_login():
    """Google login placeholder"""
    return {"message": "Google Login wird implementiert"}

@app.get("/api/auth/test")
def test_auth():
    """Test endpoint"""
    return {
        "message": "Auth working!",
        "users_count": len(users_db),
        "users": list(users_db.keys()),
        "detailed_users": users_db  # Shows all user data for debugging
    }

@app.get("/api/auth/debug-users")  
def debug_users():
    """Debug endpoint to see all registered users"""
    return {
        "total_users": len(users_db),
        "users": users_db
    }

# Basic endpoints
@app.get("/")
def homepage():
    """Serve homepage"""
    try:
        return FileResponse('static/index.html')
    except:
        return {"message": "Welcome to VoicePartnerAI"}

@app.get("/api")
def api_root():
    """API root"""
    return {
        "message": "Welcome to VoicePartnerAI API",
        "version": "1.0.0",
        "status": "online"
    }

# Health check
@app.get("/health")
def health_check():
    """Health check"""
    return {"status": "healthy"}

# Catch-all for SPA
@app.get("/{full_path:path}")
def serve_spa(full_path: str):
    """Serve React SPA"""
    if full_path.startswith(("api/", "docs", "health")):
        return {"error": "Not found"}
    
    try:
        return FileResponse('static/index.html')
    except:
        return {"message": "VoicePartnerAI"}

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting VoicePartnerAI server...")
    uvicorn.run(
        "working_server:app",
        host="127.0.0.1",
        port=8005,
        reload=False,
        log_level="info"
    )