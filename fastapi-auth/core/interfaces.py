"""
PHASE 1: Der Abstraktions-Layer (Adapter-Muster)
Standardisierte Interfaces für alle Service-Provider
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional, Union
from dataclasses import dataclass
from enum import Enum

# ============================================================================
# RESPONSE DATA MODELS
# ============================================================================

@dataclass
class STTResponse:
    """Standard Response für Speech-to-Text Services"""
    text: str
    confidence: float
    language: Optional[str] = None
    duration_ms: Optional[int] = None
    words: Optional[List[Dict[str, Any]]] = None
    metadata: Optional[Dict[str, Any]] = None

@dataclass
class LLMResponse:
    """Standard Response für Language Model Services"""
    content: str
    tokens_used: int
    model: str
    finish_reason: str
    latency_ms: int
    cost_estimate: Optional[float] = None
    metadata: Optional[Dict[str, Any]] = None

@dataclass
class TTSResponse:
    """Standard Response für Text-to-Speech Services"""
    audio_data: bytes
    audio_format: str
    duration_ms: int
    sample_rate: int
    characters_processed: int
    cost_estimate: Optional[float] = None
    metadata: Optional[Dict[str, Any]] = None

@dataclass
class UsageLogEntry:
    """Standard-Format für Usage-Tracking"""
    provider: str
    service_type: str  # 'stt', 'llm', 'tts'
    operation: str     # 'transcribe', 'generate', 'synthesize'
    units_consumed: int
    unit_type: str     # 'tokens', 'characters', 'seconds'
    cost_estimate: float
    duration_ms: int
    user_id: str
    call_id: Optional[str] = None
    timestamp: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

# ============================================================================
# SERVICE PROVIDER INTERFACES
# ============================================================================

class STTProvider(ABC):
    """Standardisiertes Interface für Speech-to-Text Provider"""
    
    @abstractmethod
    async def transcribe(self, audio_data: bytes, config: Dict[str, Any]) -> STTResponse:
        """
        Transkribiert Audio zu Text.
        
        Args:
            audio_data: Rohe Audio-Daten
            config: Provider-spezifische Konfiguration
            
        Returns:
            STTResponse mit normalisiertem Output
        """
        pass
    
    @abstractmethod
    async def get_supported_languages(self) -> List[str]:
        """Gibt unterstützte Sprachen zurück"""
        pass
    
    @abstractmethod
    def get_provider_name(self) -> str:
        """Gibt den Provider-Namen zurück"""
        pass
    
    @abstractmethod
    async def health_check(self) -> bool:
        """Prüft die Verfügbarkeit des Services"""
        pass

class LLMProvider(ABC):
    """Standardisiertes Interface für Language Model Provider"""
    
    @abstractmethod
    async def generate(self, 
                      messages: List[Dict[str, str]], 
                      config: Dict[str, Any]) -> LLMResponse:
        """
        Generiert Text-Response basierend auf Konversations-Context.
        
        Args:
            messages: Chat-Verlauf im OpenAI-Format
            config: Provider-spezifische Parameter
            
        Returns:
            LLMResponse mit normalisiertem Output
        """
        pass
    
    @abstractmethod
    async def get_available_models(self) -> List[str]:
        """Gibt verfügbare Modelle zurück"""
        pass
    
    @abstractmethod
    def get_provider_name(self) -> str:
        """Gibt den Provider-Namen zurück"""
        pass
    
    @abstractmethod
    async def health_check(self) -> bool:
        """Prüft die Verfügbarkeit des Services"""
        pass

class TTSProvider(ABC):
    """Standardisiertes Interface für Text-to-Speech Provider"""
    
    @abstractmethod
    async def synthesize(self, text: str, config: Dict[str, Any]) -> TTSResponse:
        """
        Synthetisiert Text zu Audio.
        
        Args:
            text: Zu synthetisierender Text
            config: Voice-Konfiguration (voice_id, speed, pitch, etc.)
            
        Returns:
            TTSResponse mit Audio-Daten
        """
        pass
    
    @abstractmethod
    async def get_available_voices(self) -> List[Dict[str, Any]]:
        """Gibt verfügbare Stimmen zurück"""
        pass
    
    @abstractmethod
    def get_provider_name(self) -> str:
        """Gibt den Provider-Namen zurück"""
        pass
    
    @abstractmethod
    async def health_check(self) -> bool:
        """Prüft die Verfügbarkeit des Services"""
        pass

# ============================================================================
# PROVIDER FACTORY INTERFACE
# ============================================================================

class ProviderFactory(ABC):
    """Factory Interface für Service Provider"""
    
    @abstractmethod
    def create_stt_provider(self, provider_name: str, config: Dict[str, Any]) -> STTProvider:
        """Erstellt STT Provider Instanz"""
        pass
    
    @abstractmethod
    def create_llm_provider(self, provider_name: str, config: Dict[str, Any]) -> LLMProvider:
        """Erstellt LLM Provider Instanz"""
        pass
    
    @abstractmethod
    def create_tts_provider(self, provider_name: str, config: Dict[str, Any]) -> TTSProvider:
        """Erstellt TTS Provider Instanz"""
        pass

# ============================================================================
# CALL ORCHESTRATION INTERFACES
# ============================================================================

class CallStatus(Enum):
    """Call-Status Enumeration"""
    INITIATED = "initiated"
    CONNECTED = "connected"
    ACTIVE = "active"
    ENDED = "ended"
    FAILED = "failed"

@dataclass
class CallContext:
    """Kontext eines aktiven Anrufs"""
    call_id: str
    user_id: str
    assistant_id: str
    status: CallStatus
    phone_number: str
    started_at: str
    conversation_history: List[Dict[str, str]]
    usage_logs: List[UsageLogEntry]
    total_cost: float = 0.0
    metadata: Optional[Dict[str, Any]] = None

class CallOrchestrator(ABC):
    """Interface für Call-Orchestration"""
    
    @abstractmethod
    async def initiate_call(self, call_config: Dict[str, Any]) -> CallContext:
        """Initiiert einen neuen Anruf"""
        pass
    
    @abstractmethod
    async def process_audio_chunk(self, call_id: str, audio_data: bytes) -> Optional[bytes]:
        """Verarbeitet eingehende Audio-Daten"""
        pass
    
    @abstractmethod
    async def end_call(self, call_id: str) -> Dict[str, Any]:
        """Beendet einen Anruf und führt Abrechnung durch"""
        pass
    
    @abstractmethod
    async def get_call_status(self, call_id: str) -> CallContext:
        """Gibt aktuellen Call-Status zurück"""
        pass

# ============================================================================
# BILLING & USAGE TRACKING INTERFACES
# ============================================================================

class UsageTracker(ABC):
    """Interface für Usage-Tracking"""
    
    @abstractmethod
    async def log_usage(self, entry: UsageLogEntry) -> None:
        """Loggt eine Usage-Operation"""
        pass
    
    @abstractmethod
    async def get_usage_for_call(self, call_id: str) -> List[UsageLogEntry]:
        """Gibt alle Usage-Logs für einen Call zurück"""
        pass
    
    @abstractmethod
    async def get_usage_for_user(self, user_id: str, time_range: Dict[str, str]) -> List[UsageLogEntry]:
        """Gibt Usage-Logs für einen User in einem Zeitraum zurück"""
        pass

class BillingEngine(ABC):
    """Interface für Billing-Engine"""
    
    @abstractmethod
    async def calculate_call_cost(self, call_id: str) -> float:
        """Berechnet Gesamtkosten für einen Call"""
        pass
    
    @abstractmethod
    async def deduct_credits(self, user_id: str, amount: float) -> bool:
        """Bucht Credits vom User-Account ab"""
        pass
    
    @abstractmethod
    async def get_user_balance(self, user_id: str) -> float:
        """Gibt aktuelles Guthaben zurück"""
        pass
    
    @abstractmethod
    async def add_credits(self, user_id: str, amount: float) -> float:
        """Fügt Credits zum User-Account hinzu"""
        pass

# ============================================================================
# CONFIGURATION INTERFACES
# ============================================================================

@dataclass
class ProviderConfig:
    """Konfiguration für einen Service Provider"""
    provider_name: str
    api_key: str
    base_url: Optional[str] = None
    timeout_seconds: int = 30
    max_retries: int = 3
    fallback_provider: Optional[str] = None
    custom_config: Optional[Dict[str, Any]] = None

@dataclass
class AssistantConfig:
    """Vollständige Konfiguration für einen Voice Assistant"""
    assistant_id: str
    name: str
    system_prompt: str
    
    # LLM Configuration
    llm_provider: str
    llm_model: str
    temperature: float = 0.7
    max_tokens: int = 1000
    
    # TTS Configuration
    tts_provider: str
    voice_id: str
    voice_speed: float = 1.0
    voice_pitch: float = 1.0
    voice_stability: float = 0.75
    
    # STT Configuration
    stt_provider: str
    language: str = "de-DE"
    fallback_language: str = "en-US"
    
    # Call Behavior
    first_message: Optional[str] = None
    interruption_sensitivity: str = "medium"
    max_call_duration: int = 1800  # 30 minutes
    
    # Fallback Configuration
    fallback_providers: Optional[Dict[str, str]] = None