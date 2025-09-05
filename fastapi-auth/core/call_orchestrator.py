"""
PHASE 2: Service-Orchestration Engine - Der Dirigent
Robuster, zentraler Dienst zur Steuerung von Anrufen mit Redis-Caching
"""

import json
import time
import logging
import asyncio
from typing import Dict, Any, Optional, List
from datetime import datetime
import uuid

import redis.asyncio as redis
from core.interfaces import (
    CallOrchestrator, CallContext, CallStatus, UsageLogEntry, 
    AssistantConfig, STTProvider, LLMProvider, TTSProvider
)
from core.provider_factory import DefaultProviderFactory
from core.usage_tracker import UsageTracker

logger = logging.getLogger(__name__)

class ProductionCallOrchestrator(CallOrchestrator):
    """Produktionsreife Call-Orchestration Engine"""
    
    def __init__(self, 
                 provider_factory: DefaultProviderFactory,
                 usage_tracker: UsageTracker,
                 redis_client: redis.Redis,
                 fallback_enabled: bool = True):
        """
        Initialisiert den Call Orchestrator
        
        Args:
            provider_factory: Factory für Service Provider
            usage_tracker: Usage-Tracking Service
            redis_client: Redis Client für Caching
            fallback_enabled: Ob Fallback-Provider verwendet werden sollen
        """
        self.provider_factory = provider_factory
        self.usage_tracker = usage_tracker
        self.redis = redis_client
        self.fallback_enabled = fallback_enabled
        
        # Active calls cache
        self._active_calls: Dict[str, CallContext] = {}
        
        # Conversation buffer für Real-time Processing
        self._conversation_buffers: Dict[str, List[bytes]] = {}
        
        # Fallback-Konfiguration
        self._fallback_providers = {
            "stt": ["deepgram"],
            "llm": ["openai"],
            "tts": ["elevenlabs"]
        }
    
    async def initiate_call(self, call_config: Dict[str, Any]) -> CallContext:
        """
        Initiiert einen neuen Anruf
        
        Args:
            call_config: Konfiguration mit assistant_id, user_id, phone_number, etc.
        """
        try:
            call_id = str(uuid.uuid4())
            timestamp = datetime.now().isoformat()
            
            # Assistant-Konfiguration laden
            assistant_config = await self._load_assistant_config(call_config["assistant_id"])
            if not assistant_config:
                raise ValueError(f"Assistant {call_config['assistant_id']} not found")
            
            # Call Context erstellen
            call_context = CallContext(
                call_id=call_id,
                user_id=call_config["user_id"],
                assistant_id=call_config["assistant_id"],
                status=CallStatus.INITIATED,
                phone_number=call_config.get("phone_number", ""),
                started_at=timestamp,
                conversation_history=[],
                usage_logs=[],
                total_cost=0.0,
                metadata={
                    "assistant_config": assistant_config.__dict__,
                    "call_config": call_config,
                    "providers_initialized": False
                }
            )
            
            # In Redis und lokalen Cache speichern
            await self._save_call_context(call_context)
            self._active_calls[call_id] = call_context
            
            # Provider vorab initialisieren
            await self._initialize_providers(call_context, assistant_config)
            
            # Ersten Gruß generieren (falls konfiguriert)
            if assistant_config.first_message:
                await self._generate_initial_greeting(call_context, assistant_config)
            
            call_context.status = CallStatus.CONNECTED
            await self._save_call_context(call_context)
            
            logger.info(f"Call initiated: {call_id} for user {call_config['user_id']}")
            return call_context
            
        except Exception as e:
            logger.error(f"Failed to initiate call: {e}")
            raise
    
    async def process_audio_chunk(self, call_id: str, audio_data: bytes) -> Optional[bytes]:
        """
        Verarbeitet eingehende Audio-Daten in Real-time
        
        Args:
            call_id: ID des aktiven Anrufs
            audio_data: Audio-Chunk vom User
            
        Returns:
            Audio-Response oder None
        """
        try:
            # Call Context laden
            call_context = await self._get_call_context(call_id)
            if not call_context or call_context.status != CallStatus.ACTIVE:
                logger.warning(f"Call {call_id} not active or not found")
                return None
            
            call_context.status = CallStatus.ACTIVE
            
            # Assistant-Konfiguration aus Metadaten laden
            assistant_config_dict = call_context.metadata.get("assistant_config", {})
            assistant_config = AssistantConfig(**assistant_config_dict)
            
            # Audio zu Conversation Buffer hinzufügen
            if call_id not in self._conversation_buffers:
                self._conversation_buffers[call_id] = []
            self._conversation_buffers[call_id].append(audio_data)
            
            # Prüfen ob genug Audio für Transkription vorhanden ist
            if len(self._conversation_buffers[call_id]) >= 3:  # Mindestens 3 Chunks
                # Audio-Chunks kombinieren
                combined_audio = b''.join(self._conversation_buffers[call_id])
                self._conversation_buffers[call_id].clear()
                
                # Speech-to-Text
                transcript = await self._transcribe_audio(
                    combined_audio, assistant_config, call_context
                )
                
                if transcript and transcript.strip():
                    # Text zur Konversationshistorie hinzufügen
                    call_context.conversation_history.append({
                        "role": "user",
                        "content": transcript,
                        "timestamp": datetime.now().isoformat()
                    })
                    
                    # LLM Response generieren
                    llm_response = await self._generate_llm_response(
                        call_context.conversation_history, assistant_config, call_context
                    )
                    
                    if llm_response:
                        # Response zur Historie hinzufügen
                        call_context.conversation_history.append({
                            "role": "assistant",
                            "content": llm_response,
                            "timestamp": datetime.now().isoformat()
                        })
                        
                        # Text-to-Speech
                        audio_response = await self._synthesize_speech(
                            llm_response, assistant_config, call_context
                        )
                        
                        # Call Context aktualisieren
                        await self._save_call_context(call_context)
                        
                        return audio_response
            
            # Kein Audio-Response
            return None
            
        except Exception as e:
            logger.error(f"Error processing audio chunk for call {call_id}: {e}")
            return None
    
    async def end_call(self, call_id: str) -> Dict[str, Any]:
        """
        Beendet einen Anruf und führt Abrechnung durch
        
        Args:
            call_id: ID des zu beendenden Anrufs
        """
        try:
            # Call Context laden
            call_context = await self._get_call_context(call_id)
            if not call_context:
                raise ValueError(f"Call {call_id} not found")
            
            # Status auf ENDED setzen
            call_context.status = CallStatus.ENDED
            end_time = datetime.now().isoformat()
            call_context.metadata["ended_at"] = end_time
            
            # Gesamtkosten berechnen
            total_cost = sum(entry.cost_estimate for entry in call_context.usage_logs)
            call_context.total_cost = total_cost
            
            # Call Summary erstellen
            call_summary = {
                "call_id": call_id,
                "duration_seconds": self._calculate_call_duration(call_context),
                "total_cost": total_cost,
                "messages_exchanged": len(call_context.conversation_history),
                "usage_breakdown": {
                    "stt_calls": len([l for l in call_context.usage_logs if l.service_type == "stt"]),
                    "llm_calls": len([l for l in call_context.usage_logs if l.service_type == "llm"]),
                    "tts_calls": len([l for l in call_context.usage_logs if l.service_type == "tts"])
                },
                "conversation_summary": self._create_conversation_summary(call_context)
            }
            
            # Final speichern
            await self._save_call_context(call_context)
            
            # Aus aktiven Calls entfernen
            if call_id in self._active_calls:
                del self._active_calls[call_id]
            
            # Conversation Buffer leeren
            if call_id in self._conversation_buffers:
                del self._conversation_buffers[call_id]
            
            logger.info(f"Call {call_id} ended. Duration: {call_summary['duration_seconds']}s, Cost: ${total_cost:.4f}")
            
            return call_summary
            
        except Exception as e:
            logger.error(f"Error ending call {call_id}: {e}")
            raise
    
    async def get_call_status(self, call_id: str) -> CallContext:
        """Gibt aktuellen Call-Status zurück"""
        return await self._get_call_context(call_id)
    
    # ========================================================================
    # PRIVATE HELPER METHODS
    # ========================================================================
    
    async def _load_assistant_config(self, assistant_id: str) -> Optional[AssistantConfig]:
        """Lädt Assistant-Konfiguration aus Redis/Database"""
        try:
            # Zuerst aus Redis Cache versuchen
            cache_key = f"assistant_config:{assistant_id}"
            cached_config = await self.redis.get(cache_key)
            
            if cached_config:
                config_dict = json.loads(cached_config)
                return AssistantConfig(**config_dict)
            
            # TODO: Aus Database laden falls nicht im Cache
            # Für jetzt Mock-Konfiguration zurückgeben
            return AssistantConfig(
                assistant_id=assistant_id,
                name="Default Assistant",
                system_prompt="You are a helpful AI assistant.",
                llm_provider="openai",
                llm_model="gpt-4o",
                tts_provider="elevenlabs",
                voice_id="21m00Tcm4TlvDq8ikWAM",
                stt_provider="deepgram",
                language="de-DE"
            )
            
        except Exception as e:
            logger.error(f"Error loading assistant config {assistant_id}: {e}")
            return None
    
    async def _initialize_providers(self, call_context: CallContext, assistant_config: AssistantConfig):
        """Initialisiert alle Provider für den Call"""
        try:
            # STT Provider
            stt_provider = self.provider_factory.create_stt_provider(assistant_config.stt_provider)
            
            # LLM Provider
            llm_provider = self.provider_factory.create_llm_provider(assistant_config.llm_provider)
            
            # TTS Provider
            tts_provider = self.provider_factory.create_tts_provider(assistant_config.tts_provider)
            
            # Provider in Call Metadata speichern
            call_context.metadata["providers"] = {
                "stt": assistant_config.stt_provider,
                "llm": assistant_config.llm_provider,
                "tts": assistant_config.tts_provider
            }
            call_context.metadata["providers_initialized"] = True
            
            logger.info(f"Providers initialized for call {call_context.call_id}")
            
        except Exception as e:
            logger.error(f"Error initializing providers for call {call_context.call_id}: {e}")
            raise
    
    async def _transcribe_audio(self, audio_data: bytes, config: AssistantConfig, call_context: CallContext) -> Optional[str]:
        """Transkribiert Audio mit Fallback-Logik"""
        providers_to_try = [config.stt_provider]
        if self.fallback_enabled:
            providers_to_try.extend([p for p in self._fallback_providers["stt"] if p != config.stt_provider])
        
        for provider_name in providers_to_try:
            try:
                provider = self.provider_factory.create_stt_provider(provider_name)
                
                stt_config = {
                    "language": config.language,
                    "model": "nova-2" if provider_name == "deepgram" else "base"
                }
                
                response = await provider.transcribe(audio_data, stt_config)
                
                # Usage loggen
                usage_entry = provider.create_usage_log_entry(response, call_context.user_id, call_context.call_id)
                call_context.usage_logs.append(usage_entry)
                await self.usage_tracker.log_usage(usage_entry)
                
                return response.text
                
            except Exception as e:
                logger.error(f"STT failed with provider {provider_name}: {e}")
                if provider_name == providers_to_try[-1]:  # Letzter Provider
                    raise
        
        return None
    
    async def _generate_llm_response(self, messages: List[Dict[str, str]], config: AssistantConfig, call_context: CallContext) -> Optional[str]:
        """Generiert LLM Response mit Fallback-Logik"""
        providers_to_try = [config.llm_provider]
        if self.fallback_enabled:
            providers_to_try.extend([p for p in self._fallback_providers["llm"] if p != config.llm_provider])
        
        # System Prompt hinzufügen
        formatted_messages = [{"role": "system", "content": config.system_prompt}]
        formatted_messages.extend([{"role": msg["role"], "content": msg["content"]} for msg in messages[-10:]])  # Letzte 10 Messages
        
        for provider_name in providers_to_try:
            try:
                provider = self.provider_factory.create_llm_provider(provider_name)
                
                llm_config = {
                    "model": config.llm_model,
                    "temperature": config.temperature,
                    "max_tokens": config.max_tokens
                }
                
                response = await provider.generate(formatted_messages, llm_config)
                
                # Usage loggen
                usage_entry = provider.create_usage_log_entry(response, call_context.user_id, call_context.call_id)
                call_context.usage_logs.append(usage_entry)
                await self.usage_tracker.log_usage(usage_entry)
                
                return response.content
                
            except Exception as e:
                logger.error(f"LLM failed with provider {provider_name}: {e}")
                if provider_name == providers_to_try[-1]:  # Letzter Provider
                    raise
        
        return None
    
    async def _synthesize_speech(self, text: str, config: AssistantConfig, call_context: CallContext) -> Optional[bytes]:
        """Synthetisiert Speech mit Fallback-Logik"""
        providers_to_try = [config.tts_provider]
        if self.fallback_enabled:
            providers_to_try.extend([p for p in self._fallback_providers["tts"] if p != config.tts_provider])
        
        for provider_name in providers_to_try:
            try:
                provider = self.provider_factory.create_tts_provider(provider_name)
                
                tts_config = {
                    "voice_id": config.voice_id,
                    "voice_speed": config.voice_speed,
                    "voice_pitch": config.voice_pitch,
                    "voice_stability": config.voice_stability
                }
                
                response = await provider.synthesize(text, tts_config)
                
                # Usage loggen
                usage_entry = provider.create_usage_log_entry(response, call_context.user_id, call_context.call_id)
                call_context.usage_logs.append(usage_entry)
                await self.usage_tracker.log_usage(usage_entry)
                
                return response.audio_data
                
            except Exception as e:
                logger.error(f"TTS failed with provider {provider_name}: {e}")
                if provider_name == providers_to_try[-1]:  # Letzter Provider
                    raise
        
        return None
    
    async def _generate_initial_greeting(self, call_context: CallContext, config: AssistantConfig):
        """Generiert initiale Begrüßung"""
        try:
            if config.first_message:
                # TTS für ersten Gruß generieren
                greeting_audio = await self._synthesize_speech(config.first_message, config, call_context)
                
                # Zu Konversationshistorie hinzufügen
                call_context.conversation_history.append({
                    "role": "assistant",
                    "content": config.first_message,
                    "timestamp": datetime.now().isoformat(),
                    "type": "initial_greeting"
                })
                
                # Audio in Metadaten speichern
                call_context.metadata["initial_greeting_audio"] = greeting_audio is not None
                
        except Exception as e:
            logger.error(f"Error generating initial greeting for call {call_context.call_id}: {e}")
    
    async def _save_call_context(self, call_context: CallContext):
        """Speichert Call Context in Redis"""
        try:
            cache_key = f"call_context:{call_context.call_id}"
            # Serialize mit Custom JSON Encoder für Enums
            context_json = json.dumps(call_context.__dict__, default=str)
            await self.redis.setex(cache_key, 3600, context_json)  # 1 Stunde TTL
        except Exception as e:
            logger.error(f"Error saving call context {call_context.call_id}: {e}")
    
    async def _get_call_context(self, call_id: str) -> Optional[CallContext]:
        """Lädt Call Context aus Redis oder lokalem Cache"""
        try:
            # Zuerst lokalen Cache prüfen
            if call_id in self._active_calls:
                return self._active_calls[call_id]
            
            # Aus Redis laden
            cache_key = f"call_context:{call_id}"
            context_json = await self.redis.get(cache_key)
            
            if context_json:
                context_dict = json.loads(context_json)
                # Enum-Werte konvertieren
                context_dict["status"] = CallStatus(context_dict["status"])
                call_context = CallContext(**context_dict)
                
                # In lokalen Cache laden
                self._active_calls[call_id] = call_context
                return call_context
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting call context {call_id}: {e}")
            return None
    
    def _calculate_call_duration(self, call_context: CallContext) -> int:
        """Berechnet Call-Dauer in Sekunden"""
        try:
            start_time = datetime.fromisoformat(call_context.started_at)
            end_time = datetime.fromisoformat(call_context.metadata.get("ended_at", datetime.now().isoformat()))
            duration = (end_time - start_time).total_seconds()
            return int(duration)
        except Exception:
            return 0
    
    def _create_conversation_summary(self, call_context: CallContext) -> Dict[str, Any]:
        """Erstellt Zusammenfassung der Konversation"""
        return {
            "total_messages": len(call_context.conversation_history),
            "user_messages": len([m for m in call_context.conversation_history if m["role"] == "user"]),
            "assistant_messages": len([m for m in call_context.conversation_history if m["role"] == "assistant"]),
            "first_message_at": call_context.conversation_history[0]["timestamp"] if call_context.conversation_history else None,
            "last_message_at": call_context.conversation_history[-1]["timestamp"] if call_context.conversation_history else None
        }