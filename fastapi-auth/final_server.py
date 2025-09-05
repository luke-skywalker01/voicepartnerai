"""
Final server with fixed auth and Google OAuth
"""
import os
import uvicorn
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Set default environment variables if not set
if not os.getenv("SECRET_KEY"):
    os.environ["SECRET_KEY"] = "demo-secret-key-change-in-production"

if not os.getenv("DATABASE_URL"):
    os.environ["DATABASE_URL"] = "sqlite:///./voicepartnerai.db"

if __name__ == "__main__":
    print("=== VoicePartnerAI - Finale Version ===")
    print("Website: http://localhost:8005")
    print("Features:")
    print("- Email/Password Registrierung FUNKTIONIERT")
    print("- Google OAuth Login IMPLEMENTIERT")
    print("- Vollstaendiges Dashboard")
    print("- Voice Assistant Erstellung")
    print("-" * 50)
    
    # Create database tables
    try:
        from database import engine, Base
        print("Updating database schema...")
        Base.metadata.create_all(bind=engine)
        print("Database ready!")
    except Exception as e:
        print(f"Database warning: {e}")
    
    # Start the server
    uvicorn.run(
        "main_with_error_handling:app",
        host="127.0.0.1",
        port=8005,
        reload=False,
        log_level="info"
    )