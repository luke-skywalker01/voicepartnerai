"""
VoicePartnerAI Backend Configuration
"""
import os
from pathlib import Path
from typing import Optional

class Config:
    """Base configuration"""
    
    # Application
    APP_NAME = "VoicePartnerAI Backend"
    VERSION = "1.0.0"
    DEBUG = os.getenv("DEBUG", "false").lower() == "true"
    
    # Server
    HOST = os.getenv("HOST", "0.0.0.0")
    PORT = int(os.getenv("PORT", "8000"))
    
    # Database
    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./voicepartnerai.db")
    
    # Security
    SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    ALGORITHM = "HS256"
    
    # CORS
    CORS_ORIGINS = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8080",
        "http://127.0.0.1:8080"
    ]
    
    # Voice AI Settings
    DEFAULT_VOICE_MODEL = os.getenv("DEFAULT_VOICE_MODEL", "openai-gpt-4")
    DEFAULT_VOICE_PROVIDER = os.getenv("DEFAULT_VOICE_PROVIDER", "elevenlabs")
    
    # Phone Numbers (DACH region)
    SUPPORTED_COUNTRIES = ["DE", "AT", "CH"]
    DEFAULT_COUNTRY = "DE"
    
    # Logging
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
    LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    DATABASE_URL = "sqlite:///./voicepartnerai_dev.db"

class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:pass@localhost/voicepartnerai")

class TestConfig(Config):
    """Test configuration"""
    DEBUG = True
    DATABASE_URL = "sqlite:///:memory:"
    ACCESS_TOKEN_EXPIRE_MINUTES = 5

# Configuration mapping
config_map = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "testing": TestConfig
}

def get_config() -> Config:
    """Get configuration based on environment"""
    env = os.getenv("ENVIRONMENT", "development")
    return config_map.get(env, DevelopmentConfig)()