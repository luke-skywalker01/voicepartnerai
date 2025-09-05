"""
Unit tests for External Services
Tests resilient external service integrations with mocked API calls
"""

import pytest
import asyncio
from unittest.mock import Mock, patch, AsyncMock
from datetime import datetime, timezone

from external_services import (
    OpenAIService,
    TwilioService, 
    StripeService,
    ElevenLabsService,
    ExternalServiceError,
    ServiceUnavailableError,
    ServiceConfigurationError,
    RateLimitError,
    CircuitBreaker
)

class TestOpenAIService:
    """Test suite for OpenAI service integration."""

    def test_init_valid_api_key(self):
        """Test initialization with valid API key."""
        service = OpenAIService("test-api-key")
        assert service.client is not None

    def test_init_empty_api_key(self):
        """Test initialization with empty API key raises error."""
        with pytest.raises(ServiceConfigurationError):
            OpenAIService("")

    @pytest.mark.asyncio
    @patch('openai.AsyncOpenAI')
    async def test_create_chat_completion_success(self, mock_openai):
        """Test successful chat completion."""
        # Mock successful response
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = "Test response"
        mock_response.choices[0].finish_reason = "stop"
        mock_response.usage.prompt_tokens = 10
        mock_response.usage.completion_tokens = 5
        mock_response.usage.total_tokens = 15
        mock_response.model = "gpt-4"
        
        mock_client = Mock()
        mock_client.chat.completions.create = AsyncMock(return_value=mock_response)
        mock_openai.return_value = mock_client
        
        service = OpenAIService("test-api-key")
        
        result = await service.create_chat_completion(
            messages=[{"role": "user", "content": "Hello"}],
            model="gpt-4"
        )
        
        assert result["content"] == "Test response"
        assert result["usage"]["total_tokens"] == 15
        assert result["model"] == "gpt-4"
        assert result["finish_reason"] == "stop"

    @pytest.mark.asyncio
    @patch('openai.AsyncOpenAI')
    async def test_create_chat_completion_rate_limit(self, mock_openai):
        """Test rate limit error handling."""
        import openai
        
        mock_client = Mock()
        mock_client.chat.completions.create = AsyncMock(
            side_effect=openai.RateLimitError("Rate limit exceeded", response=Mock(), body={})
        )
        mock_openai.return_value = mock_client
        
        service = OpenAIService("test-api-key")
        
        with pytest.raises(RateLimitError):
            await service.create_chat_completion(
                messages=[{"role": "user", "content": "Hello"}]
            )

    @pytest.mark.asyncio 
    @patch('openai.AsyncOpenAI')
    async def test_create_chat_completion_auth_error(self, mock_openai):
        """Test authentication error handling."""
        import openai
        
        mock_client = Mock()
        mock_client.chat.completions.create = AsyncMock(
            side_effect=openai.AuthenticationError("Invalid API key")
        )
        mock_openai.return_value = mock_client
        
        service = OpenAIService("test-api-key")
        
        with pytest.raises(ServiceConfigurationError):
            await service.create_chat_completion(
                messages=[{"role": "user", "content": "Hello"}]
            )

    @pytest.mark.asyncio
    @patch('openai.AsyncOpenAI') 
    async def test_create_speech_success(self, mock_openai):
        """Test successful speech synthesis."""
        mock_response = Mock()
        mock_response.content = b"fake_audio_data"
        
        mock_client = Mock()
        mock_client.audio.speech.create = AsyncMock(return_value=mock_response)
        mock_openai.return_value = mock_client
        
        service = OpenAIService("test-api-key")
        
        result = await service.create_speech(
            text="Hello world",
            voice="alloy"
        )
        
        assert result == b"fake_audio_data"
        mock_client.audio.speech.create.assert_called_once()

