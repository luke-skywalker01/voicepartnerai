# 🗄️ Database Integration Plan

## 📋 Aktueller Zustand & Migration Strategy

Das Backend verwendet aktuell In-Memory Storage (`assistants_db = []`). Vollständige Migration zu persistenter Datenbank.

## 🎯 Database Architecture

### 1. Technology Stack

**Production Database**: PostgreSQL
- ✅ ACID Compliance
- ✅ JSON Support für flexible Schemas
- ✅ Excellent Performance
- ✅ Enterprise-ready

**Development Database**: SQLite
- ✅ Zero-configuration
- ✅ File-based
- ✅ Perfect für Development

### 2. Database Schema Design

```sql
-- Core Tables

-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'user', -- 'user', 'admin', 'enterprise'
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    subscription_tier VARCHAR(20) DEFAULT 'free', -- 'free', 'professional', 'enterprise'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP,

    -- Additional metadata
    timezone VARCHAR(50) DEFAULT 'Europe/Berlin',
    language VARCHAR(5) DEFAULT 'de',
    preferences JSONB DEFAULT '{}',

    -- Billing
    billing_address JSONB,
    payment_method_id VARCHAR(100),

    -- GDPR Compliance
    data_processing_consent BOOLEAN DEFAULT false,
    consent_timestamp TIMESTAMP,
    data_retention_until TIMESTAMP,

    CONSTRAINT valid_role CHECK (role IN ('user', 'admin', 'enterprise')),
    CONSTRAINT valid_subscription CHECK (subscription_tier IN ('free', 'professional', 'enterprise')),
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Assistants Table
CREATE TABLE assistants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Basic Information
    name VARCHAR(100) NOT NULL,
    description TEXT,
    template VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive', 'archived'

    -- Voice Configuration
    first_message TEXT NOT NULL,
    system_prompt TEXT NOT NULL,
    voice_provider VARCHAR(50) DEFAULT 'elevenlabs', -- 'elevenlabs', 'azure', 'google'
    voice_model VARCHAR(100) DEFAULT 'default',
    voice_settings JSONB DEFAULT '{}', -- speed, pitch, stability, etc.
    language VARCHAR(5) DEFAULT 'de-DE',

    -- Advanced Settings
    max_duration INTEGER DEFAULT 300, -- seconds
    silence_timeout INTEGER DEFAULT 3, -- seconds
    interruption_enabled BOOLEAN DEFAULT true,
    background_sound VARCHAR(50),

    -- Templates & Training
    training_data JSONB DEFAULT '[]',
    fallback_responses JSONB DEFAULT '[]',
    conversation_flow JSONB DEFAULT '{}',

    -- Analytics Settings
    analytics_enabled BOOLEAN DEFAULT true,
    recording_enabled BOOLEAN DEFAULT false,

    -- Integration Settings
    webhook_url VARCHAR(500),
    webhook_events JSONB DEFAULT '[]',
    api_keys JSONB DEFAULT '{}',
    external_integrations JSONB DEFAULT '{}',

    -- Metadata
    tags JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP,

    CONSTRAINT valid_status CHECK (status IN ('active', 'inactive', 'archived')),
    CONSTRAINT valid_voice_provider CHECK (voice_provider IN ('elevenlabs', 'azure', 'google', 'openai')),
    CONSTRAINT valid_max_duration CHECK (max_duration > 0 AND max_duration <= 3600),
    CONSTRAINT valid_language CHECK (language ~* '^[a-z]{2}(-[A-Z]{2})?$')
);

-- Phone Numbers Table (DACH Region)
CREATE TABLE phone_numbers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assistant_id UUID REFERENCES assistants(id) ON DELETE SET NULL,

    -- Phone Number Details
    number VARCHAR(20) NOT NULL UNIQUE,
    country_code VARCHAR(3) NOT NULL, -- 'DE', 'AT', 'CH'
    area_code VARCHAR(10),
    number_type VARCHAR(20) DEFAULT 'local', -- 'local', 'toll-free', 'mobile'
    provider VARCHAR(50) NOT NULL,

    -- Status & Configuration
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive', 'porting'
    forwarding_enabled BOOLEAN DEFAULT false,
    forwarding_number VARCHAR(20),

    -- Billing
    monthly_cost DECIMAL(10,2),
    usage_cost_per_minute DECIMAL(6,4),

    -- Timestamps
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT valid_country CHECK (country_code IN ('DE', 'AT', 'CH')),
    CONSTRAINT valid_status CHECK (status IN ('active', 'inactive', 'porting')),
    CONSTRAINT valid_number_type CHECK (number_type IN ('local', 'toll-free', 'mobile'))
);

-- Call Logs Table
CREATE TABLE call_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assistant_id UUID NOT NULL REFERENCES assistants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    phone_number_id UUID REFERENCES phone_numbers(id) ON DELETE SET NULL,

    -- Call Details
    call_id VARCHAR(100) NOT NULL UNIQUE, -- External provider call ID
    direction VARCHAR(10) NOT NULL, -- 'inbound', 'outbound'
    caller_number VARCHAR(20),
    callee_number VARCHAR(20),

    -- Call Status & Timing
    status VARCHAR(20) NOT NULL, -- 'completed', 'failed', 'busy', 'no-answer', 'cancelled'
    start_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP,
    duration INTEGER, -- seconds
    billable_duration INTEGER, -- seconds

    -- Call Quality & Performance
    audio_quality_score DECIMAL(3,2), -- 0.00 to 5.00
    latency_ms INTEGER,
    packet_loss_percentage DECIMAL(5,2),
    transcription_accuracy DECIMAL(5,2),

    -- Conversation Data
    conversation_transcript JSONB DEFAULT '[]',
    sentiment_analysis JSONB DEFAULT '{}',
    intent_detection JSONB DEFAULT '{}',
    key_phrases JSONB DEFAULT '[]',

    -- Business Metrics
    conversion_achieved BOOLEAN DEFAULT false,
    appointment_scheduled BOOLEAN DEFAULT false,
    lead_qualified BOOLEAN DEFAULT false,
    customer_satisfaction INTEGER, -- 1-5 scale

    -- Technical Details
    voice_provider VARCHAR(50),
    provider_call_data JSONB DEFAULT '{}',
    error_details JSONB DEFAULT '{}',

    -- Billing
    cost DECIMAL(10,4),
    cost_currency VARCHAR(3) DEFAULT 'EUR',

    -- Recording & Compliance
    recording_url VARCHAR(500),
    recording_duration INTEGER,
    gdpr_compliant BOOLEAN DEFAULT true,
    data_retention_until TIMESTAMP,

    -- Geolocation (for analytics)
    caller_country VARCHAR(2),
    caller_region VARCHAR(50),
    caller_city VARCHAR(100),

    CONSTRAINT valid_direction CHECK (direction IN ('inbound', 'outbound')),
    CONSTRAINT valid_status CHECK (status IN ('completed', 'failed', 'busy', 'no-answer', 'cancelled')),
    CONSTRAINT valid_duration CHECK (duration >= 0),
    CONSTRAINT valid_quality_score CHECK (audio_quality_score >= 0 AND audio_quality_score <= 5),
    CONSTRAINT valid_satisfaction CHECK (customer_satisfaction >= 1 AND customer_satisfaction <= 5)
);

-- Templates Table (Pre-defined Assistant Templates)
CREATE TABLE assistant_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'customer-service', 'sales', 'appointment', 'lead-gen'

    -- Template Configuration
    default_first_message TEXT NOT NULL,
    default_system_prompt TEXT NOT NULL,
    default_voice_settings JSONB DEFAULT '{}',

    -- Template Metadata
    industry VARCHAR(50),
    use_cases JSONB DEFAULT '[]',
    required_integrations JSONB DEFAULT '[]',
    estimated_setup_time INTEGER DEFAULT 5, -- minutes

    -- Template Status
    is_active BOOLEAN DEFAULT true,
    is_premium BOOLEAN DEFAULT false,
    popularity_score INTEGER DEFAULT 0,

    -- Versioning
    version VARCHAR(10) DEFAULT '1.0',
    changelog JSONB DEFAULT '[]',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT valid_category CHECK (category IN ('customer-service', 'sales', 'appointment', 'lead-gen', 'general'))
);

-- Analytics & Reporting Tables
CREATE TABLE analytics_daily (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assistant_id UUID REFERENCES assistants(id) ON DELETE CASCADE,
    date DATE NOT NULL,

    -- Call Volume Metrics
    total_calls INTEGER DEFAULT 0,
    completed_calls INTEGER DEFAULT 0,
    failed_calls INTEGER DEFAULT 0,
    average_duration DECIMAL(10,2),

    -- Quality Metrics
    average_audio_quality DECIMAL(3,2),
    average_latency INTEGER,
    transcription_accuracy DECIMAL(5,2),

    -- Business Metrics
    conversion_rate DECIMAL(5,2),
    customer_satisfaction DECIMAL(3,2),
    appointments_scheduled INTEGER DEFAULT 0,
    leads_qualified INTEGER DEFAULT 0,

    -- Cost Metrics
    total_cost DECIMAL(10,4),
    cost_per_minute DECIMAL(6,4),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(user_id, assistant_id, date)
);

-- API Keys & Integrations
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Key Details
    key_name VARCHAR(100) NOT NULL,
    key_prefix VARCHAR(20) NOT NULL, -- First 8 chars for identification
    key_hash VARCHAR(255) NOT NULL, -- Hashed full key

    -- Permissions & Limits
    permissions JSONB DEFAULT '[]', -- ['read', 'write', 'delete']
    rate_limit INTEGER DEFAULT 1000, -- requests per hour
    allowed_ips JSONB DEFAULT '[]',

    -- Status
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMP,
    usage_count INTEGER DEFAULT 0,

    -- Expiration
    expires_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(user_id, key_name)
);

-- Indexes for Performance
CREATE INDEX idx_assistants_user_id ON assistants(user_id);
CREATE INDEX idx_assistants_status ON assistants(status);
CREATE INDEX idx_assistants_template ON assistants(template);

CREATE INDEX idx_call_logs_assistant_id ON call_logs(assistant_id);
CREATE INDEX idx_call_logs_user_id ON call_logs(user_id);
CREATE INDEX idx_call_logs_start_time ON call_logs(start_time);
CREATE INDEX idx_call_logs_status ON call_logs(status);

CREATE INDEX idx_phone_numbers_user_id ON phone_numbers(user_id);
CREATE INDEX idx_phone_numbers_number ON phone_numbers(number);

CREATE INDEX idx_analytics_daily_user_id ON analytics_daily(user_id);
CREATE INDEX idx_analytics_daily_date ON analytics_daily(date);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assistants_updated_at BEFORE UPDATE ON assistants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON assistant_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## 🔧 SQLAlchemy Models Implementation

### Database Configuration

```python
# backend/database/config.py
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
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

