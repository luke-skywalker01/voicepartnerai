"""
PHASE 1: Provider Factory - Zentrale Factory für Service Provider
Erstellt und konfiguriert Provider-Instanzen basierend auf Konfiguration
"""

import logging
from typing import Dict, Any, Optional

from core.interfaces import (
    ProviderFactory, STTProvider, LLMProvider, TTSProvider,
    ProviderConfig
)

# Import aller verfügbaren Adapter
from adapters.openai_adapter import OpenAIAdapter
from adapters.elevenlabs_adapter import ElevenLabsAdapter
from adapters.deepgram_adapter import DeepgramAdapter

logger = logging.getLogger(__name__)

class DefaultProviderFactory(ProviderFactory):
    """Standard-Implementation der Provider Factory"""
    
    def __init__(self, provider_configs: Dict[str, ProviderConfig]):
        """
        Initialisiert Factory mit Provider-Konfigurationen
        
        Args:
            provider_configs: Dict mit Provider-Name als Key und ProviderConfig als Value
        """
        self.provider_configs = provider_configs
        self._stt_cache = {}
        self._llm_cache = {}
        self._tts_cache = {}
    
    def create_stt_provider(self, provider_name: str, config: Dict[str, Any] = None) -> STTProvider:
        """
        Erstellt STT Provider Instanz
        
        Args:
            provider_name: Name des Providers (z.B. "deepgram")
            config: Optional zusätzliche Konfiguration
        """
        # Cache-Key erstellen
        cache_key = f"{provider_name}_{hash(str(config))}"
        
        if cache_key in self._stt_cache:
            return self._stt_cache[cache_key]
        
        # Provider-Konfiguration laden
        provider_config = self._get_provider_config(provider_name)
        if not provider_config:
            raise ValueError(f"No configuration found for STT provider: {provider_name}")
        
        # Provider erstellen
        try:
            if provider_name.lower() == "deepgram":
                provider = DeepgramAdapter(
                    api_key=provider_config.api_key,
                    base_url=provider_config.base_url or "https://api.deepgram.com",
                    timeout=provider_config.timeout_seconds
                )
            else:
                raise ValueError(f"Unsupported STT provider: {provider_name}")
            
            # In Cache speichern
            self._stt_cache[cache_key] = provider
            logger.info(f"Created STT provider: {provider_name}")
            
            return provider
            
        except Exception as e:
            logger.error(f"Failed to create STT provider {provider_name}: {e}")
            raise
    
    def create_llm_provider(self, provider_name: str, config: Dict[str, Any] = None) -> LLMProvider:
        """
        Erstellt LLM Provider Instanz
        
        Args:
            provider_name: Name des Providers (z.B. "openai")
            config: Optional zusätzliche Konfiguration
        """
        # Cache-Key erstellen
        cache_key = f"{provider_name}_{hash(str(config))}"
        
        if cache_key in self._llm_cache:
            return self._llm_cache[cache_key]
        
        # Provider-Konfiguration laden
        provider_config = self._get_provider_config(provider_name)
        if not provider_config:
            raise ValueError(f"No configuration found for LLM provider: {provider_name}")
        
        # Provider erstellen
        try:
            if provider_name.lower() == "openai":
                provider = OpenAIAdapter(
                    api_key=provider_config.api_key,
                    base_url=provider_config.base_url,
                    timeout=provider_config.timeout_seconds
                )
            elif provider_name.lower() == "anthropic":
                # TODO: Anthropic Adapter implementieren
                raise NotImplementedError("Anthropic adapter not yet implemented")
            else:
                raise ValueError(f"Unsupported LLM provider: {provider_name}")
            
            # In Cache speichern
            self._llm_cache[cache_key] = provider
            logger.info(f"Created LLM provider: {provider_name}")
            
            return provider
            
        except Exception as e:
            logger.error(f"Failed to create LLM provider {provider_name}: {e}")
            raise
    
    def create_tts_provider(self, provider_name: str, config: Dict[str, Any] = None) -> TTSProvider:
        """
        Erstellt TTS Provider Instanz
        
        Args:
            provider_name: Name des Providers (z.B. "elevenlabs")
            config: Optional zusätzliche Konfiguration
        """
        # Cache-Key erstellen
        cache_key = f"{provider_name}_{hash(str(config))}"
        
        if cache_key in self._tts_cache:
            return self._tts_cache[cache_key]
        
        # Provider-Konfiguration laden
        provider_config = self._get_provider_config(provider_name)
        if not provider_config:
            raise ValueError(f"No configuration found for TTS provider: {provider_name}")
        
        # Provider erstellen
        try:
            if provider_name.lower() == "elevenlabs":
                provider = ElevenLabsAdapter(
                    api_key=provider_config.api_key,
                    base_url=provider_config.base_url or "https://api.elevenlabs.io",
                    timeout=provider_config.timeout_seconds
                )
            elif provider_name.lower() == "openai":
                # TODO: OpenAI TTS Adapter implementieren
                raise NotImplementedError("OpenAI TTS adapter not yet implemented")
            else:
                raise ValueError(f"Unsupported TTS provider: {provider_name}")
            
            # In Cache speichern
            self._tts_cache[cache_key] = provider
            logger.info(f"Created TTS provider: {provider_name}")
            
            return provider
            
        except Exception as e:
            logger.error(f"Failed to create TTS provider {provider_name}: {e}")
            raise
    
    def _get_provider_config(self, provider_name: str) -> Optional[ProviderConfig]:
        """Gibt Provider-Konfiguration zurück"""
        return self.provider_configs.get(provider_name.lower())
    
    def get_available_providers(self) -> Dict[str, List[str]]:
        """Gibt verfügbare Provider für jeden Service-Typ zurück"""
        return {
            "stt": ["deepgram"],
            "llm": ["openai"],
            "tts": ["elevenlabs"]
        }
    
    def health_check_all(self) -> Dict[str, Dict[str, bool]]:
        """Führt Health-Check für alle konfigurierten Provider durch"""
        results = {
            "stt": {},
            "llm": {},
            "tts": {}
        }
        
        # STT Provider prüfen
        for provider_name in self.get_available_providers()["stt"]:
            try:
                provider = self.create_stt_provider(provider_name)
                results["stt"][provider_name] = provider.health_check()
            except Exception as e:
                logger.error(f"Health check failed for STT provider {provider_name}: {e}")
                results["stt"][provider_name] = False
        
        # LLM Provider prüfen
        for provider_name in self.get_available_providers()["llm"]:
            try:
                provider = self.create_llm_provider(provider_name)
                results["llm"][provider_name] = provider.health_check()
            except Exception as e:
                logger.error(f"Health check failed for LLM provider {provider_name}: {e}")
                results["llm"][provider_name] = False
        
        # TTS Provider prüfen
        for provider_name in self.get_available_providers()["tts"]:
            try:
                provider = self.create_tts_provider(provider_name)
                results["tts"][provider_name] = provider.health_check()
            except Exception as e:
                logger.error(f"Health check failed for TTS provider {provider_name}: {e}")
                results["tts"][provider_name] = False
        
        return results
    
    def clear_cache(self):
        """Leert Provider-Cache"""
        self._stt_cache.clear()
        self._llm_cache.clear()
        self._tts_cache.clear()
        logger.info("Provider cache cleared")