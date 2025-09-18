"""
SQLAlchemy Models for VoicePartnerAI
Enterprise Voice AI Platform Database Schema
"""

from sqlalchemy import Column, String, DateTime, Boolean, Integer, Text, ForeignKey, DECIMAL, JSON, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
import uuid

try:
    from sqlalchemy.dialects.postgresql import UUID, JSONB
except ImportError:
    # Fallback for SQLite
    from sqlalchemy import String as UUID
    JSONB = JSON

from .config import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
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
    preferences = Column(JSON, default=lambda: {})

    # GDPR
    data_processing_consent = Column(Boolean, default=False)
    consent_timestamp = Column(DateTime(timezone=True))
    data_retention_until = Column(DateTime(timezone=True))

    # Relationships
    assistants = relationship("Assistant", back_populates="user", cascade="all, delete-orphan")
    call_logs = relationship("CallLog", back_populates="user")

    def __repr__(self):
        return f"<User(email={self.email}, name={self.name})>"

class Assistant(Base):
    __tablename__ = "assistants"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey('users.id'), nullable=False)

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
    voice_settings = Column(JSON, default=lambda: {})
    language = Column(String(5), default='de-DE')

    # Advanced Settings
    max_duration = Column(Integer, default=300)
    silence_timeout = Column(Integer, default=3)
    interruption_enabled = Column(Boolean, default=True)
    background_sound = Column(String(50))

    # Training & Flow
    training_data = Column(JSON, default=lambda: [])
    fallback_responses = Column(JSON, default=lambda: [])
    conversation_flow = Column(JSON, default=lambda: {})

    # Analytics
    analytics_enabled = Column(Boolean, default=True)
    recording_enabled = Column(Boolean, default=False)

    # Integrations
    webhook_url = Column(String(500))
    webhook_events = Column(JSON, default=lambda: [])
    api_keys = Column(JSON, default=lambda: {})
    external_integrations = Column(JSON, default=lambda: {})

    # Metadata
    tags = Column(JSON, default=lambda: [])
    assistant_metadata = Column(JSON, default=lambda: {})

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_used_at = Column(DateTime(timezone=True))

    # Relationships
    user = relationship("User", back_populates="assistants")
    call_logs = relationship("CallLog", back_populates="assistant")

    def __repr__(self):
        return f"<Assistant(name={self.name}, template={self.template})>"

class CallLog(Base):
    __tablename__ = "call_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    assistant_id = Column(String(36), ForeignKey('assistants.id'), nullable=False)
    user_id = Column(String(36), ForeignKey('users.id'), nullable=False)

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
    conversation_transcript = Column(JSON, default=lambda: [])
    sentiment_analysis = Column(JSON, default=lambda: {})
    intent_detection = Column(JSON, default=lambda: {})
    key_phrases = Column(JSON, default=lambda: [])

    # Business Metrics
    conversion_achieved = Column(Boolean, default=False)
    appointment_scheduled = Column(Boolean, default=False)
    lead_qualified = Column(Boolean, default=False)
    customer_satisfaction = Column(Integer)

    # Technical & Billing
    voice_provider = Column(String(50))
    provider_call_data = Column(JSON, default=lambda: {})
    error_details = Column(JSON, default=lambda: {})
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

    def __repr__(self):
        return f"<CallLog(call_id={self.call_id}, status={self.status})>"

class AssistantTemplate(Base):
    __tablename__ = "assistant_templates"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False, unique=True)
    display_name = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(50), nullable=False)

    # Template Configuration
    default_first_message = Column(Text, nullable=False)
    default_system_prompt = Column(Text, nullable=False)
    default_voice_settings = Column(JSON, default=lambda: {})

    # Template Metadata
    industry = Column(String(50))
    use_cases = Column(JSON, default=lambda: [])
    required_integrations = Column(JSON, default=lambda: [])
    estimated_setup_time = Column(Integer, default=5)

    # Template Status
    is_active = Column(Boolean, default=True)
    is_premium = Column(Boolean, default=False)
    popularity_score = Column(Integer, default=0)

    # Versioning
    version = Column(String(10), default='1.0')
    changelog = Column(JSON, default=lambda: [])

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<AssistantTemplate(name={self.name}, category={self.category})>"

