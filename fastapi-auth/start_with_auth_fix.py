"""
Server startup with working authentication
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
    print("Starting VoicePartnerAI with Working Authentication...")
    print("Homepage: http://localhost:8003")
    print("Registration: http://localhost:8003/register")
    print("Login: http://localhost:8003/login")
    print("Dashboard: http://localhost:8003/dashboard")
    print("API Docs: http://localhost:8003/docs")
    print("-" * 50)
    
    # Create database tables
    try:
        from database import engine, Base
        print("Creating database tables...")
        Base.metadata.create_all(bind=engine)
        print("Database setup complete!")
    except Exception as e:
        print(f"Database setup warning: {e}")
    
    # Start the server on port 8003
    uvicorn.run(
        "main_with_error_handling:app",
        host="127.0.0.1",
        port=8003,
        reload=False,
        log_level="info"
    )