### Core Models

```python
# backend/database/models.py
from sqlalchemy import Column, String, DateTime, Boolean, Integer, Text, ForeignKey, DECIMAL, JSON
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
import uuid

from .config import Base

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(100), nullable=False)
    role = Column(String(20), default='user')
    is_active = Column(Boolean, default=True)
    email_verified = Column(Boolean, default=False)
    subscription_tier = Column(String(20), default='free')

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login_at = Column(DateTime(timezone=True))

    # Settings
    timezone = Column(String(50), default='Europe/Berlin')
    language = Column(String(5), default='de')
    preferences = Column(JSONB, default={})

    # GDPR
    data_processing_consent = Column(Boolean, default=False)
    consent_timestamp = Column(DateTime(timezone=True))
    data_retention_until = Column(DateTime(timezone=True))

    # Relationships
    assistants = relationship("Assistant", back_populates="user", cascade="all, delete-orphan")
    phone_numbers = relationship("PhoneNumber", back_populates="user")
    call_logs = relationship("CallLog", back_populates="user")

class Assistant(Base):
    __tablename__ = "assistants"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)

    # Basic Information
    name = Column(String(100), nullable=False)
    description = Column(Text)
    template = Column(String(50), nullable=False)
    status = Column(String(20), default='active')

    # Voice Configuration
    first_message = Column(Text, nullable=False)
    system_prompt = Column(Text, nullable=False)
    voice_provider = Column(String(50), default='elevenlabs')
    voice_model = Column(String(100), default='default')
    voice_settings = Column(JSONB, default={})
    language = Column(String(5), default='de-DE')

    # Advanced Settings
    max_duration = Column(Integer, default=300)
    silence_timeout = Column(Integer, default=3)
    interruption_enabled = Column(Boolean, default=True)
    background_sound = Column(String(50))

    # Training & Flow
    training_data = Column(JSONB, default=[])
    fallback_responses = Column(JSONB, default=[])
    conversation_flow = Column(JSONB, default={})

    # Analytics
    analytics_enabled = Column(Boolean, default=True)
    recording_enabled = Column(Boolean, default=False)

    # Integrations
    webhook_url = Column(String(500))
    webhook_events = Column(JSONB, default=[])
    api_keys = Column(JSONB, default={})
    external_integrations = Column(JSONB, default={})

    # Metadata
    tags = Column(JSONB, default=[])
    metadata = Column(JSONB, default={})

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_used_at = Column(DateTime(timezone=True))

    # Relationships
    user = relationship("User", back_populates="assistants")
    call_logs = relationship("CallLog", back_populates="assistant")
    phone_numbers = relationship("PhoneNumber", back_populates="assistant")

class CallLog(Base):
    __tablename__ = "call_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    assistant_id = Column(UUID(as_uuid=True), ForeignKey('assistants.id'), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    phone_number_id = Column(UUID(as_uuid=True), ForeignKey('phone_numbers.id'))

    # Call Details
    call_id = Column(String(100), unique=True, nullable=False)
    direction = Column(String(10), nullable=False)
    caller_number = Column(String(20))
    callee_number = Column(String(20))

    # Status & Timing
    status = Column(String(20), nullable=False)
    start_time = Column(DateTime(timezone=True), server_default=func.now())
    end_time = Column(DateTime(timezone=True))
    duration = Column(Integer)
    billable_duration = Column(Integer)

    # Quality Metrics
    audio_quality_score = Column(DECIMAL(3,2))
    latency_ms = Column(Integer)
    packet_loss_percentage = Column(DECIMAL(5,2))
    transcription_accuracy = Column(DECIMAL(5,2))

    # Conversation Data
    conversation_transcript = Column(JSONB, default=[])
    sentiment_analysis = Column(JSONB, default={})
    intent_detection = Column(JSONB, default={})
    key_phrases = Column(JSONB, default=[])

    # Business Metrics
    conversion_achieved = Column(Boolean, default=False)
    appointment_scheduled = Column(Boolean, default=False)
    lead_qualified = Column(Boolean, default=False)
    customer_satisfaction = Column(Integer)

    # Technical & Billing
    voice_provider = Column(String(50))
    provider_call_data = Column(JSONB, default={})
    error_details = Column(JSONB, default={})
    cost = Column(DECIMAL(10,4))
    cost_currency = Column(String(3), default='EUR')

    # Recording & Compliance
    recording_url = Column(String(500))
    recording_duration = Column(Integer)
    gdpr_compliant = Column(Boolean, default=True)
    data_retention_until = Column(DateTime(timezone=True))

    # Geolocation
    caller_country = Column(String(2))
    caller_region = Column(String(50))
    caller_city = Column(String(100))

    # Relationships
    assistant = relationship("Assistant", back_populates="call_logs")
    user = relationship("User", back_populates="call_logs")
    phone_number = relationship("PhoneNumber", back_populates="call_logs")

class PhoneNumber(Base):
    __tablename__ = "phone_numbers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    assistant_id = Column(UUID(as_uuid=True), ForeignKey('assistants.id'))

    # Phone Details
    number = Column(String(20), unique=True, nullable=False)
    country_code = Column(String(3), nullable=False)
    area_code = Column(String(10))
    number_type = Column(String(20), default='local')
    provider = Column(String(50), nullable=False)

    # Status
    status = Column(String(20), default='active')
    forwarding_enabled = Column(Boolean, default=False)
    forwarding_number = Column(String(20))

    # Billing
    monthly_cost = Column(DECIMAL(10,2))
    usage_cost_per_minute = Column(DECIMAL(6,4))

    # Timestamps
    assigned_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="phone_numbers")
    assistant = relationship("Assistant", back_populates="phone_numbers")
    call_logs = relationship("CallLog", back_populates="phone_number")
```

