"""
Deepgram Adapter - Implementiert STTProvider Interface
Entkoppelt die Kernlogik von der Deepgram-spezifischen API
"""

import time
import logging
from typing import Dict, Any, List
import httpx
import json

from core.interfaces import STTProvider, STTResponse, UsageLogEntry

logger = logging.getLogger(__name__)

class DeepgramAdapter(STTProvider):
    """Deepgram STT Provider Adapter"""
    
    def __init__(self, api_key: str, base_url: str = "https://api.deepgram.com", timeout: int = 30):
        self.api_key = api_key
        self.base_url = base_url
        self.timeout = timeout
        self.headers = {
            "Authorization": f"Token {api_key}",
            "Content-Type": "audio/wav"  # Default, wird je nach Audio-Format angepasst
        }
        
    def get_provider_name(self) -> str:
        return "Deepgram"
    
    async def health_check(self) -> bool:
        """Prüft Deepgram API Verfügbarkeit"""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{self.base_url}/v1/projects",
                    headers={"Authorization": f"Token {self.api_key}"}
                )
                return response.status_code == 200
        except Exception as e:
            logger.error(f"Deepgram health check failed: {e}")
            return False
    
    async def get_supported_languages(self) -> List[str]:
        """Gibt von Deepgram unterstützte Sprachen zurück"""
        # Deepgram unterstützt viele Sprachen
        return [
            "de", "en", "es", "fr", "it", "pt", "nl", "pl", "ru", "ja", "ko", "zh",
            "ar", "hi", "tr", "sv", "da", "no", "fi", "cs", "hu", "ro", "bg",
            "hr", "sk", "sl", "et", "lv", "lt", "mt", "ga", "cy", "eu", "ca"
        ]
    
    async def transcribe(self, audio_data: bytes, config: Dict[str, Any]) -> STTResponse:
        """
        Transkribiert Audio mit Deepgram API
        
        Args:
            audio_data: Rohe Audio-Daten
            config: Deepgram-spezifische Parameter
        """
        start_time = time.time()
        
        try:
            # Query-Parameter für Deepgram API
            params = {
                "model": config.get("model", "nova-2"),
                "language": config.get("language", "de"),
                "smart_format": config.get("smart_format", True),
                "punctuate": config.get("punctuate", True),
                "diarize": config.get("diarize", False),
                "multichannel": config.get("multichannel", False),
                "alternatives": config.get("alternatives", 1),
                "numerals": config.get("numerals", True),
                "search": config.get("search_terms", []) if config.get("search_terms") else None,
                "keywords": config.get("keywords", []) if config.get("keywords") else None
            }
            
            # Entferne None-Werte
            params = {k: v for k, v in params.items() if v is not None}
            
            # Content-Type basierend auf Audio-Format setzen
            audio_format = config.get("audio_format", "wav")
            headers = self.headers.copy()
            headers["Content-Type"] = f"audio/{audio_format}"
            
            url = f"{self.base_url}/v1/listen"
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    url,
                    content=audio_data,
                    headers=headers,
                    params=params
                )
                
                if response.status_code == 200:
                    result = response.json()
                    end_time = time.time()
                    duration_ms = int((end_time - start_time) * 1000)
                    
                    # Response verarbeiten
                    alternatives = result.get("results", {}).get("channels", [{}])[0].get("alternatives", [])
                    
                    if alternatives:
                        best_result = alternatives[0]
                        transcript = best_result.get("transcript", "")
                        confidence = best_result.get("confidence", 0.0)
                        
                        # Words-Information extrahieren (falls verfügbar)
                        words = []
                        if "words" in best_result:
                            words = [
                                {
                                    "word": word.get("word"),
                                    "start": word.get("start"),
                                    "end": word.get("end"),
                                    "confidence": word.get("confidence")
                                }
                                for word in best_result["words"]
                            ]
                        
                        # Audio-Dauer aus Metadaten
                        metadata = result.get("metadata", {})
                        audio_duration = metadata.get("duration", 0) * 1000  # Convert to ms
                        
                        # Kosten schätzen
                        cost_estimate = self._estimate_cost(len(audio_data), audio_duration / 1000)
                        
                        return STTResponse(
                            text=transcript,
                            confidence=confidence,
                            language=params.get("language"),
                            duration_ms=int(audio_duration),
                            words=words,
                            metadata={
                                "model_used": metadata.get("model_info", {}).get("name"),
                                "processing_time_ms": duration_ms,
                                "audio_channels": metadata.get("channels"),
                                "sample_rate": metadata.get("sample_rate"),
                                "alternatives_count": len(alternatives),
                                "request_id": result.get("metadata", {}).get("request_id")
                            }
                        )
                    else:
                        # Keine Transkription gefunden
                        return STTResponse(
                            text="",
                            confidence=0.0,
                            language=params.get("language"),
                            duration_ms=duration_ms,
                            metadata={"error": "No transcription alternatives found"}
                        )
                else:
                    error_detail = response.text
                    logger.error(f"Deepgram API error: {response.status_code} - {error_detail}")
                    raise Exception(f"Deepgram API error: {response.status_code}")
                    
        except httpx.TimeoutException:
            logger.error("Deepgram request timeout")
            raise Exception("Speech-to-text request timed out")
            
        except Exception as e:
            logger.error(f"Deepgram transcription error: {e}")
            raise Exception(f"Failed to transcribe audio: {str(e)}")
    
    def _estimate_cost(self, audio_size_bytes: int, duration_seconds: float) -> float:
        """Schätzt Kosten basierend auf Deepgram Preisen"""
        # Deepgram Preise (Stand August 2024)
        # Nova-2: $0.0043 pro Minute
        # Base: $0.0125 pro Minute
        # Enhanced: $0.0200 pro Minute
        
        # Durchschnittlicher Preis pro Minute (Nova-2)
        cost_per_minute = 0.0043
        duration_minutes = duration_seconds / 60
        
        return duration_minutes * cost_per_minute
    
    def create_usage_log_entry(self, response: STTResponse, user_id: str, call_id: str = None) -> UsageLogEntry:
        """Erstellt standardisierten Usage-Log-Eintrag"""
        return UsageLogEntry(
            provider=self.get_provider_name(),
            service_type="stt",
            operation="transcribe",
            units_consumed=int(response.duration_ms / 1000),  # Sekunden
            unit_type="seconds",
            cost_estimate=response.metadata.get("cost_estimate", 0.0),
            duration_ms=response.metadata.get("processing_time_ms", 0),
            user_id=user_id,
            call_id=call_id,
            timestamp=time.strftime("%Y-%m-%d %H:%M:%S"),
            metadata={
                "confidence": response.confidence,
                "language": response.language,
                "text_length": len(response.text),
                "words_count": len(response.words) if response.words else 0,
                **response.metadata
            }
        )