class TestTwilioService:
    """Test suite for Twilio service integration."""

    def test_init_valid_credentials(self):
        """Test initialization with valid credentials."""
        service = TwilioService("test_sid", "test_token")
        assert service.account_sid == "test_sid"
        assert service.client is not None

    def test_init_empty_credentials(self):
        """Test initialization with empty credentials raises error."""
        with pytest.raises(ServiceConfigurationError):
            TwilioService("", "test_token")
        
        with pytest.raises(ServiceConfigurationError):
            TwilioService("test_sid", "")

    @pytest.mark.asyncio
    @patch('external_services.TwilioClient')
    async def test_create_call_success(self, mock_twilio_client):
        """Test successful call creation."""
        # Mock successful call
        mock_call = Mock()
        mock_call.sid = "test_call_sid"
        mock_call.status = "queued"
        mock_call.to = "+15551234567"
        mock_call.from_ = "+15559876543"
        mock_call.date_created = datetime.now(timezone.utc)
        
        mock_client = Mock()
        mock_client.calls.create.return_value = mock_call
        mock_twilio_client.return_value = mock_client
        
        service = TwilioService("test_sid", "test_token")
        
        result = await service.create_call(
            to="+15551234567",
            from_="+15559876543",
            url="http://example.com/webhook"
        )
        
        assert result["call_sid"] == "test_call_sid"
        assert result["status"] == "queued"
        assert result["to"] == "+15551234567"
        assert result["from"] == "+15559876543"

    @pytest.mark.asyncio
    @patch('external_services.TwilioClient')
    async def test_create_call_twilio_error(self, mock_twilio_client):
        """Test Twilio REST exception handling."""
        from twilio.base.exceptions import TwilioRestException
        
        mock_client = Mock()
        mock_client.calls.create.side_effect = TwilioRestException(
            status=400,
            uri="test",
            msg="Invalid phone number",
            code=21614
        )
        mock_twilio_client.return_value = mock_client
        
        service = TwilioService("test_sid", "test_token")
        
        with pytest.raises(ExternalServiceError):
            await service.create_call(
                to="invalid",
                from_="+15559876543",
                url="http://example.com/webhook"
            )

    @pytest.mark.asyncio
    @patch('external_services.TwilioClient')
    async def test_create_call_rate_limit(self, mock_twilio_client):
        """Test rate limit error handling."""
        from twilio.base.exceptions import TwilioRestException
        
        mock_client = Mock()
        mock_client.calls.create.side_effect = TwilioRestException(
            status=429,
            uri="test", 
            msg="Too many requests",
            code=20429
        )
        mock_twilio_client.return_value = mock_client
        
        service = TwilioService("test_sid", "test_token")
        
        with pytest.raises(RateLimitError):
            await service.create_call(
                to="+15551234567",
                from_="+15559876543", 
                url="http://example.com/webhook"
            )

    @pytest.mark.asyncio
    @patch('external_services.TwilioClient')
    async def test_get_call_details_success(self, mock_twilio_client):
        """Test successful call details retrieval."""
        mock_call = Mock()
        mock_call.sid = "test_call_sid"
        mock_call.status = "completed"
        mock_call.duration = 60
        mock_call.start_time = datetime.now(timezone.utc)
        mock_call.end_time = datetime.now(timezone.utc)
        mock_call.price = 0.05
        mock_call.direction = "outbound"
        
        mock_client = Mock()
        mock_client.calls.return_value.fetch.return_value = mock_call
        mock_twilio_client.return_value = mock_client
        
        service = TwilioService("test_sid", "test_token")
        
        result = await service.get_call_details("test_call_sid")
        
        assert result["call_sid"] == "test_call_sid"
        assert result["status"] == "completed"
        assert result["duration"] == 60
        assert result["price"] == 0.05

