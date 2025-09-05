from sqlalchemy import Column, Integer, String, ForeignKey, Text, DateTime, Boolean, Float, Table, JSON, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import enum

# Enum für Workspace Rollen
class WorkspaceRole(enum.Enum):
    OWNER = "owner"
    ADMIN = "admin"
    MEMBER = "member"
    VIEWER = "viewer"

# Enum für API-Key Scopes
class APIKeyScope(enum.Enum):
    READ = "read"
    WRITE = "write"
    ADMIN = "admin"
    FULL_ACCESS = "full_access"


class User(Base):
    """User Modell für die Datenbank."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    
    # Persönliche Daten
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    
    # Account Status
    is_active = Column(Boolean, nullable=False, default=True)
    is_verified = Column(Boolean, nullable=False, default=False)
    
    # Workspace-bezogene Felder
    current_workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Beziehungen
    workspace_memberships = relationship("WorkspaceMember", back_populates="user")
    current_workspace = relationship("Workspace", foreign_keys=[current_workspace_id])


class Workspace(Base):
    """Workspace Modell für Team-Kollaboration."""
    __tablename__ = "workspaces"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    slug = Column(String(100), unique=True, index=True, nullable=False)  # URL-friendly identifier
    description = Column(Text, nullable=True)
    
    # Workspace Settings
    settings = Column(JSON, nullable=True)  # Custom workspace settings
    
    # Billing Information
    plan = Column(String(50), nullable=False, default="free")  # free, pro, enterprise
    billing_email = Column(String(255), nullable=True)
    
    # Limits and Usage
    member_limit = Column(Integer, nullable=False, default=5)
    credits_limit = Column(Float, nullable=False, default=100.0)
    current_credits = Column(Float, nullable=False, default=0.0)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Beziehungen
    members = relationship("WorkspaceMember", back_populates="workspace")
    projects = relationship("Project", back_populates="workspace")
    assistants = relationship("Assistant", back_populates="workspace")
    files = relationship("File", back_populates="workspace")
    tools = relationship("Tool", back_populates="workspace")
    phone_numbers = relationship("PhoneNumber", back_populates="workspace")
    call_logs = relationship("CallLog", back_populates="workspace")


class WorkspaceMember(Base):
    """Brücken-Tabelle für User-Workspace Zugehörigkeit mit Rollen."""
    __tablename__ = "workspace_members"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False)
    
    # Rolle im Workspace
    role = Column(Enum(WorkspaceRole), nullable=False, default=WorkspaceRole.MEMBER)
    
    # Berechtigung-Einstellungen
    permissions = Column(JSON, nullable=True)  # Custom permissions
    
    # Einladungs-Informationen
    invited_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    invited_at = Column(DateTime(timezone=True), nullable=True)
    joined_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Status
    is_active = Column(Boolean, nullable=False, default=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Beziehungen
    user = relationship("User", back_populates="workspace_memberships", foreign_keys=[user_id])
    workspace = relationship("Workspace", back_populates="members")
    invited_by = relationship("User", foreign_keys=[invited_by_user_id])
    
    # Unique constraint: Ein User kann nur einmal pro Workspace Mitglied sein
    __table_args__ = (
        {"extend_existing": True}
    )

class Project(Base):
    """Project Modell für die Datenbank."""
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    
    # Workspace-Zugehörigkeit
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False)
    
    # Ersteller des Projekts (für Audit-Zwecke)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Beziehungen
    workspace = relationship("Workspace", back_populates="projects")
    created_by = relationship("User")


# Association Tables für Many-to-Many Beziehungen
assistant_tools = Table(
    'assistant_tools',
    Base.metadata,
    Column('assistant_id', Integer, ForeignKey('assistants.id'), primary_key=True),
    Column('tool_id', Integer, ForeignKey('tools.id'), primary_key=True)
)

assistant_files = Table(
    'assistant_files', 
    Base.metadata,
    Column('assistant_id', Integer, ForeignKey('assistants.id'), primary_key=True),
    Column('file_id', Integer, ForeignKey('files.id'), primary_key=True)
)


class Assistant(Base):
    """Assistant Modell für Voice AI Agenten."""
    __tablename__ = "assistants"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    system_prompt = Column(Text, nullable=False)
    
    # AI Model Configuration
    llm_provider = Column(String(50), nullable=False, default="OpenAI")
    llm_model = Column(String(100), nullable=False, default="gpt-4o")
    temperature = Column(Float, nullable=False, default=0.7)
    max_tokens = Column(Integer, nullable=False, default=1000)
    
    # Voice Configuration  
    voice_provider = Column(String(50), nullable=False, default="ElevenLabs")
    voice_id = Column(String(100), nullable=False)
    voice_speed = Column(Float, nullable=False, default=1.0)
    voice_pitch = Column(Float, nullable=False, default=1.0)
    voice_stability = Column(Float, nullable=False, default=0.75)
    
    # Language Settings
    language = Column(String(10), nullable=False, default="de-DE")
    fallback_language = Column(String(10), nullable=False, default="en-US")
    first_message = Column(Text, nullable=True)
    
    # Voice Settings
    interruption_sensitivity = Column(String(20), nullable=False, default="medium")
    silence_timeout = Column(Integer, nullable=False, default=3000)
    response_delay = Column(Integer, nullable=False, default=500)
    
    # Status and Configuration
    status = Column(String(20), nullable=False, default="draft")  # draft, testing, deployed
    is_active = Column(Boolean, nullable=False, default=True)
    
    # Capabilities (stored as JSON)
    capabilities = Column(JSON, nullable=True)
    
    # Workspace-Zugehörigkeit
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Beziehungen
    workspace = relationship("Workspace", back_populates="assistants")
    created_by = relationship("User")
    tools = relationship("Tool", secondary=assistant_tools, back_populates="assistants")
    files = relationship("File", secondary=assistant_files, back_populates="assistants")
    phone_numbers = relationship("PhoneNumber", back_populates="assistant")


class File(Base):
    """File Modell für Dokument-Management."""
    __tablename__ = "files"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    original_name = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=False)
    file_size = Column(Integer, nullable=False)
    s3_url = Column(String(500), nullable=True)
    
    # Text Extraction
    extracted_text = Column(Text, nullable=True)
    
    # Metadata
    description = Column(Text, nullable=True)
    status = Column(String(20), nullable=False, default="uploading")  # uploading, processed, error
    
    # Workspace-Zugehörigkeit
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Beziehungen
    workspace = relationship("Workspace", back_populates="files")
    created_by = relationship("User")
    assistants = relationship("Assistant", secondary=assistant_files, back_populates="files")


class Tool(Base):
    """Tool Modell für Function Calling."""
    __tablename__ = "tools"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    endpoint = Column(String(500), nullable=False)
    method = Column(String(10), nullable=False, default="GET")
    
    # Configuration
    parameters = Column(JSON, nullable=True)  # Parameter definitions
    headers = Column(JSON, nullable=True)     # Custom headers
    authentication = Column(JSON, nullable=True)  # Auth config
    response_format = Column(JSON, nullable=True)  # Response handling
    
    # Category and Status
    category = Column(String(50), nullable=False, default="api")  # api, webhook, database, service
    is_active = Column(Boolean, nullable=False, default=True)
    
    # Usage Statistics
    total_calls = Column(Integer, nullable=False, default=0)
    last_used = Column(DateTime(timezone=True), nullable=True)
    avg_response_time = Column(Float, nullable=True)
    
    # Workspace-Zugehörigkeit
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Beziehungen
    workspace = relationship("Workspace", back_populates="tools")
    created_by = relationship("User")
    assistants = relationship("Assistant", secondary=assistant_tools, back_populates="tools")


class PhoneNumber(Base):
    """PhoneNumber Modell für Telefonie-Integration."""
    __tablename__ = "phone_numbers"

    id = Column(Integer, primary_key=True, index=True)
    phone_number = Column(String(50), nullable=False, unique=True)
    friendly_name = Column(String(255), nullable=False)
    
    # Capabilities
    capabilities = Column(JSON, nullable=False)  # voice, sms, mms, fax
    
    # Geographic Information  
    country = Column(String(10), nullable=False)
    region = Column(String(100), nullable=False)
    locality = Column(String(100), nullable=False)
    
    # Provider Information
    provider = Column(String(50), nullable=False, default="twilio")
    monthly_price = Column(Float, nullable=False)
    currency = Column(String(10), nullable=False, default="EUR")
    
    # Twilio Integration
    twilio_sid = Column(String(100), nullable=True)
    twilio_account_sid = Column(String(100), nullable=True)
    
    # Configuration
    configuration = Column(JSON, nullable=True)  # webhook URLs, methods etc.
    
    # Status and Usage
    status = Column(String(20), nullable=False, default="active")  # active, inactive, pending
    usage = Column(JSON, nullable=True)  # usage statistics
    
    # Assistant Assignment
    assistant_id = Column(Integer, ForeignKey("assistants.id"), nullable=True)
    
    # Workspace-Zugehörigkeit
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Timestamps
    purchased_at = Column(DateTime(timezone=True), server_default=func.now())
    last_used = Column(DateTime(timezone=True), nullable=True)
    
    # Beziehungen
    workspace = relationship("Workspace", back_populates="phone_numbers")
    created_by = relationship("User")
    assistant = relationship("Assistant", back_populates="phone_numbers")
    call_logs = relationship("CallLog", back_populates="phone_number")


class CallLog(Base):
    """CallLog Modell für detaillierte Anruf-Analytics."""
    __tablename__ = "call_logs"

    id = Column(Integer, primary_key=True, index=True)
    
    # Call Identification
    call_sid = Column(String(100), nullable=False, unique=True)  # Twilio Call SID
    phone_number_id = Column(Integer, ForeignKey("phone_numbers.id"), nullable=False)
    assistant_id = Column(Integer, ForeignKey("assistants.id"), nullable=True)
    
    # Call Participants
    caller_number = Column(String(50), nullable=False)  # From number
    called_number = Column(String(50), nullable=False)  # To number
    direction = Column(String(20), nullable=False)  # inbound, outbound
    
    # Call Timing
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=True)
    duration_seconds = Column(Integer, nullable=True)  # Total call duration
    billable_seconds = Column(Integer, nullable=True)  # Billable duration (after connection)
    
    # Call Status and Quality
    status = Column(String(20), nullable=False)  # completed, failed, busy, no-answer, canceled
    hangup_cause = Column(String(50), nullable=True)  # Normal, busy, failed, timeout
    call_quality_score = Column(Float, nullable=True)  # 0.0 - 1.0 quality rating
    
    # AI Assistant Performance
    ai_response_time_ms = Column(Integer, nullable=True)  # Average AI response time
    ai_interruptions = Column(Integer, nullable=False, default=0)  # Number of interruptions
    ai_confidence_avg = Column(Float, nullable=True)  # Average AI confidence score
    conversation_turns = Column(Integer, nullable=False, default=0)  # Number of turns
    
    # Billing and Credits
    credits_consumed = Column(Float, nullable=False, default=0.0)
    cost_usd = Column(Float, nullable=True)  # Cost in USD
    cost_eur = Column(Float, nullable=True)  # Cost in EUR
    billing_rate = Column(Float, nullable=True)  # Rate per minute
    
    # Technical Details
    provider_data = Column(JSON, nullable=True)  # Provider-specific data
    error_details = Column(JSON, nullable=True)  # Error information if call failed
    recording_url = Column(String(500), nullable=True)  # Call recording URL
    transcript_url = Column(String(500), nullable=True)  # Conversation transcript URL
    
    # Conversation Analytics
    sentiment_score = Column(Float, nullable=True)  # -1.0 (negative) to 1.0 (positive)
    intent_detected = Column(String(100), nullable=True)  # Primary detected intent
    keywords_extracted = Column(JSON, nullable=True)  # Key topics/keywords
    customer_satisfaction = Column(Integer, nullable=True)  # 1-5 rating if collected
    
    # Metadata
    user_agent = Column(String(200), nullable=True)  # Client user agent
    ip_address = Column(String(45), nullable=True)  # Caller IP if available
    country_code = Column(String(10), nullable=True)  # Caller country
    region = Column(String(100), nullable=True)  # Caller region
    
    # Workspace-Zugehörigkeit
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Beziehungen
    workspace = relationship("Workspace", back_populates="call_logs")
    created_by = relationship("User")
    phone_number = relationship("PhoneNumber", back_populates="call_logs")
    assistant = relationship("Assistant")


class AnalyticsSnapshot(Base):
    """Snapshot-Tabelle für Pre-aggregierte Analytics-Daten."""
    __tablename__ = "analytics_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    
    # Snapshot Configuration
    snapshot_date = Column(DateTime(timezone=True), nullable=False)
    time_period = Column(String(20), nullable=False)  # hourly, daily, weekly, monthly
    
    # Workspace-Zugehörigkeit
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Call Volume Metrics
    total_calls = Column(Integer, nullable=False, default=0)
    successful_calls = Column(Integer, nullable=False, default=0)
    failed_calls = Column(Integer, nullable=False, default=0)
    abandoned_calls = Column(Integer, nullable=False, default=0)
    
    # Duration Metrics (in seconds)
    total_duration = Column(Integer, nullable=False, default=0)
    avg_duration = Column(Float, nullable=True)
    min_duration = Column(Integer, nullable=True)
    max_duration = Column(Integer, nullable=True)
    
    # Financial Metrics
    total_credits_consumed = Column(Float, nullable=False, default=0.0)
    total_cost_usd = Column(Float, nullable=False, default=0.0)
    total_cost_eur = Column(Float, nullable=False, default=0.0)
    avg_cost_per_call = Column(Float, nullable=True)
    
    # Quality Metrics
    avg_quality_score = Column(Float, nullable=True)
    avg_ai_response_time = Column(Float, nullable=True)
    avg_ai_confidence = Column(Float, nullable=True)
    avg_customer_satisfaction = Column(Float, nullable=True)
    
    # Assistant Performance
    top_assistant_id = Column(Integer, ForeignKey("assistants.id"), nullable=True)
    assistant_performance = Column(JSON, nullable=True)  # Performance by assistant
    
    # Geographic Distribution
    top_countries = Column(JSON, nullable=True)  # Top calling countries
    regional_distribution = Column(JSON, nullable=True)  # Call distribution by region
    
    # Time-based Patterns
    hourly_distribution = Column(JSON, nullable=True)  # Calls by hour of day
    daily_distribution = Column(JSON, nullable=True)   # Calls by day of week
    
    # Error Analysis
    error_breakdown = Column(JSON, nullable=True)  # Errors by type
    hangup_causes = Column(JSON, nullable=True)   # Hangup causes distribution
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Beziehungen
    workspace = relationship("Workspace")
    created_by = relationship("User")
    top_assistant = relationship("Assistant")


class APIKey(Base):
    """API-Key Modell für externe Entwickler-Zugriffe."""
    __tablename__ = "api_keys"

    id = Column(Integer, primary_key=True, index=True)
    
    # Key Information (never store plain text key!)
    key_prefix = Column(String(8), nullable=False)  # First 8 chars for identification
    key_hash = Column(String(128), nullable=False, unique=True, index=True)  # Hashed full key
    
    # Metadata
    name = Column(String(100), nullable=False)  # User-defined name for the key
    description = Column(Text, nullable=True)   # Optional description
    
    # Scope and Permissions
    scopes = Column(JSON, nullable=False)  # List of APIKeyScope values
    
    # Owner Information
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False)
    
    # Status and Lifecycle
    is_active = Column(Boolean, nullable=False, default=True)
    last_used_at = Column(DateTime(timezone=True), nullable=True)
    usage_count = Column(Integer, nullable=False, default=0)
    
    # Rate Limiting
    rate_limit_per_minute = Column(Integer, nullable=False, default=60)
    rate_limit_per_hour = Column(Integer, nullable=False, default=1000)
    rate_limit_per_day = Column(Integer, nullable=False, default=10000)
    
    # Restrictions
    allowed_ips = Column(JSON, nullable=True)  # List of allowed IP addresses/ranges
    expires_at = Column(DateTime(timezone=True), nullable=True)  # Optional expiration
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Beziehungen
    user = relationship("User")
    workspace = relationship("Workspace")
    
    def __repr__(self):
        return f"<APIKey(prefix='{self.key_prefix}...', name='{self.name}', active={self.is_active})>"


class APIKeyUsage(Base):
    """Tracking-Tabelle für API-Key Nutzung und Rate Limiting."""
    __tablename__ = "api_key_usage"

    id = Column(Integer, primary_key=True, index=True)
    
    # API Key Reference
    api_key_id = Column(Integer, ForeignKey("api_keys.id"), nullable=False)
    
    # Request Information
    endpoint = Column(String(200), nullable=False)
    method = Column(String(10), nullable=False)
    status_code = Column(Integer, nullable=False)
    
    # Client Information
    ip_address = Column(String(45), nullable=True)  # IPv4/IPv6
    user_agent = Column(String(500), nullable=True)
    
    # Response Information
    response_time_ms = Column(Integer, nullable=True)
    tokens_used = Column(Integer, nullable=True)  # For AI endpoints
    credits_consumed = Column(Float, nullable=True)
    
    # Error Information
    error_message = Column(Text, nullable=True)
    error_code = Column(String(50), nullable=True)
    
    # Timestamps
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    # Beziehungen
    api_key = relationship("APIKey")
    
    def __repr__(self):
        return f"<APIKeyUsage(key_id={self.api_key_id}, endpoint='{self.endpoint}', status={self.status_code})>"