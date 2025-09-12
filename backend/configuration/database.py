"""
Database Configuration for VoicePartnerAI
"""

import os
from typing import Dict, Any

# Database Configuration
DATABASE_CONFIG = {
    "type": "postgresql",
    "host": os.getenv("DB_HOST", "localhost"),
    "port": int(os.getenv("DB_PORT", 5432)),
    "database": os.getenv("DB_NAME", "voicepartnerai"),
    "username": os.getenv("DB_USER", "postgres"),
    "password": os.getenv("DB_PASSWORD", ""),
    "pool_size": int(os.getenv("DB_POOL_SIZE", 10)),
    "max_overflow": int(os.getenv("DB_MAX_OVERFLOW", 20)),
}

# Redis Configuration for Caching
REDIS_CONFIG = {
    "host": os.getenv("REDIS_HOST", "localhost"),
    "port": int(os.getenv("REDIS_PORT", 6379)),
    "db": int(os.getenv("REDIS_DB", 0)),
    "password": os.getenv("REDIS_PASSWORD", ""),
    "decode_responses": True,
}

# Database Connection URL
def get_database_url() -> str:
    """Generate database connection URL"""
    config = DATABASE_CONFIG
    return f"postgresql://{config['username']}:{config['password']}@{config['host']}:{config['port']}/{config['database']}"

# Development Database (SQLite)
DEV_DATABASE_CONFIG = {
    "url": "sqlite:///./voicepartnerai.db",
    "echo": bool(os.getenv("DB_ECHO", "false").lower() == "true"),
}