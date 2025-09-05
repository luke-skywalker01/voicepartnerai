"""
Resilient External Service Integrations for VoicePartnerAI
Provides robust error handling and retry logic for external API calls
"""

import logging
import asyncio
from typing import Dict, Any, Optional, Callable, Union
from datetime import datetime, timezone
import json

# Retry and resilience libraries
from tenacity import (
    retry, 
    stop_after_attempt, 
    wait_exponential, 
    retry_if_exception_type,
    retry_if_result,
    before_log,
    after_log
)
import httpx
import openai
from twilio.rest import Client as TwilioClient
from twilio.base.exceptions import TwilioRestException
import stripe

logger = logging.getLogger(__name__)

class ExternalServiceError(Exception):
    """Base exception for external service errors."""
    def __init__(self, service_name: str, message: str, original_error: Optional[Exception] = None):
        self.service_name = service_name
        self.message = message
        self.original_error = original_error
        super().__init__(message)

class ServiceUnavailableError(ExternalServiceError):
    """Exception for when external service is temporarily unavailable."""
    pass

class ServiceConfigurationError(ExternalServiceError):
    """Exception for configuration errors (API keys, etc.)."""
    pass

class RateLimitError(ExternalServiceError):
    """Exception for rate limiting errors."""
    pass


class ResilientHTTPClient:
    """HTTP client with automatic retries and error handling."""
    
    def __init__(self, timeout: int = 30):
        self.client = httpx.AsyncClient(timeout=timeout)
        
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10),
        retry=retry_if_exception_type((httpx.ConnectError, httpx.TimeoutException, httpx.HTTPStatusError)),
        before=before_log(logger, logging.INFO),
        after=after_log(logger, logging.INFO)
    )
    async def request(
        self, 
        method: str, 
        url: str, 
        **kwargs
    ) -> httpx.Response:
        """Make HTTP request with automatic retries."""
        try:
            response = await self.client.request(method, url, **kwargs)
            response.raise_for_status()
            return response
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 429:
                raise RateLimitError("http", "Rate limit exceeded", e)
            elif e.response.status_code >= 500:
                raise ServiceUnavailableError("http", f"Server error: {e.response.status_code}", e)
            else:
                raise ExternalServiceError("http", f"HTTP error: {e.response.status_code}", e)
        except (httpx.ConnectError, httpx.TimeoutException) as e:
            raise ServiceUnavailableError("http", "Connection or timeout error", e)
    
    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()


class OpenAIService:
    """Resilient OpenAI API integration."""
    
    def __init__(self, api_key: str):
        if not api_key:
            raise ServiceConfigurationError("openai", "OpenAI API key not configured")
        
        openai.api_key = api_key
        self.client = openai.AsyncOpenAI(api_key=api_key)
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10),
        retry=retry_if_exception_type((
            openai.RateLimitError,
            openai.APIConnectionError,
            openai.InternalServerError
        )),
        before=before_log(logger, logging.INFO),
        after=after_log(logger, logging.INFO)
    )
    async def create_chat_completion(
        self,
        messages: list,
        model: str = "gpt-4",
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """Create chat completion with retry logic."""
        try:
            logger.info(f"Creating OpenAI chat completion with model {model}")
            
            response = await self.client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                **kwargs
            )
            
            logger.info("OpenAI chat completion successful")
            return {
                "content": response.choices[0].message.content,
                "usage": {
                    "prompt_tokens": response.usage.prompt_tokens,
                    "completion_tokens": response.usage.completion_tokens,
                    "total_tokens": response.usage.total_tokens
                },
                "model": response.model,
                "finish_reason": response.choices[0].finish_reason
            }
            
        except openai.RateLimitError as e:
            logger.warning(f"OpenAI rate limit exceeded: {e}")
            raise RateLimitError("openai", "Rate limit exceeded. Please try again later.", e)
        
        except openai.AuthenticationError as e:
            logger.error(f"OpenAI authentication error: {e}")
            raise ServiceConfigurationError("openai", "Invalid API key or authentication failed", e)
        
        except openai.APIConnectionError as e:
            logger.warning(f"OpenAI connection error: {e}")
            raise ServiceUnavailableError("openai", "Connection to OpenAI failed", e)
        
        except openai.InternalServerError as e:
            logger.error(f"OpenAI internal server error: {e}")
            raise ServiceUnavailableError("openai", "OpenAI service temporarily unavailable", e)
        
        except Exception as e:
            logger.error(f"Unexpected OpenAI error: {e}")
            raise ExternalServiceError("openai", f"Unexpected error: {str(e)}", e)
    
    @retry(
        stop=stop_after_attempt(2),
        wait=wait_exponential(multiplier=1, min=2, max=5),
        retry=retry_if_exception_type((
            openai.RateLimitError,
            openai.APIConnectionError
        ))
    )
    async def create_speech(
        self,
        text: str,
        voice: str = "alloy",
        model: str = "tts-1",
        response_format: str = "mp3"
    ) -> bytes:
        """Create speech synthesis with retry logic."""
        try:
            logger.info(f"Creating OpenAI speech synthesis for {len(text)} characters")
            
            response = await self.client.audio.speech.create(
                model=model,
                voice=voice,
                input=text,
                response_format=response_format
            )
            
            audio_data = response.content
            logger.info(f"OpenAI speech synthesis successful, {len(audio_data)} bytes")
            return audio_data
            
        except Exception as e:
            logger.error(f"OpenAI speech synthesis error: {e}")
            raise ExternalServiceError("openai", f"Speech synthesis failed: {str(e)}", e)


