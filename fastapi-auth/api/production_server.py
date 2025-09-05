"""
PHASE 4: Öffentliche API - Das Tor zur Welt
Professionelle, gut dokumentierte API für Entwickler
"""

import logging
import asyncio
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import os

from fastapi import FastAPI, HTTPException, Depends, Header, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
import uvicorn
import redis.asyncio as redis

# Core Components Import
from core.interfaces import ProviderConfig, AssistantConfig
from core.provider_factory import DefaultProviderFactory
from core.call_orchestrator import ProductionCallOrchestrator
from core.usage_tracker import SQLiteUsageTracker
from core.billing_engine import ProductionBillingEngine
from core.security_middleware import SecurityMiddleware, APIKeyManager
from core.monitoring_system import MonitoringSystem
from core.fallback_system import FallbackSystem

# Setup Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============================================================================
# PYDANTIC MODELS FOR API
# ============================================================================

class CallInitiationRequest(BaseModel):
    """Request Model für Call-Initiierung"""
    assistant_id: str = Field(..., description="ID des zu verwendenden Voice Assistants")
    phone_number: str = Field(..., description="Telefonnummer für den Anruf")
    caller_id: Optional[str] = Field(None, description="Optional Caller ID")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Zusätzliche Metadaten")

class CallInitiationResponse(BaseModel):
    """Response Model für Call-Initiierung"""
    call_id: str
    status: str
    assistant_id: str
    phone_number: str
    initiated_at: str
    websocket_url: Optional[str] = None

class CallStatusResponse(BaseModel):
    """Response Model für Call-Status"""
    call_id: str
    status: str
    user_id: str
    assistant_id: str
    started_at: str
    duration_seconds: Optional[int] = None
    total_cost: float
    messages_exchanged: int

class AssistantCreateRequest(BaseModel):
    """Request Model für Assistant-Erstellung"""
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    system_prompt: str = Field(..., min_length=10, max_length=2000)
    
    # LLM Configuration
    llm_provider: str = Field(default="openai", description="LLM Provider (openai, anthropic)")
    llm_model: str = Field(default="gpt-4o", description="LLM Model")
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    max_tokens: int = Field(default=1000, ge=100, le=4000)
    
    # TTS Configuration
    tts_provider: str = Field(default="elevenlabs", description="TTS Provider")
    voice_id: str = Field(default="21m00Tcm4TlvDq8ikWAM", description="Voice ID")
    voice_speed: float = Field(default=1.0, ge=0.5, le=2.0)
    voice_stability: float = Field(default=0.75, ge=0.0, le=1.0)
    
    # STT Configuration
    stt_provider: str = Field(default="deepgram", description="STT Provider")
    language: str = Field(default="de-DE", description="Primäre Sprache")
    
    # Call Behavior
    first_message: Optional[str] = Field(None, max_length=200)
    max_call_duration: int = Field(default=1800, ge=60, le=7200)

class UsageSummaryResponse(BaseModel):
    """Response Model für Usage-Zusammenfassung"""
    user_id: str
    time_range: Dict[str, str]
    total_cost: float
    unique_calls: int
    service_breakdown: Dict[str, Any]
    provider_breakdown: Dict[str, Any]

class BillingResponse(BaseModel):
    """Response Model für Billing-Informationen"""
    user_id: str
    current_balance: float
    currency: str
    recent_transactions: List[Dict[str, Any]]

# ============================================================================
# FASTAPI APPLICATION SETUP
# ============================================================================

