from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime

class UserCreate(BaseModel):
    """Schema für die User-Erstellung."""
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    """Schema für User-Antworten (ohne Passwort)."""
    id: int
    email: str
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    """Schema für JWT Token."""
    access_token: str
    token_type: str

class ProjectCreate(BaseModel):
    """Schema für die Project-Erstellung."""
    title: str
    description: Optional[str] = None

class Project(BaseModel):
    """Schema für Project-Antworten."""
    id: int
    title: str
    description: Optional[str] = None
    owner_id: int
    
    class Config:
        from_attributes = True


# Assistant Schemas
class AssistantCreate(BaseModel):
    """Schema für die Assistant-Erstellung."""
    name: str
    description: Optional[str] = None
    system_prompt: str
    
    # AI Model Configuration
    llm_provider: str = "OpenAI"
    llm_model: str = "gpt-4o"
    temperature: float = 0.7
    max_tokens: int = 1000
    
    # Voice Configuration
    voice_provider: str = "ElevenLabs"
    voice_id: str
    voice_speed: float = 1.0
    voice_pitch: float = 1.0
    voice_stability: float = 0.75
    
    # Language Settings
    language: str = "de-DE"
    fallback_language: str = "en-US"
    first_message: Optional[str] = None
    
    # Voice Settings
    interruption_sensitivity: str = "medium"
    silence_timeout: int = 3000
    response_delay: int = 500
    
    # Capabilities
    capabilities: Optional[Dict[str, Any]] = None
    
    # Many-to-Many Relations
    tool_ids: Optional[List[int]] = []
    file_ids: Optional[List[int]] = []


class AssistantUpdate(BaseModel):
    """Schema für Assistant-Updates."""
    name: Optional[str] = None
    description: Optional[str] = None
    system_prompt: Optional[str] = None
    
    # AI Model Configuration
    llm_provider: Optional[str] = None
    llm_model: Optional[str] = None
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None
    
    # Voice Configuration
    voice_provider: Optional[str] = None
    voice_id: Optional[str] = None
    voice_speed: Optional[float] = None
    voice_pitch: Optional[float] = None
    voice_stability: Optional[float] = None
    
    # Language Settings
    language: Optional[str] = None
    fallback_language: Optional[str] = None
    first_message: Optional[str] = None
    
    # Voice Settings
    interruption_sensitivity: Optional[str] = None
    silence_timeout: Optional[int] = None
    response_delay: Optional[int] = None
    
    # Status
    status: Optional[str] = None
    is_active: Optional[bool] = None
    
    # Capabilities
    capabilities: Optional[Dict[str, Any]] = None
    
    # Many-to-Many Relations
    tool_ids: Optional[List[int]] = None
    file_ids: Optional[List[int]] = None


class FileResponse(BaseModel):
    """Schema für File-Antworten."""
    id: int
    filename: str
    original_name: str
    file_type: str
    file_size: int
    s3_url: Optional[str] = None
    extracted_text: Optional[str] = None
    description: Optional[str] = None
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class ToolResponse(BaseModel):
    """Schema für Tool-Antworten."""
    id: int
    name: str
    description: str
    endpoint: str
    method: str
    category: str
    is_active: bool
    total_calls: int
    last_used: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class AssistantResponse(BaseModel):
    """Schema für Assistant-Antworten."""
    id: int
    name: str
    description: Optional[str] = None
    system_prompt: str
    
    # AI Model Configuration
    llm_provider: str
    llm_model: str
    temperature: float
    max_tokens: int
    
    # Voice Configuration
    voice_provider: str
    voice_id: str
    voice_speed: float
    voice_pitch: float
    voice_stability: float
    
    # Language Settings
    language: str
    fallback_language: str
    first_message: Optional[str] = None
    
    # Voice Settings
    interruption_sensitivity: str
    silence_timeout: int
    response_delay: int
    
    # Status and Configuration
    status: str
    is_active: bool
    capabilities: Optional[Dict[str, Any]] = None
    
    # Metadata
    owner_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # Relations
    tools: List[ToolResponse] = []
    files: List[FileResponse] = []
    
    class Config:
        from_attributes = True


class AssistantListResponse(BaseModel):
    """Schema für Assistant-Listen."""
    id: int
    name: str
    description: Optional[str] = None
    status: str
    is_active: bool
    voice_provider: str
    llm_model: str
    language: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # Statistics
    tools_count: int = 0
    files_count: int = 0
    
    class Config:
        from_attributes = True


# File Schemas
class FileCreate(BaseModel):
    """Schema für File-Erstellung."""
    filename: str
    original_name: str
    file_type: str
    file_size: int
    description: Optional[str] = None


# Tool Schemas  
class ToolCreate(BaseModel):
    """Schema für Tool-Erstellung."""
    name: str
    description: str
    endpoint: str
    method: str = "GET"
    category: str = "api"
    parameters: Optional[Dict[str, Any]] = None
    headers: Optional[Dict[str, str]] = None
    authentication: Optional[Dict[str, Any]] = None


