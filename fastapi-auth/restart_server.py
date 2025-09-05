"""
Server restart script with assets fix
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
    print("Restarting VoicePartnerAI Server with Assets Fix...")
    print("Homepage: http://localhost:8002")
    print("Login: http://localhost:8002/login")
    print("Dashboard: http://localhost:8002/dashboard")
    print("API Docs: http://localhost:8002/docs")
    print("-" * 50)
    
    # Create database tables
    try:
        from database import engine, Base
        print("Creating database tables...")
        Base.metadata.create_all(bind=engine)
        print("Database setup complete!")
    except Exception as e:
        print(f"Database setup warning: {e}")
    
    # Start the server on a new port
    uvicorn.run(
        "main_with_error_handling:app",
        host="127.0.0.1",
        port=8002,  # Use port 8002 to avoid conflicts
        reload=False,
        log_level="info"
    )