class TestStripeService:
    """Test suite for Stripe service integration."""

    def test_init_valid_api_key(self):
        """Test initialization with valid API key."""
        with patch('stripe.api_key', "test_key"):
            service = StripeService("test_key")
            assert service is not None

    def test_init_empty_api_key(self):
        """Test initialization with empty API key raises error."""
        with pytest.raises(ServiceConfigurationError):
            StripeService("")

    @pytest.mark.asyncio
    @patch('stripe.PaymentIntent')
    async def test_create_payment_intent_success(self, mock_payment_intent):
        """Test successful payment intent creation."""
        mock_intent = Mock()
        mock_intent.id = "pi_test_123"
        mock_intent.client_secret = "pi_test_123_secret"
        mock_intent.status = "requires_payment_method"
        mock_intent.amount = 1000
        mock_intent.currency = "eur"
        
        mock_payment_intent.create.return_value = mock_intent
        
        service = StripeService("test_key")
        
        result = await service.create_payment_intent(
            amount=1000,
            currency="eur"
        )
        
        assert result["payment_intent_id"] == "pi_test_123"
        assert result["client_secret"] == "pi_test_123_secret"
        assert result["status"] == "requires_payment_method"
        assert result["amount"] == 1000
        assert result["currency"] == "eur"

    @pytest.mark.asyncio
    @patch('stripe.PaymentIntent')
    async def test_create_payment_intent_card_error(self, mock_payment_intent):
        """Test card error handling."""
        import stripe
        
        mock_payment_intent.create.side_effect = stripe.error.CardError(
            message="Your card was declined",
            param="card",
            code="card_declined"
        )
        
        service = StripeService("test_key")
        
        with pytest.raises(ExternalServiceError):
            await service.create_payment_intent(amount=1000)

    @pytest.mark.asyncio
    @patch('stripe.PaymentIntent')
    async def test_create_payment_intent_rate_limit(self, mock_payment_intent):
        """Test rate limit error handling."""
        import stripe
        
        mock_payment_intent.create.side_effect = stripe.error.RateLimitError(
            message="Too many requests"
        )
        
        service = StripeService("test_key")
        
        with pytest.raises(RateLimitError):
            await service.create_payment_intent(amount=1000)

class TestElevenLabsService:
    """Test suite for ElevenLabs service integration."""

    def test_init_valid_api_key(self):
        """Test initialization with valid API key."""
        service = ElevenLabsService("test_key")
        assert service.api_key == "test_key"
        assert service.http_client is not None

    def test_init_empty_api_key(self):
        """Test initialization with empty API key raises error."""
        with pytest.raises(ServiceConfigurationError):
            ElevenLabsService("")

    @pytest.mark.asyncio
    async def test_text_to_speech_success(self):
        """Test successful text to speech conversion."""
        service = ElevenLabsService("test_key")
        
        # Mock HTTP client response
        mock_response = Mock()
        mock_response.content = b"fake_audio_data"
        service.http_client.request = AsyncMock(return_value=mock_response)
        
        result = await service.text_to_speech(
            text="Hello world",
            voice_id="test_voice_id"
        )
        
        assert result == b"fake_audio_data"
        service.http_client.request.assert_called_once()

    @pytest.mark.asyncio
    async def test_text_to_speech_rate_limit(self):
        """Test rate limit error handling."""
        service = ElevenLabsService("test_key")
        
        # Mock rate limit error
        service.http_client.request = AsyncMock(
            side_effect=RateLimitError("elevenlabs", "Rate limit exceeded")
        )
        
        with pytest.raises(RateLimitError):
            await service.text_to_speech(
                text="Hello world",
                voice_id="test_voice_id"
            )

    @pytest.mark.asyncio
    async def test_close(self):
        """Test service cleanup."""
        service = ElevenLabsService("test_key")
        service.http_client.close = AsyncMock()
        
        await service.close()
        
        service.http_client.close.assert_called_once()

