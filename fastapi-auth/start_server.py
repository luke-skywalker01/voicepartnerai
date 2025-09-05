"""
Simple server startup script for VoicePartnerAI
Run this to start the application locally
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
    print("Starting VoicePartnerAI Server...")
    print("Server will be available at: http://localhost:8000")
    print("API Documentation: http://localhost:8000/docs")
    print("Health Check: http://localhost:8000/health")
    print("-" * 50)
    
    # Create database tables
    try:
        from database import engine, Base
        print("Creating database tables...")
        Base.metadata.create_all(bind=engine)
        print("Database setup complete!")
    except Exception as e:
        print(f"Database setup warning: {e}")
    
    # Start the server
    uvicorn.run(
        "main_with_error_handling:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )