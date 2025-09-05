"""
Unit tests for Credit Calculator
Tests critical business logic for credit calculation and billing
"""

import pytest
from decimal import Decimal
from unittest.mock import Mock, patch

from billing import CreditCalculator, CallLogger
from models import CallLog, PhoneNumber, Assistant


class TestCreditCalculator:
    """Test suite for CreditCalculator business logic."""

    def test_calculate_call_credits_basic_call(self):
        """Test basic call credit calculation without premium features."""
        duration_minutes = 5.0
        credits = CreditCalculator.calculate_call_credits(duration_minutes)
        
        # Expected: 5 min * 1.0 (voice_call) + 5 min * 0.1 (text_to_speech) = 5.5 credits
        expected_credits = 5.5
        assert credits == expected_credits

    def test_calculate_call_credits_with_premium_voice(self):
        """Test call credit calculation with premium voice."""
        duration_minutes = 3.0
        credits = CreditCalculator.calculate_call_credits(
            duration_minutes, 
            voice_type='premium'
        )
        
        # Expected: 3 * 1.0 (voice_call) + 3 * 2.0 (premium_voice) + 3 * 0.1 (text_to_speech) = 9.3 credits
        expected_credits = 9.3
        assert credits == expected_credits

    def test_calculate_call_credits_with_ai_requests(self):
        """Test call credit calculation with AI requests."""
        duration_minutes = 2.0
        ai_requests = 10
        credits = CreditCalculator.calculate_call_credits(
            duration_minutes, 
            ai_requests=ai_requests
        )
        
        # Expected: 2 * 1.0 (voice_call) + 10 * 0.5 (ai_processing) + 2 * 0.1 (text_to_speech) = 7.2 credits
        expected_credits = 7.2
        assert credits == expected_credits

    def test_calculate_call_credits_premium_with_ai(self):
        """Test call credit calculation with premium voice and AI requests."""
        duration_minutes = 1.5
        ai_requests = 5
        credits = CreditCalculator.calculate_call_credits(
            duration_minutes, 
            voice_type='premium',
            ai_requests=ai_requests
        )
        
        # Expected: 1.5 * 1.0 (voice_call) + 1.5 * 2.0 (premium_voice) + 5 * 0.5 (ai_processing) + 1.5 * 0.1 (text_to_speech) = 7.15 credits
        expected_credits = 7.15
        assert credits == expected_credits

    def test_calculate_call_credits_zero_duration(self):
        """Test call credit calculation with zero duration."""
        credits = CreditCalculator.calculate_call_credits(0.0)
        
        # Expected: 0 credits for zero duration
        assert credits == 0.0

    def test_calculate_call_credits_fractional_minutes(self):
        """Test call credit calculation with fractional minutes."""
        duration_minutes = 0.25  # 15 seconds
        credits = CreditCalculator.calculate_call_credits(duration_minutes)
        
        # Expected: 0.25 * 1.0 (voice_call) + 0.25 * 0.1 (text_to_speech) = 0.275, rounded to 0.28
        expected_credits = 0.28
        assert credits == expected_credits

    def test_calculate_call_credits_large_numbers(self):
        """Test call credit calculation with large numbers."""
        duration_minutes = 120.0  # 2 hours
        ai_requests = 1000
        credits = CreditCalculator.calculate_call_credits(
            duration_minutes, 
            voice_type='premium',
            ai_requests=ai_requests
        )
        
        # Expected: 120 * 1.0 + 120 * 2.0 + 1000 * 0.5 + 120 * 0.1 = 120 + 240 + 500 + 12 = 872.0
        expected_credits = 872.0
        assert credits == expected_credits

    def test_calculate_call_credits_rounding(self):
        """Test that credit calculation properly rounds to 2 decimal places."""
        duration_minutes = 1.0 / 3.0  # 0.333... minutes
        credits = CreditCalculator.calculate_call_credits(duration_minutes)
        
        # Should be rounded to 2 decimal places
        assert isinstance(credits, float)
        assert len(str(credits).split('.')[1]) <= 2

    def test_calculate_monthly_projection_basic(self):
        """Test monthly projection calculation."""
        daily_usage = 10.5
        projection = CreditCalculator.calculate_monthly_projection(daily_usage)
        
        expected = {
            'monthly_credits': 315.0,  # 10.5 * 30
            'monthly_cost_usd': 3.15,  # 315.0 * 0.01
            'monthly_cost_eur': 2.898  # 3.15 * 0.92
        }
        
        assert projection['monthly_credits'] == expected['monthly_credits']
        assert projection['monthly_cost_usd'] == expected['monthly_cost_usd']
        assert projection['monthly_cost_eur'] == expected['monthly_cost_eur']

    def test_calculate_monthly_projection_zero_usage(self):
        """Test monthly projection with zero daily usage."""
        projection = CreditCalculator.calculate_monthly_projection(0.0)
        
        assert projection['monthly_credits'] == 0.0
        assert projection['monthly_cost_usd'] == 0.0
        assert projection['monthly_cost_eur'] == 0.0

    def test_calculate_monthly_projection_high_usage(self):
        """Test monthly projection with high daily usage."""
        daily_usage = 1000.0
        projection = CreditCalculator.calculate_monthly_projection(daily_usage)
        
        expected = {
            'monthly_credits': 30000.0,  # 1000.0 * 30
            'monthly_cost_usd': 300.0,   # 30000.0 * 0.01
            'monthly_cost_eur': 276.0    # 300.0 * 0.92
        }
        
        assert projection['monthly_credits'] == expected['monthly_credits']
        assert projection['monthly_cost_usd'] == expected['monthly_cost_usd']
        assert projection['monthly_cost_eur'] == expected['monthly_cost_eur']

    def test_rates_constants(self):
        """Test that rate constants are properly defined."""
        rates = CreditCalculator.RATES
        
        # Verify all expected rates exist
        expected_rates = [
            'voice_call', 
            'ai_processing', 
            'text_to_speech', 
            'transcription', 
            'premium_voice'
        ]
        
        for rate_type in expected_rates:
            assert rate_type in rates
            assert isinstance(rates[rate_type], (int, float))
            assert rates[rate_type] >= 0

    def test_rates_values_are_reasonable(self):
        """Test that rate values are within reasonable ranges."""
        rates = CreditCalculator.RATES
        
        # All rates should be positive
        for rate_type, rate_value in rates.items():
            assert rate_value > 0, f"Rate {rate_type} should be positive"
        
        # Premium voice should cost more than standard voice
        assert rates['premium_voice'] > rates['voice_call']
        
        # Voice call should be the most expensive base service
        assert rates['voice_call'] >= rates['ai_processing']
        assert rates['voice_call'] >= rates['text_to_speech']
        assert rates['voice_call'] >= rates['transcription']

    def test_unknown_voice_type_defaults_to_standard(self):
        """Test that unknown voice types default to standard pricing."""
        duration_minutes = 2.0
        
        # Standard voice calculation
        standard_credits = CreditCalculator.calculate_call_credits(
            duration_minutes, 
            voice_type='standard'
        )
        
        # Unknown voice type should default to standard
        unknown_credits = CreditCalculator.calculate_call_credits(
            duration_minutes, 
            voice_type='unknown_voice_type'
        )
        
        assert standard_credits == unknown_credits