## 🔄 Migration Strategy

### Phase 1: Database Setup (Week 1)

```python
# backend/database/migration.py
from sqlalchemy import create_engine
from .models import Base
from .config import DATABASE_URL

def create_tables():
    """Create all database tables"""
    engine = create_engine(DATABASE_URL)
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created successfully")

def migrate_from_memory(db_session, in_memory_data):
    """Migrate existing in-memory data to database"""
    from .models import Assistant, User

    # Create default user for existing assistants
    default_user = User(
        email="admin@voicepartnerai.com",
        password_hash="$2b$12$placeholder",
        name="System Admin",
        role="admin"
    )
    db_session.add(default_user)
    db_session.commit()

    # Migrate assistants
    for assistant_data in in_memory_data:
        assistant = Assistant(
            user_id=default_user.id,
            name=assistant_data["name"],
            template=assistant_data["template"],
            first_message=assistant_data["first_message"],
            system_prompt=assistant_data["system_prompt"],
            voice_model=assistant_data["voice_model"],
            language=assistant_data["language"],
            status=assistant_data["status"],
            created_at=assistant_data["created_at"],
            updated_at=assistant_data["updated_at"]
        )
        db_session.add(assistant)

    db_session.commit()
    print(f"✅ Migrated {len(in_memory_data)} assistants to database")

if __name__ == "__main__":
    create_tables()
```

