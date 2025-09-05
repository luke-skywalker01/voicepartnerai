"""
OpenAI Adapter - Implementiert LLMProvider Interface
Entkoppelt die Kernlogik von der OpenAI-spezifischen API
"""

import time
import logging
from typing import Dict, Any, List
import openai
from openai import AsyncOpenAI

from core.interfaces import LLMProvider, LLMResponse, UsageLogEntry

logger = logging.getLogger(__name__)

class OpenAIAdapter(LLMProvider):
    """OpenAI LLM Provider Adapter"""
    
    def __init__(self, api_key: str, base_url: str = None, timeout: int = 30):
        self.client = AsyncOpenAI(
            api_key=api_key,
            base_url=base_url,
            timeout=timeout
        )
        self.api_key = api_key
        
    def get_provider_name(self) -> str:
        return "OpenAI"
    
    async def health_check(self) -> bool:
        """Prüft OpenAI API Verfügbarkeit"""
        try:
            response = await self.client.models.list()
            return len(response.data) > 0
        except Exception as e:
            logger.error(f"OpenAI health check failed: {e}")
            return False
    
    async def get_available_models(self) -> List[str]:
        """Gibt verfügbare OpenAI Modelle zurück"""
        try:
            response = await self.client.models.list()
            return [model.id for model in response.data if 'gpt' in model.id.lower()]
        except Exception as e:
            logger.error(f"Failed to get OpenAI models: {e}")
            return ["gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo"]  # Fallback
    
    async def generate(self, messages: List[Dict[str, str]], config: Dict[str, Any]) -> LLMResponse:
        """
        Generiert Response mit OpenAI Chat Completion API
        
        Args:
            messages: Chat-Verlauf im OpenAI-Format
            config: OpenAI-spezifische Parameter
        """
        start_time = time.time()
        
        try:
            # Standard-Parameter mit Overrides
            params = {
                "model": config.get("model", "gpt-4o"),
                "messages": messages,
                "temperature": config.get("temperature", 0.7),
                "max_tokens": config.get("max_tokens", 1000),
                "top_p": config.get("top_p", 1.0),
                "frequency_penalty": config.get("frequency_penalty", 0.0),
                "presence_penalty": config.get("presence_penalty", 0.0),
            }
            
            # Optional: Function calling
            if "tools" in config:
                params["tools"] = config["tools"]
                params["tool_choice"] = config.get("tool_choice", "auto")
            
            response = await self.client.chat.completions.create(**params)
            
            end_time = time.time()
            latency_ms = int((end_time - start_time) * 1000)
            
            # Response verarbeiten
            choice = response.choices[0]
            content = choice.message.content or ""
            
            # Token-Usage extrahieren
            usage = response.usage
            tokens_used = usage.total_tokens if usage else 0
            
            # Kosten schätzen (grobe Schätzung basierend auf Modell)
            cost_estimate = self._estimate_cost(params["model"], tokens_used)
            
            return LLMResponse(
                content=content,
                tokens_used=tokens_used,
                model=params["model"],
                finish_reason=choice.finish_reason,
                latency_ms=latency_ms,
                cost_estimate=cost_estimate,
                metadata={
                    "prompt_tokens": usage.prompt_tokens if usage else 0,
                    "completion_tokens": usage.completion_tokens if usage else 0,
                    "system_fingerprint": response.system_fingerprint,
                    "response_id": response.id
                }
            )
            
        except openai.RateLimitError as e:
            logger.error(f"OpenAI rate limit exceeded: {e}")
            raise Exception(f"Rate limit exceeded: {str(e)}")
            
        except openai.APIError as e:
            logger.error(f"OpenAI API error: {e}")
            raise Exception(f"OpenAI API error: {str(e)}")
            
        except Exception as e:
            logger.error(f"Unexpected OpenAI error: {e}")
            raise Exception(f"Failed to generate response: {str(e)}")
    
    def _estimate_cost(self, model: str, tokens: int) -> float:
        """Schätzt Kosten basierend auf aktuellen OpenAI Preisen"""
        # Preise per 1K tokens (Stand August 2024)
        pricing = {
            "gpt-4o": {
                "input": 0.005,   # $5 per 1M tokens
                "output": 0.015   # $15 per 1M tokens
            },
            "gpt-4o-mini": {
                "input": 0.00015, # $0.15 per 1M tokens
                "output": 0.0006  # $0.60 per 1M tokens
            },
            "gpt-3.5-turbo": {
                "input": 0.0005,  # $0.50 per 1M tokens
                "output": 0.0015  # $1.50 per 1M tokens
            }
        }
        
        # Vereinfachte Kostenschätzung (durchschnittlich)
        model_pricing = pricing.get(model, pricing["gpt-4o"])
        avg_cost_per_1k = (model_pricing["input"] + model_pricing["output"]) / 2
        
        return (tokens / 1000) * avg_cost_per_1k
    
    def create_usage_log_entry(self, response: LLMResponse, user_id: str, call_id: str = None) -> UsageLogEntry:
        """Erstellt standardisierten Usage-Log-Eintrag"""
        return UsageLogEntry(
            provider=self.get_provider_name(),
            service_type="llm",
            operation="generate",
            units_consumed=response.tokens_used,
            unit_type="tokens",
            cost_estimate=response.cost_estimate or 0.0,
            duration_ms=response.latency_ms,
            user_id=user_id,
            call_id=call_id,
            timestamp=time.strftime("%Y-%m-%d %H:%M:%S"),
            metadata={
                "model": response.model,
                "finish_reason": response.finish_reason,
                **response.metadata
            }
        )