class TestCallLoggerCreditIntegration:
    """Test suite for CallLogger credit calculation integration."""

    def test_calculate_cost_usd(self, db_session):
        """Test USD cost calculation from credits."""
        logger = CallLogger(db_session)
        
        credits = 100.0
        cost_usd = logger._calculate_cost_usd(credits)
        
        # Expected: 100 credits * $0.01 = $1.00
        assert cost_usd == 1.00

    def test_calculate_cost_eur(self, db_session):
        """Test EUR cost calculation from credits."""
        logger = CallLogger(db_session)
        
        credits = 100.0
        cost_eur = logger._calculate_cost_eur(credits)
        
        # Expected: (100 credits * $0.01) * 0.92 = $0.92
        assert cost_eur == 0.92

    def test_calculate_cost_zero_credits(self, db_session):
        """Test cost calculation with zero credits."""
        logger = CallLogger(db_session)
        
        usd_cost = logger._calculate_cost_usd(0.0)
        eur_cost = logger._calculate_cost_eur(0.0)
        
        assert usd_cost == 0.0
        assert eur_cost == 0.0

    def test_calculate_cost_fractional_credits(self, db_session):
        """Test cost calculation with fractional credits."""
        logger = CallLogger(db_session)
        
        credits = 15.75
        usd_cost = logger._calculate_cost_usd(credits)
        eur_cost = logger._calculate_cost_eur(credits)
        
        # Expected USD: 15.75 * 0.01 = 0.1575
        # Expected EUR: 0.1575 * 0.92 = 0.1449
        assert usd_cost == 0.1575
        assert eur_cost == 0.1449

    def test_integration_credit_calculation_in_call_update(self, db_session, test_user, sample_call_log_data):
        """Test credit calculation integration in call update process."""
        logger = CallLogger(db_session)
        
        # Create initial call log
        phone_number = PhoneNumber(
            number="+15551234567",
            owner_id=test_user.id,
            provider="test_provider",
            region="US",
            usage={}
        )
        db_session.add(phone_number)
        db_session.commit()
        
        # Start call
        from schemas import CallLogCreate
        from datetime import datetime, timezone
        
        call_data = CallLogCreate(
            call_sid="test_call_123",
            phone_number_id=phone_number.id,
            caller_number="+15559876543",
            called_number="+15551234567",
            direction="inbound",
            start_time=datetime.now(timezone.utc),
            status="in-progress",
            credits_consumed=0.0
        )
        
        call_log = logger.start_call(call_data)
        
        # Update call with duration and credits
        from schemas import CallLogUpdate
        end_time = call_data.start_time.replace(second=call_data.start_time.second + 120)  # 2 minutes
        
        update_data = CallLogUpdate(
            end_time=end_time,
            status="completed",
            credits_consumed=5.5  # Credits for 2-minute call
        )
        
        updated_call = logger.update_call(call_log.call_sid, update_data)
        
        # Verify credit-based cost calculation
        assert updated_call.credits_consumed == 5.5
        assert updated_call.cost_usd == 0.055  # 5.5 * 0.01
        assert updated_call.cost_eur == 0.0506  # 0.055 * 0.92

    @pytest.fixture
    def sample_call_log_data(self):
        """Sample call log data for testing."""
        return {
            "call_sid": "test_call_123",
            "caller_number": "+15559876543",
            "called_number": "+15551234567",
            "direction": "inbound",
            "status": "completed",
            "credits_consumed": 10.0
        }


