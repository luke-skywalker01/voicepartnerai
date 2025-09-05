"""
Quick authentication test
"""

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simple in-memory storage for testing
users_db = {}
current_id = 1

class UserCreate(BaseModel):
    email: str
    password: str
    first_name: str
    last_name: str

class LoginRequest(BaseModel):
    username: str
    password: str

@app.post("/api/auth/register")
async def register(user_data: UserCreate):
    global current_id
    
    if user_data.email in users_db:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    users_db[user_data.email] = {
        "id": current_id,
        "email": user_data.email,
        "password": user_data.password,  # In real app, this would be hashed
        "first_name": user_data.first_name,
        "last_name": user_data.last_name
    }
    current_id += 1
    
    return {"success": True, "message": "Registration successful"}

@app.post("/api/auth/login")
async def login(form_data: dict):
    username = form_data.get("username")
    password = form_data.get("password")
    
    if username not in users_db:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user = users_db[username]
    if user["password"] != password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    return {
        "access_token": f"fake-token-{user['id']}",
        "token_type": "bearer"
    }

@app.get("/")
async def root():
    return {"message": "Quick Auth Test Server", "registered_users": len(users_db)}

if __name__ == "__main__":
    print("Quick Auth Test Server")
    print("Test: http://localhost:8004")
    uvicorn.run(app, host="127.0.0.1", port=8004)