class TestCircuitBreaker:
    """Test suite for Circuit Breaker pattern."""

    @pytest.mark.asyncio
    async def test_circuit_breaker_closed_state(self):
        """Test circuit breaker in closed state."""
        breaker = CircuitBreaker(failure_threshold=3, timeout=60)
        
        async def success_func():
            return "success"
        
        result = await breaker.call(success_func)
        assert result == "success"
        assert breaker.state == "closed"
        assert breaker.failure_count == 0

    @pytest.mark.asyncio
    async def test_circuit_breaker_failure_count(self):
        """Test circuit breaker failure counting."""
        breaker = CircuitBreaker(failure_threshold=3, timeout=60)
        
        async def fail_func():
            raise Exception("Test failure")
        
        # First few failures should still call function
        for i in range(2):
            with pytest.raises(Exception):
                await breaker.call(fail_func)
            
            assert breaker.failure_count == i + 1
            assert breaker.state == "closed"

    @pytest.mark.asyncio
    async def test_circuit_breaker_opens_after_threshold(self):
        """Test circuit breaker opens after failure threshold."""
        breaker = CircuitBreaker(failure_threshold=2, timeout=60)
        
        async def fail_func():
            raise Exception("Test failure")
        
        # Reach failure threshold
        for _ in range(2):
            with pytest.raises(Exception):
                await breaker.call(fail_func)
        
        assert breaker.state == "open"
        
        # Next call should fail immediately without calling function
        with pytest.raises(ServiceUnavailableError):
            await breaker.call(fail_func)

    @pytest.mark.asyncio
    async def test_circuit_breaker_half_open_state(self):
        """Test circuit breaker half-open state after timeout."""
        breaker = CircuitBreaker(failure_threshold=2, timeout=0.1)  # Short timeout for testing
        
        async def fail_func():
            raise Exception("Test failure")
        
        # Open the circuit
        for _ in range(2):
            with pytest.raises(Exception):
                await breaker.call(fail_func)
        
        assert breaker.state == "open"
        
        # Wait for timeout
        await asyncio.sleep(0.2)
        
        # Mock time passage for half-open test
        import time
        breaker.last_failure_time = time.time() - 1  # Simulate time passage
        
        # Next call should attempt again (half-open)
        with pytest.raises(Exception):
            await breaker.call(fail_func)
        
        # Should be open again after failure in half-open state
        assert breaker.state == "open"

    @pytest.mark.asyncio
    async def test_circuit_breaker_recovery(self):
        """Test circuit breaker recovery after success."""
        breaker = CircuitBreaker(failure_threshold=2, timeout=0.1)
        
        async def fail_func():
            raise Exception("Test failure")
        
        async def success_func():
            return "success"
        
        # Open the circuit
        for _ in range(2):
            with pytest.raises(Exception):
                await breaker.call(fail_func)
        
        assert breaker.state == "open"
        
        # Wait for timeout and simulate time passage
        await asyncio.sleep(0.2)
        import time
        breaker.last_failure_time = time.time() - 1
        
        # Successful call should close the circuit
        result = await breaker.call(success_func)
        assert result == "success"
        assert breaker.state == "closed"
        assert breaker.failure_count == 0

class TestServiceIntegration:
    """Integration tests for service interactions."""

    @pytest.mark.asyncio
    async def test_service_factory_pattern(self):
        """Test service factory creates services correctly."""
        from external_services import ExternalServiceFactory
        
        config = {
            "openai": {"api_key": "test_openai_key"},
            "twilio": {"account_sid": "test_sid", "auth_token": "test_token"},
            "stripe": {"secret_key": "test_stripe_key"},
            "elevenlabs": {"api_key": "test_elevenlabs_key"}
        }
        
        factory = ExternalServiceFactory(config)
        
        # Test service creation
        openai_service = factory.get_openai_service()
        assert isinstance(openai_service, OpenAIService)
        
        twilio_service = factory.get_twilio_service()
        assert isinstance(twilio_service, TwilioService)
        
        stripe_service = factory.get_stripe_service()
        assert isinstance(stripe_service, StripeService)
        
        elevenlabs_service = factory.get_elevenlabs_service()
        assert isinstance(elevenlabs_service, ElevenLabsService)
        
        # Test singleton behavior
        assert factory.get_openai_service() is openai_service

    def test_error_hierarchy(self):
        """Test custom exception hierarchy."""
        # Test base exception
        base_error = ExternalServiceError("test", "message")
        assert base_error.service_name == "test"
        assert base_error.message == "message"
        
        # Test service unavailable error
        unavailable_error = ServiceUnavailableError("test", "unavailable")
        assert isinstance(unavailable_error, ExternalServiceError)
        
        # Test configuration error
        config_error = ServiceConfigurationError("test", "bad config")
        assert isinstance(config_error, ExternalServiceError)
        
        # Test rate limit error
        rate_error = RateLimitError("test", "rate limited")
        assert isinstance(rate_error, ExternalServiceError)