class TwilioService:
    """Resilient Twilio API integration."""
    
    def __init__(self, account_sid: str, auth_token: str):
        if not account_sid or not auth_token:
            raise ServiceConfigurationError("twilio", "Twilio credentials not configured")
        
        self.client = TwilioClient(account_sid, auth_token)
        self.account_sid = account_sid
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=8),
        retry=retry_if_exception_type((ConnectionError, TimeoutError)),
        before=before_log(logger, logging.INFO),
        after=after_log(logger, logging.INFO)
    )
    async def create_call(
        self,
        to: str,
        from_: str,
        url: str,
        method: str = "POST",
        **kwargs
    ) -> Dict[str, Any]:
        """Create Twilio call with retry logic."""
        try:
            logger.info(f"Creating Twilio call from {from_} to {to}")
            
            # Twilio client is synchronous, run in thread pool
            call = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: self.client.calls.create(
                    to=to,
                    from_=from_,
                    url=url,
                    method=method,
                    **kwargs
                )
            )
            
            logger.info(f"Twilio call created successfully: {call.sid}")
            return {
                "call_sid": call.sid,
                "status": call.status,
                "to": call.to,
                "from": call.from_,
                "date_created": call.date_created.isoformat() if call.date_created else None
            }
            
        except TwilioRestException as e:
            logger.error(f"Twilio REST error: {e.code} - {e.msg}")
            
            if e.code in [20003, 20429]:  # Rate limiting
                raise RateLimitError("twilio", f"Rate limit exceeded: {e.msg}", e)
            elif e.code in [20001, 20002]:  # Authentication
                raise ServiceConfigurationError("twilio", f"Authentication error: {e.msg}", e)
            elif e.code >= 30000:  # Service errors
                raise ServiceUnavailableError("twilio", f"Twilio service error: {e.msg}", e)
            else:
                raise ExternalServiceError("twilio", f"Twilio error {e.code}: {e.msg}", e)
        
        except Exception as e:
            logger.error(f"Unexpected Twilio error: {e}")
            raise ExternalServiceError("twilio", f"Unexpected error: {str(e)}", e)
    
    @retry(
        stop=stop_after_attempt(2),
        wait=wait_exponential(multiplier=1, min=1, max=4)
    )
    async def get_call_details(self, call_sid: str) -> Dict[str, Any]:
        """Get call details with retry logic."""
        try:
            call = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: self.client.calls(call_sid).fetch()
            )
            
            return {
                "call_sid": call.sid,
                "status": call.status,
                "duration": call.duration,
                "start_time": call.start_time.isoformat() if call.start_time else None,
                "end_time": call.end_time.isoformat() if call.end_time else None,
                "price": call.price,
                "direction": call.direction
            }
            
        except TwilioRestException as e:
            if e.code == 20404:  # Not found
                return None
            raise ExternalServiceError("twilio", f"Error fetching call details: {e.msg}", e)


