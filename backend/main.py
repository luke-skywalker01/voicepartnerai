"""
VoicePartnerAI Backend - FastAPI Application
Enterprise Voice AI Platform for European Market
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
import os
from datetime import datetime
import uuid

# Initialize FastAPI app
app = FastAPI(
    title="VoicePartnerAI API",
    description="Enterprise Voice AI Platform for European Market",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Configuration for Marketing Site Integration
origins = [
    "http://localhost:3000",           # App Domain (Development)
    "http://localhost:8080",           # Marketing Dev Server
    "https://voicepartnerai.com",      # Marketing Production
    "https://app.voicepartnerai.com",  # App Production
    "http://127.0.0.1:3000",           # Alternative localhost
    "http://127.0.0.1:8080",           # Alternative localhost
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Pydantic Models
class AssistantCreate(BaseModel):
    name: str
    template: str
    first_message: str
    system_prompt: str
    voice_model: str
    language: str
    
class AssistantResponse(BaseModel):
    id: str
    name: str
    template: str
    first_message: str
    system_prompt: str
    voice_model: str
    language: str
    status: str
    created_at: datetime
    updated_at: datetime

class User(BaseModel):
    id: str
    email: str
    name: str

# Database Integration
from database.config import get_db, init_db, get_db_info
from database.models import User, Assistant, CallLog
from database.migration import create_tables, seed_default_templates, migrate_from_memory_storage
from sqlalchemy.orm import Session

# In-memory storage (will be migrated to database)
assistants_db = []
users_db = []

# Initialize database on startup
try:
    print("Initializing database...")
    create_tables()
    seed_default_templates()

    # Migrate existing in-memory data if any
    if assistants_db:
        migrate_from_memory_storage(assistants_db)
        assistants_db = []  # Clear after migration

    print("Database initialization complete")
except Exception as e:
    print(f"Database initialization failed: {e}")
    print("Falling back to in-memory storage")

# Health Check
@app.get("/")
async def root():
    return {
        "message": "VoicePartnerAI Backend API",
        "version": "1.0.0",
        "status": "healthy",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now(),
        "service": "voicepartnerai-backend"
    }

# Assistant Management Endpoints
@app.post("/api/assistants", response_model=AssistantResponse)
async def create_assistant(assistant: AssistantCreate):
    """Create a new voice assistant"""
    try:
        assistant_id = str(uuid.uuid4())
        now = datetime.now()
        
        new_assistant = {
            "id": assistant_id,
            "name": assistant.name,
            "template": assistant.template,
            "first_message": assistant.first_message,
            "system_prompt": assistant.system_prompt,
            "voice_model": assistant.voice_model,
            "language": assistant.language,
            "status": "active",
            "created_at": now,
            "updated_at": now
        }
        
        assistants_db.append(new_assistant)
        
        return AssistantResponse(**new_assistant)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/assistants", response_model=List[AssistantResponse])
async def get_assistants():
    """Get all assistants"""
    return [AssistantResponse(**assistant) for assistant in assistants_db]

@app.get("/api/assistants/{assistant_id}", response_model=AssistantResponse)
async def get_assistant(assistant_id: str):
    """Get a specific assistant"""
    assistant = next((a for a in assistants_db if a["id"] == assistant_id), None)
    if not assistant:
        raise HTTPException(status_code=404, detail="Assistant not found")
    return AssistantResponse(**assistant)

@app.put("/api/assistants/{assistant_id}", response_model=AssistantResponse)
async def update_assistant(assistant_id: str, assistant: AssistantCreate):
    """Update an existing assistant"""
    existing = next((a for a in assistants_db if a["id"] == assistant_id), None)
    if not existing:
        raise HTTPException(status_code=404, detail="Assistant not found")
    
    existing.update({
        "name": assistant.name,
        "template": assistant.template,
        "first_message": assistant.first_message,
        "system_prompt": assistant.system_prompt,
        "voice_model": assistant.voice_model,
        "language": assistant.language,
        "updated_at": datetime.now()
    })
    
    return AssistantResponse(**existing)

@app.delete("/api/assistants/{assistant_id}")
async def delete_assistant(assistant_id: str):
    """Delete an assistant"""
    global assistants_db
    original_count = len(assistants_db)
    assistants_db = [a for a in assistants_db if a["id"] != assistant_id]
    
    if len(assistants_db) == original_count:
        raise HTTPException(status_code=404, detail="Assistant not found")
    
    return {"message": "Assistant deleted successfully"}

# Voice API Simulation Endpoints
@app.post("/api/assistants/{assistant_id}/test")
async def test_assistant(assistant_id: str):
    """Test an assistant with a simulated call"""
    assistant = next((a for a in assistants_db if a["id"] == assistant_id), None)
    if not assistant:
        raise HTTPException(status_code=404, detail="Assistant not found")
    
    return {
        "status": "test_completed",
        "assistant_id": assistant_id,
        "assistant_name": assistant["name"],
        "test_result": {
            "duration": "00:00:15",
            "first_message_played": assistant["first_message"],
            "response_time": "250ms",
            "voice_quality": "excellent",
            "message": "Test call completed successfully"
        }
    }

@app.post("/api/calls")
async def create_call():
    """Initiate a new voice call"""
    call_id = str(uuid.uuid4())
    return {
        "call_id": call_id,
        "status": "initiated",
        "timestamp": datetime.now(),
        "message": "Call initiated successfully"
    }

# Analytics Endpoints
@app.get("/api/analytics/overview")
async def get_analytics_overview():
    """Get analytics overview"""
    return {
        "total_assistants": len(assistants_db),
        "active_assistants": len([a for a in assistants_db if a["status"] == "active"]),
        "total_calls": 0,  # Would come from call logs
        "success_rate": 0.98,
        "avg_response_time": "285ms",
        "top_templates": [
            {"template": "customer-support", "count": 45},
            {"template": "appointment-setter", "count": 32},
            {"template": "lead-qualifier", "count": 28}
        ]
    }

# Development endpoints
@app.get("/api/dev/reset")
async def reset_database():
    """Reset the in-memory database (development only)"""
    global assistants_db, users_db
    assistants_db = []
    users_db = []
    return {"message": "Database reset successfully"}

# Include Public API Router
from api.public_api import router as public_router
app.include_router(public_router)

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info"
    )