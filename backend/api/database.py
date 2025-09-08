from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# SQLite Datenbank URL
SQLALCHEMY_DATABASE_URL = "sqlite:///./auth_app.db"

# SQLAlchemy Engine erstellen
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False}  # Nur für SQLite erforderlich
)

# SessionLocal Klasse für Datenbank-Sessions
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base Klasse für die Modelle
Base = declarative_base()

# Dependency für Datenbank-Sessions
def get_db():
    """Dependency Funktion für Datenbank-Sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()