### Phase 2: Updated API Endpoints (Week 2)

```python
# backend/api/assistants.py
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from ..database.config import get_db
from ..database.models import Assistant, User
from ..schemas.assistant import AssistantCreate, AssistantResponse, AssistantUpdate

router = APIRouter(prefix="/api/assistants", tags=["assistants"])

@router.post("/", response_model=AssistantResponse)
async def create_assistant(
    assistant: AssistantCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new voice assistant"""
    db_assistant = Assistant(
        user_id=current_user.id,
        **assistant.dict()
    )
    db.add(db_assistant)
    db.commit()
    db.refresh(db_assistant)
    return db_assistant

@router.get("/", response_model=List[AssistantResponse])
async def get_assistants(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100
):
    """Get user's assistants"""
    assistants = db.query(Assistant).filter(
        Assistant.user_id == current_user.id
    ).offset(skip).limit(limit).all()
    return assistants

@router.get("/{assistant_id}", response_model=AssistantResponse)
async def get_assistant(
    assistant_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get specific assistant"""
    assistant = db.query(Assistant).filter(
        Assistant.id == assistant_id,
        Assistant.user_id == current_user.id
    ).first()

    if not assistant:
        raise HTTPException(status_code=404, detail="Assistant not found")

    return assistant

@router.put("/{assistant_id}", response_model=AssistantResponse)
async def update_assistant(
    assistant_id: UUID,
    assistant_update: AssistantUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update assistant"""
    assistant = db.query(Assistant).filter(
        Assistant.id == assistant_id,
        Assistant.user_id == current_user.id
    ).first()

    if not assistant:
        raise HTTPException(status_code=404, detail="Assistant not found")

    for field, value in assistant_update.dict(exclude_unset=True).items():
        setattr(assistant, field, value)

    db.commit()
    db.refresh(assistant)
    return assistant

@router.delete("/{assistant_id}")
async def delete_assistant(
    assistant_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete assistant"""
    assistant = db.query(Assistant).filter(
        Assistant.id == assistant_id,
        Assistant.user_id == current_user.id
    ).first()

    if not assistant:
        raise HTTPException(status_code=404, detail="Assistant not found")

    db.delete(assistant)
    db.commit()
    return {"message": "Assistant deleted successfully"}
```

