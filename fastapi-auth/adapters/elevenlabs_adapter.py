"""
ElevenLabs Adapter - Implementiert TTSProvider Interface
Entkoppelt die Kernlogik von der ElevenLabs-spezifischen API
"""

import time
import logging
from typing import Dict, Any, List
import httpx
import io

from core.interfaces import TTSProvider, TTSResponse, UsageLogEntry

logger = logging.getLogger(__name__)

class ElevenLabsAdapter(TTSProvider):
    """ElevenLabs TTS Provider Adapter"""
    
    def __init__(self, api_key: str, base_url: str = "https://api.elevenlabs.io", timeout: int = 30):
        self.api_key = api_key
        self.base_url = base_url
        self.timeout = timeout
        self.headers = {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": api_key
        }
        
    def get_provider_name(self) -> str:
        return "ElevenLabs"
    
    async def health_check(self) -> bool:
        """Prüft ElevenLabs API Verfügbarkeit"""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{self.base_url}/v1/voices",
                    headers={"xi-api-key": self.api_key}
                )
                return response.status_code == 200
        except Exception as e:
            logger.error(f"ElevenLabs health check failed: {e}")
            return False
    
    async def get_available_voices(self) -> List[Dict[str, Any]]:
        """Gibt verfügbare ElevenLabs Stimmen zurück"""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{self.base_url}/v1/voices",
                    headers={"xi-api-key": self.api_key}
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return [
                        {
                            "voice_id": voice["voice_id"],
                            "name": voice["name"],
                            "category": voice.get("category", "unknown"),
                            "language": voice.get("labels", {}).get("language", "unknown"),
                            "gender": voice.get("labels", {}).get("gender", "unknown"),
                            "preview_url": voice.get("preview_url")
                        }
                        for voice in data.get("voices", [])
                    ]
                else:
                    logger.error(f"Failed to get voices: {response.status_code}")
                    return []
                    
        except Exception as e:
            logger.error(f"Failed to get ElevenLabs voices: {e}")
            return []
    
    async def synthesize(self, text: str, config: Dict[str, Any]) -> TTSResponse:
        """
        Synthetisiert Text zu Audio mit ElevenLabs API
        
        Args:
            text: Zu synthetisierender Text
            config: ElevenLabs-spezifische Parameter
        """
        start_time = time.time()
        
        try:
            voice_id = config.get("voice_id", "21m00Tcm4TlvDq8ikWAM")  # Default voice
            
            # Request Body
            payload = {
                "text": text,
                "model_id": config.get("model_id", "eleven_multilingual_v2"),
                "voice_settings": {
                    "stability": config.get("voice_stability", 0.75),
                    "similarity_boost": config.get("voice_similarity", 0.75),
                    "style": config.get("voice_style", 0.0),
                    "use_speaker_boost": config.get("speaker_boost", True)
                }
            }
            
            # Optional: Speed-Anpassung (nur bei bestimmten Modellen)
            if "voice_speed" in config:
                payload["voice_settings"]["speed"] = config["voice_speed"]
            
            url = f"{self.base_url}/v1/text-to-speech/{voice_id}/stream"
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    url,
                    json=payload,
                    headers=self.headers
                )
                
                if response.status_code == 200:
                    audio_data = response.content
                    end_time = time.time()
                    duration_ms = int((end_time - start_time) * 1000)
                    
                    # Kosten schätzen
                    characters_processed = len(text)
                    cost_estimate = self._estimate_cost(characters_processed)
                    
                    return TTSResponse(
                        audio_data=audio_data,
                        audio_format="mp3",
                        duration_ms=duration_ms,
                        sample_rate=22050,  # ElevenLabs Standard
                        characters_processed=characters_processed,
                        cost_estimate=cost_estimate,
                        metadata={
                            "voice_id": voice_id,
                            "model_id": payload["model_id"],
                            "voice_settings": payload["voice_settings"],
                            "text_length": len(text)
                        }
                    )
                else:
                    error_detail = response.text
                    logger.error(f"ElevenLabs API error: {response.status_code} - {error_detail}")
                    raise Exception(f"ElevenLabs API error: {response.status_code}")
                    
        except httpx.TimeoutException:
            logger.error("ElevenLabs request timeout")
            raise Exception("Text-to-speech request timed out")
            
        except Exception as e:
            logger.error(f"ElevenLabs synthesis error: {e}")
            raise Exception(f"Failed to synthesize speech: {str(e)}")
    
    def _estimate_cost(self, characters: int) -> float:
        """Schätzt Kosten basierend auf ElevenLabs Preisen"""
        # ElevenLabs Preise (Stand August 2024)
        # Starter: $5/month für 30,000 Zeichen
        # Creator: $22/month für 100,000 Zeichen
        # Pro: $99/month für 500,000 Zeichen
        
        # Durchschnittlicher Preis pro Zeichen (vereinfacht)
        cost_per_character = 0.0001  # $0.0001 pro Zeichen
        
        return characters * cost_per_character
    
    def create_usage_log_entry(self, response: TTSResponse, user_id: str, call_id: str = None) -> UsageLogEntry:
        """Erstellt standardisierten Usage-Log-Eintrag"""
        return UsageLogEntry(
            provider=self.get_provider_name(),
            service_type="tts",
            operation="synthesize",
            units_consumed=response.characters_processed,
            unit_type="characters",
            cost_estimate=response.cost_estimate or 0.0,
            duration_ms=response.duration_ms,
            user_id=user_id,
            call_id=call_id,
            timestamp=time.strftime("%Y-%m-%d %H:%M:%S"),
            metadata={
                "audio_format": response.audio_format,
                "sample_rate": response.sample_rate,
                "audio_size_bytes": len(response.audio_data),
                **response.metadata
            }
        )