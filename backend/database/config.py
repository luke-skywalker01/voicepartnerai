"""
Database Configuration for VoicePartnerAI
Supports SQLite (dev) and PostgreSQL (production)
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Database URLs
DATABASE_URLS = {
    'development': 'sqlite:///./voicepartnerai_dev.db',
    'test': 'sqlite:///./voicepartnerai_test.db',
    'production': os.getenv('DATABASE_URL', 'postgresql://user:password@localhost/voicepartnerai')
}

# Get environment
ENV = os.getenv('ENVIRONMENT', 'development')
DATABASE_URL = DATABASE_URLS[ENV]

print(f"Database Environment: {ENV}")
print(f"Database URL: {DATABASE_URL}")

# Engine configuration
if DATABASE_URL.startswith('sqlite'):
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        echo=True if ENV == 'development' else False
    )
else:
    engine = create_engine(
        DATABASE_URL,
        pool_size=20,
        max_overflow=0,
        pool_pre_ping=True,
        echo=True if ENV == 'development' else False
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Dependency for FastAPI
def get_db():
    """Database session dependency for FastAPI"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Initialize database tables"""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully")

def get_db_info():
    """Get database connection info"""
    return {
        "environment": ENV,
        "database_url": DATABASE_URL.split('@')[0] + '@***' if '@' in DATABASE_URL else DATABASE_URL,
        "engine": str(engine),
        "tables": list(Base.metadata.tables.keys())
    }