class StripeService:
    """Resilient Stripe API integration."""
    
    def __init__(self, api_key: str):
        if not api_key:
            raise ServiceConfigurationError("stripe", "Stripe API key not configured")
        
        stripe.api_key = api_key
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=8),
        retry=retry_if_exception_type((stripe.error.APIConnectionError, stripe.error.RateLimitError)),
        before=before_log(logger, logging.INFO),
        after=after_log(logger, logging.INFO)
    )
    async def create_payment_intent(
        self,
        amount: int,
        currency: str = "eur",
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Create Stripe payment intent with retry logic."""
        try:
            logger.info(f"Creating Stripe payment intent for {amount} {currency}")
            
            payment_intent = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: stripe.PaymentIntent.create(
                    amount=amount,
                    currency=currency,
                    metadata=metadata or {}
                )
            )
            
            logger.info(f"Stripe payment intent created: {payment_intent.id}")
            return {
                "payment_intent_id": payment_intent.id,
                "client_secret": payment_intent.client_secret,
                "status": payment_intent.status,
                "amount": payment_intent.amount,
                "currency": payment_intent.currency
            }
            
        except stripe.error.CardError as e:
            logger.warning(f"Stripe card error: {e.user_message}")
            raise ExternalServiceError("stripe", f"Card error: {e.user_message}", e)
        
        except stripe.error.RateLimitError as e:
            logger.warning("Stripe rate limit exceeded")
            raise RateLimitError("stripe", "Rate limit exceeded", e)
        
        except stripe.error.InvalidRequestError as e:
            logger.error(f"Stripe invalid request: {e.user_message}")
            raise ExternalServiceError("stripe", f"Invalid request: {e.user_message}", e)
        
        except stripe.error.AuthenticationError as e:
            logger.error("Stripe authentication error")
            raise ServiceConfigurationError("stripe", "Authentication failed - check API key", e)
        
        except stripe.error.APIConnectionError as e:
            logger.warning("Stripe connection error")
            raise ServiceUnavailableError("stripe", "Connection to Stripe failed", e)
        
        except Exception as e:
            logger.error(f"Unexpected Stripe error: {e}")
            raise ExternalServiceError("stripe", f"Unexpected error: {str(e)}", e)


class ElevenLabsService:
    """Resilient ElevenLabs API integration."""
    
    def __init__(self, api_key: str):
        if not api_key:
            raise ServiceConfigurationError("elevenlabs", "ElevenLabs API key not configured")
        
        self.api_key = api_key
        self.base_url = "https://api.elevenlabs.io/v1"
        self.http_client = ResilientHTTPClient()
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=3, max=10),
        retry=retry_if_exception_type((ServiceUnavailableError, RateLimitError)),
        before=before_log(logger, logging.INFO),
        after=after_log(logger, logging.INFO)
    )
    async def text_to_speech(
        self,
        text: str,
        voice_id: str,
        model_id: str = "eleven_monolingual_v1",
        voice_settings: Optional[Dict[str, float]] = None
    ) -> bytes:
        """Convert text to speech with retry logic."""
        try:
            logger.info(f"Creating ElevenLabs speech for {len(text)} characters with voice {voice_id}")
            
            if not voice_settings:
                voice_settings = {
                    "stability": 0.75,
                    "similarity_boost": 0.75
                }
            
            payload = {
                "text": text,
                "model_id": model_id,
                "voice_settings": voice_settings
            }
            
            headers = {
                "Accept": "audio/mpeg",
                "Content-Type": "application/json",
                "xi-api-key": self.api_key
            }
            
            response = await self.http_client.request(
                "POST",
                f"{self.base_url}/text-to-speech/{voice_id}",
                json=payload,
                headers=headers
            )
            
            audio_data = response.content
            logger.info(f"ElevenLabs speech synthesis successful, {len(audio_data)} bytes")
            return audio_data
            
        except RateLimitError:
            raise  # Re-raise to trigger retry
        except ServiceUnavailableError:
            raise  # Re-raise to trigger retry
        except Exception as e:
            logger.error(f"ElevenLabs speech synthesis error: {e}")
            raise ExternalServiceError("elevenlabs", f"Speech synthesis failed: {str(e)}", e)
    
    async def close(self):
        """Close HTTP client."""
        await self.http_client.close()


# Service factory for dependency injection
class ExternalServiceFactory:
    """Factory for creating external service instances."""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self._openai_service = None
        self._twilio_service = None
        self._stripe_service = None
        self._elevenlabs_service = None
    
    def get_openai_service(self) -> OpenAIService:
        """Get OpenAI service instance."""
        if not self._openai_service:
            api_key = self.config.get("openai", {}).get("api_key")
            self._openai_service = OpenAIService(api_key)
        return self._openai_service
    
    def get_twilio_service(self) -> TwilioService:
        """Get Twilio service instance."""
        if not self._twilio_service:
            twilio_config = self.config.get("twilio", {})
            self._twilio_service = TwilioService(
                twilio_config.get("account_sid"),
                twilio_config.get("auth_token")
            )
        return self._twilio_service
    
    def get_stripe_service(self) -> StripeService:
        """Get Stripe service instance."""
        if not self._stripe_service:
            api_key = self.config.get("stripe", {}).get("secret_key")
            self._stripe_service = StripeService(api_key)
        return self._stripe_service
    
    def get_elevenlabs_service(self) -> ElevenLabsService:
        """Get ElevenLabs service instance."""
        if not self._elevenlabs_service:
            api_key = self.config.get("elevenlabs", {}).get("api_key")
            self._elevenlabs_service = ElevenLabsService(api_key)
        return self._elevenlabs_service


# Circuit breaker pattern for critical services
class CircuitBreaker:
    """Simple circuit breaker implementation."""
    
    def __init__(self, failure_threshold: int = 5, timeout: int = 60):
        self.failure_threshold = failure_threshold
        self.timeout = timeout
        self.failure_count = 0
        self.last_failure_time = None
        self.state = "closed"  # closed, open, half-open
    
    async def call(self, func: Callable, *args, **kwargs):
        """Call function with circuit breaker protection."""
        if self.state == "open":
            if datetime.now().timestamp() - self.last_failure_time > self.timeout:
                self.state = "half-open"
            else:
                raise ServiceUnavailableError("circuit_breaker", "Circuit breaker is open")
        
        try:
            result = await func(*args, **kwargs)
            self.on_success()
            return result
        except Exception as e:
            self.on_failure()
            raise
    
    def on_success(self):
        """Handle successful call."""
        self.failure_count = 0
        self.state = "closed"
    
    def on_failure(self):
        """Handle failed call."""
        self.failure_count += 1
        self.last_failure_time = datetime.now().timestamp()
        
        if self.failure_count >= self.failure_threshold:
            self.state = "open"


# Example usage and testing functions
async def test_services():
    """Test all external services."""
    config = {
        "openai": {"api_key": "test_key"},
        "twilio": {"account_sid": "test", "auth_token": "test"},
        "stripe": {"secret_key": "test_key"},
        "elevenlabs": {"api_key": "test_key"}
    }
    
    factory = ExternalServiceFactory(config)
    
    # Test each service (these will fail with test keys, but show the error handling)
    try:
        openai_service = factory.get_openai_service()
        # await openai_service.create_chat_completion([{"role": "user", "content": "Hello"}])
    except ServiceConfigurationError as e:
        logger.info(f"Expected configuration error: {e}")
    
    logger.info("Service resilience testing completed")


if __name__ == "__main__":
    import asyncio
    asyncio.run(test_services())