## 📊 Analytics & Reporting

### Advanced Analytics Queries

```python
# backend/api/analytics.py
from sqlalchemy import func, desc
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

class AnalyticsService:
    def __init__(self, db: Session):
        self.db = db

    def get_user_overview(self, user_id: UUID, days: int = 30):
        """Get comprehensive analytics overview"""
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)

        # Total Calls
        total_calls = self.db.query(func.count(CallLog.id)).filter(
            CallLog.user_id == user_id,
            CallLog.start_time >= start_date
        ).scalar()

        # Success Rate
        completed_calls = self.db.query(func.count(CallLog.id)).filter(
            CallLog.user_id == user_id,
            CallLog.status == 'completed',
            CallLog.start_time >= start_date
        ).scalar()

        success_rate = (completed_calls / total_calls * 100) if total_calls > 0 else 0

        # Average Duration
        avg_duration = self.db.query(func.avg(CallLog.duration)).filter(
            CallLog.user_id == user_id,
            CallLog.status == 'completed',
            CallLog.start_time >= start_date
        ).scalar() or 0

        # Total Cost
        total_cost = self.db.query(func.sum(CallLog.cost)).filter(
            CallLog.user_id == user_id,
            CallLog.start_time >= start_date
        ).scalar() or 0

        # Top Performing Assistants
        top_assistants = self.db.query(
            Assistant.name,
            func.count(CallLog.id).label('call_count'),
            func.avg(CallLog.duration).label('avg_duration'),
            func.sum(CallLog.cost).label('total_cost')
        ).join(CallLog).filter(
            CallLog.user_id == user_id,
            CallLog.start_time >= start_date
        ).group_by(Assistant.id).order_by(desc('call_count')).limit(5).all()

        return {
            "period": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "days": days
            },
            "overview": {
                "total_calls": total_calls,
                "completed_calls": completed_calls,
                "success_rate": round(success_rate, 2),
                "average_duration": round(avg_duration, 2) if avg_duration else 0,
                "total_cost": float(total_cost),
                "cost_per_call": float(total_cost / total_calls) if total_calls > 0 else 0
            },
            "top_assistants": [
                {
                    "name": assistant.name,
                    "call_count": assistant.call_count,
                    "avg_duration": round(float(assistant.avg_duration), 2) if assistant.avg_duration else 0,
                    "total_cost": float(assistant.total_cost) if assistant.total_cost else 0
                }
                for assistant in top_assistants
            ]
        }
```