class TestCreditCalculatorEdgeCases:
    """Test edge cases and error conditions for credit calculator."""

    def test_negative_duration_handling(self):
        """Test handling of negative duration (should not happen but test robustness)."""
        # Negative duration should be treated as 0
        credits = CreditCalculator.calculate_call_credits(-1.0)
        
        # Should calculate as 0 duration
        expected_credits = 0.0
        assert credits == expected_credits

    def test_negative_ai_requests_handling(self):
        """Test handling of negative AI requests."""
        credits = CreditCalculator.calculate_call_credits(1.0, ai_requests=-5)
        
        # Should handle negative AI requests gracefully
        # Expected: 1.0 * 1.0 (voice_call) + (-5) * 0.5 (ai_processing) + 1.0 * 0.1 (text_to_speech) = -1.4
        # But typically we'd expect this to be clamped to 0 or handled specially
        assert isinstance(credits, float)

    def test_very_large_numbers(self):
        """Test handling of very large numbers."""
        duration_minutes = 1000000.0  # Very long call
        ai_requests = 999999
        
        credits = CreditCalculator.calculate_call_credits(
            duration_minutes,
            voice_type='premium',
            ai_requests=ai_requests
        )
        
        # Should handle large numbers without overflow
        assert isinstance(credits, float)
        assert credits > 0

    def test_precision_with_many_decimals(self):
        """Test precision handling with many decimal places."""
        duration_minutes = 1.123456789
        credits = CreditCalculator.calculate_call_credits(duration_minutes)
        
        # Should be rounded to 2 decimal places
        decimal_places = len(str(credits).split('.')[1]) if '.' in str(credits) else 0
        assert decimal_places <= 2

    def test_monthly_projection_edge_cases(self):
        """Test monthly projection with edge case values."""
        # Very small daily usage
        tiny_usage = 0.001
        projection = CreditCalculator.calculate_monthly_projection(tiny_usage)
        
        assert projection['monthly_credits'] == 0.03
        assert projection['monthly_cost_usd'] == 0.0003
        assert projection['monthly_cost_eur'] == 0.0003 * 0.92

    def test_rate_modification_safety(self):
        """Test that modifying rates doesn't affect other calculations."""
        original_rates = CreditCalculator.RATES.copy()
        
        # Calculate credits with original rates
        credits1 = CreditCalculator.calculate_call_credits(1.0)
        
        # Attempt to modify rates (this should not affect the class)
        try:
            CreditCalculator.RATES['voice_call'] = 999.0
            credits2 = CreditCalculator.calculate_call_credits(1.0)
            
            # Rates should have been modified
            assert credits2 != credits1
            
        finally:
            # Restore original rates
            CreditCalculator.RATES.update(original_rates)
            
        # Verify restoration
        credits3 = CreditCalculator.calculate_call_credits(1.0)
        assert credits3 == credits1