class ToolUpdate(BaseModel):
    """Schema für Tool-Updates."""
    name: Optional[str] = None
    description: Optional[str] = None
    endpoint: Optional[str] = None
    method: Optional[str] = None
    category: Optional[str] = None
    is_active: Optional[bool] = None
    parameters: Optional[Dict[str, Any]] = None
    headers: Optional[Dict[str, str]] = None
    authentication: Optional[Dict[str, Any]] = None


# Phone Number Schemas
class PhoneNumberCreate(BaseModel):
    """Schema für Phone Number Erstellung."""
    phone_number: str
    friendly_name: str
    capabilities: Dict[str, bool]
    country: str
    region: str
    locality: str
    provider: str = "twilio"
    monthly_price: float
    currency: str = "EUR"
    configuration: Optional[Dict[str, Any]] = None
    assistant_id: Optional[int] = None


class PhoneNumberResponse(BaseModel):
    """Schema für Phone Number Antworten."""
    id: int
    phone_number: str
    friendly_name: str
    capabilities: Dict[str, bool]
    status: str
    country: str
    region: str
    locality: str
    provider: str
    monthly_price: float
    currency: str
    assistant_id: Optional[int] = None
    purchased_at: datetime
    
    class Config:
        from_attributes = True


# Analytics Schemas
class CallLogCreate(BaseModel):
    """Schema für Call Log Erstellung."""
    call_sid: str
    phone_number_id: int
    assistant_id: Optional[int] = None
    caller_number: str
    called_number: str
    direction: str = "inbound"
    start_time: datetime
    end_time: Optional[datetime] = None
    duration_seconds: Optional[int] = None
    status: str = "in-progress"
    credits_consumed: float = 0.0


class CallLogUpdate(BaseModel):
    """Schema für Call Log Updates."""
    end_time: Optional[datetime] = None
    duration_seconds: Optional[int] = None
    billable_seconds: Optional[int] = None
    status: Optional[str] = None
    hangup_cause: Optional[str] = None
    call_quality_score: Optional[float] = None
    ai_response_time_ms: Optional[int] = None
    ai_interruptions: Optional[int] = None
    ai_confidence_avg: Optional[float] = None
    conversation_turns: Optional[int] = None
    credits_consumed: Optional[float] = None
    cost_usd: Optional[float] = None
    cost_eur: Optional[float] = None
    sentiment_score: Optional[float] = None
    intent_detected: Optional[str] = None
    customer_satisfaction: Optional[int] = None
    recording_url: Optional[str] = None
    transcript_url: Optional[str] = None


class CallLogResponse(BaseModel):
    """Schema für Call Log Antworten."""
    id: int
    call_sid: str
    phone_number_id: int
    assistant_id: Optional[int] = None
    caller_number: str
    called_number: str
    direction: str
    start_time: datetime
    end_time: Optional[datetime] = None
    duration_seconds: Optional[int] = None
    billable_seconds: Optional[int] = None
    status: str
    hangup_cause: Optional[str] = None
    call_quality_score: Optional[float] = None
    ai_response_time_ms: Optional[int] = None
    ai_interruptions: int
    ai_confidence_avg: Optional[float] = None
    conversation_turns: int
    credits_consumed: float
    cost_usd: Optional[float] = None
    cost_eur: Optional[float] = None
    sentiment_score: Optional[float] = None
    intent_detected: Optional[str] = None
    customer_satisfaction: Optional[int] = None
    country_code: Optional[str] = None
    region: Optional[str] = None
    created_at: datetime
    
    # Related data
    assistant_name: Optional[str] = None
    phone_number: Optional[str] = None
    
    class Config:
        from_attributes = True


class AnalyticsSummary(BaseModel):
    """Schema für Analytics Summary."""
    # Time Period
    period_start: datetime
    period_end: datetime
    period_type: str  # today, week, month, custom
    
    # Call Volume
    total_calls: int
    successful_calls: int
    failed_calls: int
    abandoned_calls: int
    success_rate: float
    
    # Duration Metrics
    total_duration_seconds: int
    total_duration_minutes: float
    total_duration_hours: float
    avg_duration_seconds: float
    min_duration_seconds: int
    max_duration_seconds: int
    
    # Financial Metrics
    total_credits_consumed: float
    total_cost_usd: float
    total_cost_eur: float
    avg_cost_per_call: float
    cost_per_minute: float
    
    # Quality Metrics
    avg_quality_score: Optional[float] = None
    avg_ai_response_time_ms: Optional[float] = None
    avg_ai_confidence: Optional[float] = None
    avg_customer_satisfaction: Optional[float] = None
    
    # Top Performers
    top_assistant: Optional[Dict[str, Any]] = None
    top_phone_number: Optional[Dict[str, Any]] = None
    top_country: Optional[str] = None
    
    # Comparisons (vs previous period)
    calls_change_percent: Optional[float] = None
    duration_change_percent: Optional[float] = None
    cost_change_percent: Optional[float] = None
    quality_change_percent: Optional[float] = None