## 🔒 Security & Compliance

### GDPR Compliance Features

```python
# backend/services/gdpr.py
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

class GDPRService:
    def __init__(self, db: Session):
        self.db = db

    def request_data_export(self, user_id: UUID):
        """Export all user data for GDPR compliance"""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")

        # Collect all user data
        assistants = self.db.query(Assistant).filter(Assistant.user_id == user_id).all()
        call_logs = self.db.query(CallLog).filter(CallLog.user_id == user_id).all()
        phone_numbers = self.db.query(PhoneNumber).filter(PhoneNumber.user_id == user_id).all()

        export_data = {
            "user_profile": {
                "id": str(user.id),
                "email": user.email,
                "name": user.name,
                "created_at": user.created_at.isoformat(),
                "preferences": user.preferences
            },
            "assistants": [
                {
                    "id": str(assistant.id),
                    "name": assistant.name,
                    "template": assistant.template,
                    "created_at": assistant.created_at.isoformat()
                }
                for assistant in assistants
            ],
            "call_history": [
                {
                    "call_id": call.call_id,
                    "start_time": call.start_time.isoformat(),
                    "duration": call.duration,
                    "status": call.status
                }
                for call in call_logs
            ],
            "export_timestamp": datetime.utcnow().isoformat()
        }

        return export_data

    def delete_user_data(self, user_id: UUID):
        """Delete all user data (GDPR Right to be Forgotten)"""
        # Anonymize call logs instead of deleting (for analytics)
        self.db.query(CallLog).filter(CallLog.user_id == user_id).update({
            "caller_number": "ANONYMIZED",
            "conversation_transcript": [],
            "caller_country": None,
            "caller_region": None,
            "caller_city": None
        })

        # Delete assistants and phone numbers
        self.db.query(Assistant).filter(Assistant.user_id == user_id).delete()
        self.db.query(PhoneNumber).filter(PhoneNumber.user_id == user_id).delete()

        # Delete user
        self.db.query(User).filter(User.id == user_id).delete()

        self.db.commit()
        return {"message": "User data deleted successfully"}

    def set_data_retention(self, user_id: UUID, retention_years: int = 7):
        """Set data retention period"""
        retention_date = datetime.utcnow() + timedelta(days=retention_years * 365)

        self.db.query(User).filter(User.id == user_id).update({
            "data_retention_until": retention_date
        })

        self.db.commit()
        return {"retention_until": retention_date.isoformat()}
```

## 🚀 Implementation Timeline

### Week 1: Database Setup & Models
- SQLAlchemy Models Implementation
- Database Schema Creation
- Migration Scripts
- Basic CRUD Operations

### Week 2: API Integration
- Updated FastAPI Endpoints
- Database Session Management
- Error Handling & Validation
- Basic Testing

### Week 3: Advanced Features
- Analytics Queries
- GDPR Compliance Features
- Performance Optimization
- Caching Layer

### Week 4: Production Readiness
- Connection Pooling
- Backup Strategies
- Monitoring & Logging
- Documentation

Diese Datenbank-Integration stellt eine skalierbare, sichere und GDPR-konforme Grundlage für das VoicePartnerAI-System dar.