class AnalyticsDaily(Base):
    __tablename__ = "analytics_daily"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey('users.id'), nullable=False)
    assistant_id = Column(String(36), ForeignKey('assistants.id'), nullable=True)
    date = Column(DateTime(timezone=True), nullable=False)

    # Call Volume Metrics
    total_calls = Column(Integer, default=0)
    completed_calls = Column(Integer, default=0)
    failed_calls = Column(Integer, default=0)
    average_duration = Column(DECIMAL(10,2))

    # Quality Metrics
    average_audio_quality = Column(DECIMAL(3,2))
    average_latency = Column(Integer)
    transcription_accuracy = Column(DECIMAL(5,2))

    # Business Metrics
    conversion_rate = Column(DECIMAL(5,2))
    customer_satisfaction = Column(DECIMAL(3,2))
    appointments_scheduled = Column(Integer, default=0)
    leads_qualified = Column(Integer, default=0)

    # Cost Metrics
    total_cost = Column(DECIMAL(10,4))
    cost_per_minute = Column(DECIMAL(6,4))

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Unique constraint
    __table_args__ = (UniqueConstraint('user_id', 'assistant_id', 'date', name='_user_assistant_date_uc'),)

    def __repr__(self):
        return f"<AnalyticsDaily(date={self.date}, calls={self.total_calls})>"

# Initialize default templates
DEFAULT_TEMPLATES = [
    {
        "name": "customer-support",
        "display_name": "Customer Support",
        "description": "Professional customer service assistant for handling inquiries, complaints, and support requests",
        "category": "customer-service",
        "default_first_message": "Hello! I'm here to help you with any questions or concerns you may have. How can I assist you today?",
        "default_system_prompt": "You are a professional customer support representative. Be helpful, empathetic, and solution-oriented. Always aim to resolve the customer's issue or direct them to the right resources.",
        "industry": "General",
        "use_cases": ["Support inquiries", "Complaint handling", "Product information"],
        "estimated_setup_time": 3
    },
    {
        "name": "appointment-setter",
        "display_name": "Appointment Setter",
        "description": "Intelligent scheduling assistant for booking appointments and managing calendars",
        "category": "appointment",
        "default_first_message": "Hi! I'd be happy to help you schedule an appointment. What type of appointment are you looking to book?",
        "default_system_prompt": "You are an appointment scheduling assistant. Help users find available time slots, confirm appointments, and provide relevant information about the meeting or service.",
        "industry": "Healthcare, Professional Services",
        "use_cases": ["Medical appointments", "Consultation booking", "Service scheduling"],
        "estimated_setup_time": 5
    },
    {
        "name": "lead-qualifier",
        "display_name": "Lead Qualifier",
        "description": "Sales-focused assistant for qualifying potential customers and gathering lead information",
        "category": "sales",
        "default_first_message": "Thank you for your interest! I'd like to learn more about your needs to see how we can best help you.",
        "default_system_prompt": "You are a lead qualification specialist. Ask relevant questions to understand the prospect's needs, budget, timeline, and decision-making process. Be professional and consultative.",
        "industry": "Sales, Marketing",
        "use_cases": ["Lead qualification", "Sales prospecting", "Initial consultations"],
        "estimated_setup_time": 7
    },
    {
        "name": "order-processing",
        "display_name": "Order Processing",
        "description": "E-commerce assistant for handling orders, payments, and shipping inquiries",
        "category": "sales",
        "default_first_message": "Hello! I'm here to help you with your order. Do you need to place a new order or have questions about an existing one?",
        "default_system_prompt": "You are an order processing assistant. Help customers place orders, track shipments, handle returns, and answer product questions. Be accurate with order details and payment information.",
        "industry": "E-commerce, Retail",
        "use_cases": ["Order placement", "Order tracking", "Returns processing"],
        "estimated_setup_time": 10
    }
]