class AnalyticsCallHistory(BaseModel):
    """Schema für Call History Response."""
    calls: List[CallLogResponse]
    pagination: Dict[str, Any]
    filters_applied: Dict[str, Any]
    total_calls: int
    total_duration_seconds: int
    total_credits_consumed: float
    summary_stats: Dict[str, Any]


class AnalyticsChart(BaseModel):
    """Schema für Chart-Daten."""
    chart_type: str  # line, bar, pie, donut
    title: str
    labels: List[str]
    datasets: List[Dict[str, Any]]
    period: str
    total_data_points: int


class AnalyticsPerformance(BaseModel):
    """Schema für Performance Analytics."""
    # Assistant Performance
    assistant_stats: List[Dict[str, Any]]
    
    # Phone Number Performance  
    phone_number_stats: List[Dict[str, Any]]
    
    # Time-based Performance
    hourly_performance: Dict[str, Any]
    daily_performance: Dict[str, Any]
    weekly_performance: Dict[str, Any]
    
    # Geographic Performance
    country_performance: Dict[str, Any]
    region_performance: Dict[str, Any]
    
    # Error Analysis
    error_breakdown: Dict[str, Any]
    hangup_causes: Dict[str, Any]
    quality_distribution: Dict[str, Any]


class AnalyticsRealtime(BaseModel):
    """Schema für Real-time Analytics."""
    # Current Stats (last 5 minutes)
    active_calls: int
    calls_last_hour: int
    calls_today: int
    
    # Live Metrics
    avg_response_time_ms: float
    current_success_rate: float
    credits_consumed_today: float
    
    # Recent Activity
    recent_calls: List[CallLogResponse]
    recent_errors: List[Dict[str, Any]]
    
    # System Health
    system_status: str  # healthy, warning, critical
    api_response_time_ms: float
    database_latency_ms: float
    
    # Last Updated
    last_updated: datetime


class BillingAnalytics(BaseModel):
    """Schema für Billing Analytics."""
    # Current Period
    current_period_start: datetime
    current_period_end: datetime
    current_period_cost: float
    current_period_credits: float
    
    # Usage Breakdown
    cost_by_assistant: Dict[str, float]
    cost_by_phone_number: Dict[str, float]
    cost_by_day: Dict[str, float]
    
    # Projections
    projected_monthly_cost: float
    projected_monthly_credits: float
    cost_trend: str  # increasing, decreasing, stable
    
    # Limits and Warnings
    monthly_limit: Optional[float] = None
    current_usage_percent: float
    usage_warnings: List[str]
    
    # Historical Comparison
    last_month_cost: Optional[float] = None
    cost_change_percent: Optional[float] = None
    efficiency_score: float  # Cost per successful call


# Outbound Call Schemas
class OutboundCallStart(BaseModel):
    """Schema für Outbound Call Start Request."""
    phone_number_to_call: str
    assistant_id: int
    phone_number_id: Optional[int] = None  # Which phone number to call from
    priority: str = "normal"  # normal, high, urgent
    scheduled_time: Optional[datetime] = None  # For scheduled calls
    context_data: Optional[Dict[str, Any]] = None  # Additional context for the call
    max_duration_minutes: Optional[int] = 10  # Maximum call duration
    
    
class OutboundCallResponse(BaseModel):
    """Schema für Outbound Call Response."""
    call_id: str
    call_sid: str
    status: str  # queued, initiated, ringing, answered, completed, failed
    phone_number_to_call: str
    phone_number_from: str
    assistant_id: int
    estimated_credits: float
    created_at: datetime
    message: str
    

class OutboundCallStatus(BaseModel):
    """Schema für Outbound Call Status Check."""
    call_id: str
    call_sid: str
    status: str
    duration_seconds: Optional[int] = None
    credits_consumed: float
    cost_eur: Optional[float] = None
    last_updated: datetime
    

class OutboundCallHistory(BaseModel):
    """Schema für Outbound Call History."""
    calls: List[CallLogResponse]
    pagination: Dict[str, Any]
    filters_applied: Dict[str, Any]
    total_outbound_calls: int
    total_duration_seconds: int
    total_credits_consumed: float
    summary_stats: Dict[str, Any]


class CreditCheckResponse(BaseModel):
    """Schema für Credit Check Response."""
    has_sufficient_credits: bool
    current_credits: float
    estimated_call_cost: float
    remaining_credits_after_call: float
    monthly_limit: Optional[float] = None
    monthly_usage: float
    warning_message: Optional[str] = None