app = FastAPI(
    title="VoicePartnerAI Production API",
    version="2.0.0",
    description="""
    **VoicePartnerAI Production API**
    
    Professionelle Voice AI Plattform mit:
    
    * **Call Management**: Initiierung und Verwaltung von Voice AI Anrufen
    * **Assistant Management**: Erstellung und Konfiguration von Voice Assistants  
    * **Real-time Audio Processing**: STT, LLM, TTS Pipeline
    * **Usage Tracking**: Granulares Tracking aller Service-Operationen
    * **Billing System**: Transparente, kostenbasierte Abrechnung
    * **High Availability**: Fallback-Provider und Monitoring
    
    ## Authentication
    
    Alle API-Endpunkte erfordern einen gültigen API-Key im `Authorization` Header:
    ```
    Authorization: Bearer your-api-key-here
    ```
    
    ## Rate Limiting
    
    * Standard: 1000 Requests/Stunde
    * Premium: 10000 Requests/Stunde
    
    ## WebSocket Support
    
    Für Real-time Audio Streaming:
    ```
    wss://api.voicepartner.ai/ws/calls/{call_id}
    ```
    """,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In Production: Spezifische Domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# ============================================================================
# DEPENDENCY INJECTION SETUP
# ============================================================================

async def get_redis_client():
    """Redis Client für Session Management"""
    return redis.from_url("redis://localhost:6379", decode_responses=True)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Authentifizierung und User-Extraktion mit Security Manager"""
    api_key = credentials.credentials
    
    # API Key über Security Manager validieren
    if not api_key_manager:
        # Fallback für Development
        if not api_key or len(api_key) < 10:
            raise HTTPException(status_code=401, detail="Invalid API key")
        
        user_id = f"user_{api_key[:8]}"
        return {
            "user_id": user_id,
            "api_key": api_key,
            "plan": "premium",
            "rate_limit": 10000
        }
    
    # Production API Key Validation
    user_data = await api_key_manager.validate_api_key(api_key)
    if not user_data:
        raise HTTPException(status_code=401, detail="Invalid or expired API key")
    
    return user_data

# ============================================================================
# GLOBAL COMPONENTS INITIALIZATION
# ============================================================================

# Provider Configurations
provider_configs = {
    "openai": ProviderConfig(
        provider_name="openai",
        api_key=os.getenv("OPENAI_API_KEY", "demo-key"),
        timeout_seconds=30
    ),
    "elevenlabs": ProviderConfig(
        provider_name="elevenlabs", 
        api_key=os.getenv("ELEVENLABS_API_KEY", "demo-key"),
        timeout_seconds=30
    ),
    "deepgram": ProviderConfig(
        provider_name="deepgram",
        api_key=os.getenv("DEEPGRAM_API_KEY", "demo-key"),
        timeout_seconds=30
    )
}

# Initialize Core Components
provider_factory = DefaultProviderFactory(provider_configs)
usage_tracker = SQLiteUsageTracker("production_usage.db")
billing_engine = ProductionBillingEngine("production_billing.db", platform_margin=0.25)

# Global Components (werden bei Startup initialisiert)
redis_client = None
call_orchestrator = None
monitoring_system = None
fallback_system = None
api_key_manager = None

@app.on_event("startup")
async def startup_event():
    """Initialisierung beim Server-Start"""
    global redis_client, call_orchestrator, monitoring_system, fallback_system, api_key_manager
    
    try:
        # Redis Connection
        redis_client = await get_redis_client()
        await redis_client.ping()
        logger.info("Redis connection established")
        
        # Security & API Key Manager
        api_key_manager = APIKeyManager(redis_client)
        
        # Fallback System
        fallback_system = FallbackSystem(redis_client)
        
        # Call Orchestrator initialisieren
        call_orchestrator = ProductionCallOrchestrator(
            provider_factory=provider_factory,
            usage_tracker=usage_tracker,
            redis_client=redis_client,
            fallback_enabled=True
        )
        
        # Monitoring System
        monitoring_system = MonitoringSystem(
            redis_client=redis_client,
            usage_tracker=usage_tracker,
            billing_engine=billing_engine
        )
        
        # Provider Health Check
        health_results = provider_factory.health_check_all()
        logger.info(f"Provider health check completed: {health_results}")
        
        # Security Middleware hinzufügen
        security_config = {
            "rate_limit_requests": 1000,
            "rate_limit_window": 3600,
            "max_request_size": 10 * 1024 * 1024,
            "blocked_ips": [],
            "allowed_origins": ["*"]
        }
        app.add_middleware(SecurityMiddleware, redis_client=redis_client, config=security_config)
        
        # Monitoring starten
        await monitoring_system.start_monitoring()
        
        logger.info("VoicePartnerAI Production API with Security & Monitoring started successfully")
        
    except Exception as e:
        logger.error(f"Startup failed: {e}")
        raise

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup beim Server-Shutdown"""
    global redis_client, monitoring_system
    
    # Monitoring stoppen
    if monitoring_system:
        await monitoring_system.stop_monitoring()
        logger.info("Monitoring system stopped")
    
    if redis_client:
        await redis_client.close()
        logger.info("Redis connection closed")
    
    logger.info("VoicePartnerAI Production API shutdown complete")

# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.get("/", include_in_schema=False)
async def root():
    """Serve Frontend Application"""
    try:
        return FileResponse('static/index.html')
    except:
        return {
            "message": "VoicePartnerAI Production API",
            "version": "2.0.0",
            "status": "online",
            "docs": "/docs",
            "health": "/health"
        }

@app.get("/health", 
         summary="System Health Check",
         description="Überprüft den Status aller System-Komponenten")
async def health_check():
    """Comprehensive Health Check"""
    try:
        health_status = {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "version": "2.0.0",
            "components": {}
        }
        
        # Redis Check
        try:
            await redis_client.ping()
            health_status["components"]["redis"] = "healthy"
        except:
            health_status["components"]["redis"] = "unhealthy"
            health_status["status"] = "degraded"
        
        # Provider Checks
        provider_health = provider_factory.health_check_all()
        health_status["components"]["providers"] = provider_health
        
        # Database Checks
        try:
            current_balance = await billing_engine.get_user_balance("health_check_user")
            health_status["components"]["billing_db"] = "healthy"
        except:
            health_status["components"]["billing_db"] = "unhealthy"
            health_status["status"] = "degraded"
        
        return health_status
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

# ============================================================================
# SECURITY & MONITORING ENDPOINTS
# ============================================================================

@app.get("/api/security/status",
         summary="Security System Status",
         description="Gibt aktuellen Status des Security-Systems zurück")
async def get_security_status(current_user: Dict = Depends(get_current_user)):
    """Security System Status"""
    try:
        if not fallback_system:
            return {"error": "Security system not initialized"}
        
        status = await fallback_system.get_system_status()
        return {
            "security_status": "active",
            "circuit_breakers": status["circuit_breakers"],
            "provider_health": status["provider_health"],
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Security status error: {e}")
        raise HTTPException(status_code=500, detail=f"Security status error: {str(e)}")

@app.get("/api/monitoring/metrics",
         summary="System Metrics",
         description="Gibt System-Metriken für Monitoring zurück")  
async def get_monitoring_metrics(current_user: Dict = Depends(get_current_user)):
    """System Monitoring Metrics"""
    try:
        if not monitoring_system:
            return {"error": "Monitoring system not initialized"}
        
        metrics = await monitoring_system.get_system_metrics()
        return {
            "monitoring_status": "active",
            "metrics": metrics,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Monitoring metrics error: {e}")
        raise HTTPException(status_code=500, detail=f"Monitoring metrics error: {str(e)}")

@app.post("/api/security/circuit-breaker/{name}/reset",
          summary="Reset Circuit Breaker",
          description="Setzt einen Circuit Breaker manuell zurück")
async def reset_circuit_breaker(
    name: str,
    current_user: Dict = Depends(get_current_user)
):
    """Reset Circuit Breaker"""
    try:
        if not fallback_system:
            raise HTTPException(status_code=503, detail="Fallback system not available")
        
        success = await fallback_system.reset_circuit_breaker(name)
        
        if success:
            return {
                "message": f"Circuit breaker {name} reset successfully",
                "timestamp": datetime.now().isoformat()
            }
        else:
            raise HTTPException(status_code=404, detail=f"Circuit breaker {name} not found")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Circuit breaker reset error: {e}")
        raise HTTPException(status_code=500, detail=f"Reset failed: {str(e)}")

@app.get("/api/monitoring/fallback-stats",
         summary="Fallback Statistics", 
         description="Gibt Fallback-Nutzungsstatistiken zurück")
async def get_fallback_statistics(
    days: int = 7,
    current_user: Dict = Depends(get_current_user)
):
    """Fallback Usage Statistics"""
    try:
        if not fallback_system:
            raise HTTPException(status_code=503, detail="Fallback system not available")
        
        stats = await fallback_system.get_fallback_statistics(days)
        return {
            "statistics": stats,
            "period_days": days,
            "timestamp": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Fallback statistics error: {e}")
        raise HTTPException(status_code=500, detail=f"Statistics error: {str(e)}")

@app.post("/api/security/api-key/generate",
          summary="Generate API Key",
          description="Generiert einen neuen API Key für den User")
async def generate_api_key(
    plan: str = "standard",
    current_user: Dict = Depends(get_current_user)
):
    """Generate new API Key"""
    try:
        if not api_key_manager:
            raise HTTPException(status_code=503, detail="API key manager not available")
        
        new_api_key = await api_key_manager.generate_api_key(
            current_user["user_id"], 
            plan
        )
        
        return {
            "api_key": new_api_key,
            "plan": plan,
            "user_id": current_user["user_id"],
            "created_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"API key generation error: {e}")
        raise HTTPException(status_code=500, detail=f"API key generation failed: {str(e)}")

@app.post("/api/security/api-key/{api_key}/revoke",
          summary="Revoke API Key",
          description="Widerruft einen API Key")
async def revoke_api_key(
    api_key: str,
    current_user: Dict = Depends(get_current_user)
):
    """Revoke API Key"""
    try:
        if not api_key_manager:
            raise HTTPException(status_code=503, detail="API key manager not available")
        
        success = await api_key_manager.revoke_api_key(api_key)
        
        if success:
            return {
                "message": f"API key revoked successfully",
                "revoked_at": datetime.now().isoformat()
            }
        else:
            raise HTTPException(status_code=404, detail="API key not found")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"API key revocation error: {e}")
        raise HTTPException(status_code=500, detail=f"Revocation failed: {str(e)}")

# ============================================================================
# CALL MANAGEMENT ENDPOINTS
# ============================================================================

@app.post("/api/calls/initiate",
          response_model=CallInitiationResponse,
          summary="Initiate Voice Call",
          description="Startet einen neuen Voice AI Anruf mit dem spezifizierten Assistant")
async def initiate_call(
    request: CallInitiationRequest,
    current_user: Dict = Depends(get_current_user)
):
    """Initiiert einen neuen Voice AI Anruf"""
    try:
        call_config = {
            "assistant_id": request.assistant_id,
            "user_id": current_user["user_id"],
            "phone_number": request.phone_number,
            "caller_id": request.caller_id,
            "metadata": request.metadata or {}
        }
        
        # Call über Orchestrator initiieren
        call_context = await call_orchestrator.initiate_call(call_config)
        
        return CallInitiationResponse(
            call_id=call_context.call_id,
            status=call_context.status.value,
            assistant_id=call_context.assistant_id,
            phone_number=call_context.phone_number,
            initiated_at=call_context.started_at,
            websocket_url=f"/ws/calls/{call_context.call_id}"
        )
        
    except Exception as e:
        logger.error(f"Failed to initiate call: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to initiate call: {str(e)}")

@app.get("/api/calls/{call_id}/status",
         response_model=CallStatusResponse,
         summary="Get Call Status",
         description="Gibt den aktuellen Status eines Anrufs zurück")
async def get_call_status(
    call_id: str,
    current_user: Dict = Depends(get_current_user)
):
    """Gibt aktuellen Call-Status zurück"""
    try:
        call_context = await call_orchestrator.get_call_status(call_id)
        
        if not call_context:
            raise HTTPException(status_code=404, detail="Call not found")
        
        # Prüfen ob User berechtigt ist
        if call_context.user_id != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Duration berechnen
        duration_seconds = None
        if call_context.status.value in ["ended", "failed"]:
            started = datetime.fromisoformat(call_context.started_at)
            ended = datetime.fromisoformat(call_context.metadata.get("ended_at", datetime.now().isoformat()))
            duration_seconds = int((ended - started).total_seconds())
        
        return CallStatusResponse(
            call_id=call_context.call_id,
            status=call_context.status.value,
            user_id=call_context.user_id,
            assistant_id=call_context.assistant_id,
            started_at=call_context.started_at,
            duration_seconds=duration_seconds,
            total_cost=call_context.total_cost,
            messages_exchanged=len(call_context.conversation_history)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get call status: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get call status: {str(e)}")

@app.post("/api/calls/{call_id}/end",
          summary="End Call",
          description="Beendet einen aktiven Anruf und führt die Abrechnung durch")
async def end_call(
    call_id: str,
    current_user: Dict = Depends(get_current_user),
    background_tasks: BackgroundTasks = BackgroundTasks()
):
    """Beendet einen Anruf"""
    try:
        # Call Status prüfen
        call_context = await call_orchestrator.get_call_status(call_id)
        
        if not call_context:
            raise HTTPException(status_code=404, detail="Call not found")
        
        if call_context.user_id != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Call beenden
        call_summary = await call_orchestrator.end_call(call_id)
        
        # Billing im Hintergrund verarbeiten
        background_tasks.add_task(
            process_call_billing_async,
            call_id,
            current_user["user_id"],
            call_context.usage_logs
        )
        
        return {
            "call_id": call_id,
            "status": "ended",
            "summary": call_summary,
            "billing_status": "processing"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to end call: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to end call: {str(e)}")

# ============================================================================
# ASSISTANT MANAGEMENT ENDPOINTS
# ============================================================================

@app.post("/api/assistants/",
          summary="Create Assistant",
          description="Erstellt einen neuen Voice Assistant mit spezifischer Konfiguration")
async def create_assistant(
    request: AssistantCreateRequest,
    current_user: Dict = Depends(get_current_user)
):
    """Erstellt einen neuen Voice Assistant"""
    try:
        # Assistant Config erstellen
        assistant_config = AssistantConfig(
            assistant_id=f"assistant_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            name=request.name,
            system_prompt=request.system_prompt,
            llm_provider=request.llm_provider,
            llm_model=request.llm_model,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
            tts_provider=request.tts_provider,
            voice_id=request.voice_id,
            voice_speed=request.voice_speed,
            voice_stability=request.voice_stability,
            stt_provider=request.stt_provider,
            language=request.language,
            first_message=request.first_message,
            max_call_duration=request.max_call_duration
        )
        
        # In Redis Cache speichern
        cache_key = f"assistant_config:{assistant_config.assistant_id}"
        await redis_client.setex(
            cache_key, 
            86400,  # 24 Stunden
            assistant_config.json()
        )
        
        # TODO: In permanente Database speichern
        
        return {
            "assistant_id": assistant_config.assistant_id,
            "name": assistant_config.name,
            "status": "created",
            "created_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Failed to create assistant: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create assistant: {str(e)}")

@app.get("/api/assistants/{assistant_id}",
         summary="Get Assistant",
         description="Gibt die Konfiguration eines Voice Assistants zurück")
async def get_assistant(
    assistant_id: str,
    current_user: Dict = Depends(get_current_user)
):
    """Gibt Assistant-Konfiguration zurück"""
    try:
        cache_key = f"assistant_config:{assistant_id}"
        cached_config = await redis_client.get(cache_key)
        
        if not cached_config:
            raise HTTPException(status_code=404, detail="Assistant not found")
        
        assistant_config = AssistantConfig.parse_raw(cached_config)
        
        return {
            "assistant_id": assistant_config.assistant_id,
            "name": assistant_config.name,
            "description": assistant_config.system_prompt[:100] + "...",
            "configuration": assistant_config.dict()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get assistant: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get assistant: {str(e)}")

# ============================================================================
# USAGE & BILLING ENDPOINTS
# ============================================================================

@app.get("/api/usage/summary",
         response_model=UsageSummaryResponse,
         summary="Get Usage Summary",
         description="Gibt eine Zusammenfassung der Service-Nutzung zurück")
async def get_usage_summary(
    start_date: str = "2024-01-01",
    end_date: str = None,
    current_user: Dict = Depends(get_current_user)
):
    """Gibt Usage-Zusammenfassung zurück"""
    try:
        if not end_date:
            end_date = datetime.now().date().isoformat()
        
        time_range = {"start": start_date, "end": end_date}
        
        summary = await usage_tracker.get_usage_summary(
            current_user["user_id"],
            time_range
        )
        
        return UsageSummaryResponse(**summary)
        
    except Exception as e:
        logger.error(f"Failed to get usage summary: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get usage summary: {str(e)}")

@app.get("/api/billing/balance",
         response_model=BillingResponse,
         summary="Get Account Balance",
         description="Gibt das aktuelle Guthaben und Recent Transactions zurück")
async def get_billing_info(
    current_user: Dict = Depends(get_current_user)
):
    """Gibt Billing-Informationen zurück"""
    try:
        balance = await billing_engine.get_user_balance(current_user["user_id"])
        transactions = await billing_engine.get_user_transaction_history(
            current_user["user_id"], 
            limit=10
        )
        
        return BillingResponse(
            user_id=current_user["user_id"],
            current_balance=balance,
            currency="USD",
            recent_transactions=transactions
        )
        
    except Exception as e:
        logger.error(f"Failed to get billing info: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get billing info: {str(e)}")

@app.post("/api/billing/add-credits",
          summary="Add Credits",
          description="Fügt Credits zum User-Account hinzu")
async def add_credits(
    amount: float = Field(..., gt=0, description="Betrag in USD"),
    current_user: Dict = Depends(get_current_user)
):
    """Fügt Credits hinzu"""
    try:
        new_balance = await billing_engine.add_credits(
            current_user["user_id"],
            amount,
            f"Manual credit addition via API"
        )
        
        return {
            "user_id": current_user["user_id"],
            "amount_added": amount,
            "new_balance": new_balance,
            "currency": "USD",
            "added_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Failed to add credits: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to add credits: {str(e)}")

# ============================================================================
# BACKGROUND TASKS
# ============================================================================

async def process_call_billing_async(call_id: str, user_id: str, usage_logs: List):
    """Background Task für Call-Billing"""
    try:
        billing_result = await billing_engine.process_call_billing(
            call_id, user_id, usage_logs
        )
        logger.info(f"Call {call_id} billing completed: ${billing_result.get('final_amount', 0)}")
    except Exception as e:
        logger.error(f"Background billing failed for call {call_id}: {e}")

# ============================================================================
# STATIC FILES & SPA SUPPORT
# ============================================================================

try:
    app.mount("/static", StaticFiles(directory="static"), name="static")
    app.mount("/assets", StaticFiles(directory="static/assets"), name="assets")
    logger.info("Static files mounted")
except Exception as e:
    logger.warning(f"Static files warning: {e}")

@app.get("/{full_path:path}", include_in_schema=False)
async def serve_spa(full_path: str):
    """Serve React SPA for all non-API routes"""
    if full_path.startswith(("api/", "docs", "redoc", "openapi.json", "health")):
        raise HTTPException(status_code=404, detail="API endpoint not found")
    
    try:
        return FileResponse('static/index.html')
    except:
        return {"message": "VoicePartnerAI Production API"}

# ============================================================================
# SERVER STARTUP
# ============================================================================

if __name__ == "__main__":
    print("=" * 70)
    print("🚀 VOICEPARTNERAI PRODUCTION API SERVER")
    print("=" * 70)
    print("🌐 API URL: http://localhost:8005")
    print("📚 Docs: http://localhost:8005/docs")
    print("💻 Frontend: http://localhost:8005")
    print("❤️  Health: http://localhost:8005/health")
    print("=" * 70)
    print("✨ Features:")
    print("   • Complete Voice AI Call Management")
    print("   • Real-time Audio Processing Pipeline") 
    print("   • Granular Usage Tracking & Billing")
    print("   • Multi-Provider Fallback System")
    print("   • Professional API Documentation")
    print("   • High Performance & Scalability")
    print("=" * 70)
    
    uvicorn.run(
        "production_server:app",
        host="0.0.0.0",
        port=8005,
        reload=False,
        workers=1,
        log_level="info"
    )