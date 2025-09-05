"""
Unit tests for Call Logger
Tests critical business logic for call logging and billing with mocked dependencies
"""

import pytest
from datetime import datetime, timezone, timedelta
from unittest.mock import Mock, patch, MagicMock
from sqlalchemy.orm import Session

from billing import CallLogger, CreditCalculator
from models import CallLog, PhoneNumber, Assistant, User, AnalyticsSnapshot
from schemas import CallLogCreate, CallLogUpdate


class TestCallLogger:
    """Test suite for CallLogger business logic."""

    def test_extract_geo_info_germany(self, db_session):
        """Test geo info extraction for German phone numbers."""
        logger = CallLogger(db_session)
        
        geo_info = logger._extract_geo_info("+4915123456789")
        
        assert geo_info['country_code'] == 'DE'
        assert geo_info['region'] == 'Germany'

    def test_extract_geo_info_us(self, db_session):
        """Test geo info extraction for US phone numbers."""
        logger = CallLogger(db_session)
        
        geo_info = logger._extract_geo_info("+15551234567")
        
        assert geo_info['country_code'] == 'US'
        assert geo_info['region'] == 'United States'

    def test_extract_geo_info_uk(self, db_session):
        """Test geo info extraction for UK phone numbers."""
        logger = CallLogger(db_session)
        
        geo_info = logger._extract_geo_info("+441234567890")
        
        assert geo_info['country_code'] == 'GB'
        assert geo_info['region'] == 'United Kingdom'

    def test_extract_geo_info_france(self, db_session):
        """Test geo info extraction for French phone numbers."""
        logger = CallLogger(db_session)
        
        geo_info = logger._extract_geo_info("+33123456789")
        
        assert geo_info['country_code'] == 'FR'
        assert geo_info['region'] == 'France'

    def test_extract_geo_info_unknown(self, db_session):
        """Test geo info extraction for unknown phone numbers."""
        logger = CallLogger(db_session)
        
        geo_info = logger._extract_geo_info("+999123456789")
        
        assert geo_info['country_code'] == 'Unknown'
        assert geo_info['region'] == 'Unknown'

    def test_calculate_cost_usd_standard_rate(self, db_session):
        """Test USD cost calculation with standard rate."""
        logger = CallLogger(db_session)
        
        cost = logger._calculate_cost_usd(50.0)
        
        # Expected: 50 credits * $0.01 = $0.50
        assert cost == 0.50

    def test_calculate_cost_eur_with_conversion(self, db_session):
        """Test EUR cost calculation with conversion rate."""
        logger = CallLogger(db_session)
        
        cost = logger._calculate_cost_eur(100.0)
        
        # Expected: (100 credits * $0.01) * 0.92 = $0.92
        assert cost == 0.92

    def test_start_call_success(self, db_session, test_user):
        """Test successful call start logging."""
        logger = CallLogger(db_session)
        
        # Create phone number
        phone_number = PhoneNumber(
            number="+15551234567",
            owner_id=test_user.id,
            provider="test_provider",
            region="US",
            usage={}
        )
        db_session.add(phone_number)
        db_session.commit()
        
        # Create call data
        call_data = CallLogCreate(
            call_sid="test_call_123",
            phone_number_id=phone_number.id,
            caller_number="+15559876543",
            called_number="+15551234567",
            direction="inbound",
            start_time=datetime.now(timezone.utc),
            status="ringing",
            credits_consumed=0.0
        )
        
        call_log = logger.start_call(call_data)
        
        # Verify call log creation
        assert call_log.call_sid == "test_call_123"
        assert call_log.phone_number_id == phone_number.id
        assert call_log.caller_number == "+15559876543"
        assert call_log.direction == "inbound"
        assert call_log.status == "ringing"
        assert call_log.country_code == "US"  # From geo extraction
        assert call_log.region == "United States"
        assert call_log.owner_id == test_user.id

    def test_start_call_with_assistant(self, db_session, test_user, test_workspace):
        """Test call start with assigned assistant."""
        logger = CallLogger(db_session)
        
        # Create assistant
        assistant = Assistant(
            name="Test Assistant",
            workspace_id=test_workspace.id,
            owner_id=test_user.id,
            system_prompt="Test prompt"
        )
        db_session.add(assistant)
        db_session.commit()
        
        # Create phone number
        phone_number = PhoneNumber(
            number="+15551234567",
            owner_id=test_user.id,
            provider="test_provider",
            region="US",
            usage={}
        )
        db_session.add(phone_number)
        db_session.commit()
        
        call_data = CallLogCreate(
            call_sid="test_call_124",
            phone_number_id=phone_number.id,
            assistant_id=assistant.id,
            caller_number="+15559876543",
            called_number="+15551234567",
            direction="inbound",
            start_time=datetime.now(timezone.utc),
            status="ringing",
            credits_consumed=0.0
        )
        
        call_log = logger.start_call(call_data)
        
        assert call_log.assistant_id == assistant.id

    def test_start_call_phone_number_not_found(self, db_session):
        """Test call start with non-existent phone number."""
        logger = CallLogger(db_session)
        
        call_data = CallLogCreate(
            call_sid="test_call_125",
            phone_number_id=99999,  # Non-existent
            caller_number="+15559876543",
            called_number="+15551234567",
            direction="inbound",
            start_time=datetime.now(timezone.utc),
            status="ringing",
            credits_consumed=0.0
        )
        
        with pytest.raises(ValueError, match="Phone number 99999 not found"):
            logger.start_call(call_data)

    def test_start_call_assistant_not_found_warning(self, db_session, test_user):
        """Test call start with non-existent assistant logs warning."""
        logger = CallLogger(db_session)
        
        # Create phone number
        phone_number = PhoneNumber(
            number="+15551234567",
            owner_id=test_user.id,
            provider="test_provider",
            region="US",
            usage={}
        )
        db_session.add(phone_number)
        db_session.commit()
        
        call_data = CallLogCreate(
            call_sid="test_call_126",
            phone_number_id=phone_number.id,
            assistant_id=99999,  # Non-existent
            caller_number="+15559876543",
            called_number="+15551234567",
            direction="inbound",
            start_time=datetime.now(timezone.utc),
            status="ringing",
            credits_consumed=0.0
        )
        
        with patch('billing.logger') as mock_logger:
            call_log = logger.start_call(call_data)
            
            # Should log warning but still create call
            mock_logger.warning.assert_called_once()
            assert call_log.assistant_id == 99999

    def test_update_call_success(self, db_session, sample_call_log):
        """Test successful call update."""
        logger = CallLogger(db_session)
        call_log = sample_call_log
        
        end_time = call_log.start_time + timedelta(minutes=5)
        update_data = CallLogUpdate(
            end_time=end_time,
            status="completed",
            credits_consumed=8.5,
            hangup_cause="normal"
        )
        
        updated_call = logger.update_call(call_log.call_sid, update_data)
        
        assert updated_call.status == "completed"
        assert updated_call.credits_consumed == 8.5
        assert updated_call.hangup_cause == "normal"
        assert updated_call.end_time == end_time
        assert updated_call.duration_seconds == 300  # 5 minutes
        assert updated_call.cost_usd == 0.085  # 8.5 * 0.01
        assert updated_call.cost_eur == 0.0782  # 0.085 * 0.92

    def test_update_call_auto_duration_calculation(self, db_session, sample_call_log):
        """Test automatic duration calculation during call update."""
        logger = CallLogger(db_session)
        call_log = sample_call_log
        
        end_time = call_log.start_time + timedelta(minutes=3, seconds=30)
        update_data = CallLogUpdate(
            end_time=end_time,
            status="completed"
        )
        
        updated_call = logger.update_call(call_log.call_sid, update_data)
        
        # Duration should be automatically calculated
        assert updated_call.duration_seconds == 210  # 3.5 minutes = 210 seconds

    def test_update_call_not_found(self, db_session):
        """Test call update with non-existent call SID."""
        logger = CallLogger(db_session)
        
        update_data = CallLogUpdate(status="completed")
        result = logger.update_call("non_existent_sid", update_data)
        
        assert result is None

    @patch('billing.CallLogger._trigger_analytics_update')
    def test_update_call_triggers_analytics_on_completion(self, mock_analytics, db_session, sample_call_log):
        """Test that analytics update is triggered when call completes."""
        logger = CallLogger(db_session)
        call_log = sample_call_log
        
        update_data = CallLogUpdate(status="completed")
        logger.update_call(call_log.call_sid, update_data)
        
        mock_analytics.assert_called_once()

    @patch('billing.CallLogger._trigger_analytics_update')
    def test_update_call_triggers_analytics_on_failure(self, mock_analytics, db_session, sample_call_log):
        """Test that analytics update is triggered when call fails."""
        logger = CallLogger(db_session)
        call_log = sample_call_log
        
        update_data = CallLogUpdate(status="failed")
        logger.update_call(call_log.call_sid, update_data)
        
        mock_analytics.assert_called_once()

    def test_end_call_success(self, db_session, sample_call_log):
        """Test successful call ending."""
        logger = CallLogger(db_session)
        call_log = sample_call_log
        
        end_time = call_log.start_time + timedelta(minutes=7)
        
        with patch.object(logger, '_update_phone_number_stats') as mock_phone_stats:
            with patch.object(logger, '_update_assistant_stats') as mock_assistant_stats:
                result = logger.end_call(
                    call_log.call_sid,
                    end_time,
                    status="completed",
                    hangup_cause="normal",
                    final_credits=12.5
                )
        
        assert result.status == "completed"
        assert result.hangup_cause == "normal"
        assert result.credits_consumed == 12.5
        assert result.end_time == end_time
        
        # Should update phone number stats
        mock_phone_stats.assert_called_once_with(result)
        
        # Should not update assistant stats if no assistant
        if result.assistant_id:
            mock_assistant_stats.assert_called_once_with(result)
        else:
            mock_assistant_stats.assert_not_called()

    def test_log_ai_metrics_success(self, db_session, sample_call_log):
        """Test successful AI metrics logging."""
        logger = CallLogger(db_session)
        call_log = sample_call_log
        
        result = logger.log_ai_metrics(
            call_log.call_sid,
            response_time_ms=250,
            confidence_score=0.85,
            interruptions=2,
            conversation_turns=15
        )
        
        assert result is True
        
        # Refresh and verify
        db_session.refresh(call_log)
        assert call_log.ai_response_time_ms == 250
        assert call_log.ai_confidence_avg == 0.85
        assert call_log.ai_interruptions == 2
        assert call_log.conversation_turns == 15

    def test_log_ai_metrics_call_not_found(self, db_session):
        """Test AI metrics logging with non-existent call."""
        logger = CallLogger(db_session)
        
        result = logger.log_ai_metrics(
            "non_existent_sid",
            response_time_ms=250,
            confidence_score=0.85
        )
        
        assert result is False

    def test_log_conversation_analytics_success(self, db_session, sample_call_log):
        """Test successful conversation analytics logging."""
        logger = CallLogger(db_session)
        call_log = sample_call_log
        
        keywords = ["pricing", "support", "technical"]
        result = logger.log_conversation_analytics(
            call_log.call_sid,
            sentiment_score=0.7,
            intent_detected="support_request",
            keywords=keywords,
            customer_satisfaction=4
        )
        
        assert result is True
        
        # Refresh and verify
        db_session.refresh(call_log)
        assert call_log.sentiment_score == 0.7
        assert call_log.intent_detected == "support_request"
        assert call_log.keywords_extracted == {"keywords": keywords}
        assert call_log.customer_satisfaction == 4

    def test_log_conversation_analytics_without_satisfaction(self, db_session, sample_call_log):
        """Test conversation analytics logging without customer satisfaction."""
        logger = CallLogger(db_session)
        call_log = sample_call_log
        
        result = logger.log_conversation_analytics(
            call_log.call_sid,
            sentiment_score=-0.3,
            intent_detected="complaint",
            keywords=["problem", "issue"]
        )
        
        assert result is True
        
        db_session.refresh(call_log)
        assert call_log.sentiment_score == -0.3
        assert call_log.intent_detected == "complaint"
        assert call_log.customer_satisfaction is None

    @patch('billing.CallLogger._update_analytics_snapshot')
    def test_trigger_analytics_update(self, mock_update_snapshot, db_session, sample_call_log):
        """Test analytics update triggering."""
        logger = CallLogger(db_session)
        call_log = sample_call_log
        
        logger._trigger_analytics_update(call_log)
        
        # Should call snapshot update with correct parameters
        mock_update_snapshot.assert_called_once_with(
            call_log.owner_id,
            call_log.start_time.date(),
            'daily'
        )


class TestCallLoggerStatisticsIntegration:
    """Test CallLogger integration with statistics and analytics."""

    def test_update_phone_number_stats_success(self, db_session, test_user):
        """Test phone number statistics update."""
        logger = CallLogger(db_session)
        
        # Create phone number with initial usage
        phone_number = PhoneNumber(
            number="+15551234567",
            owner_id=test_user.id,
            provider="test_provider",
            region="US",
            usage={"total_calls": 5, "total_minutes": 100.0, "monthly_cost": 10.50}
        )
        db_session.add(phone_number)
        db_session.commit()
        
        # Create completed call log
        call_log = CallLog(
            call_sid="test_call_stats",
            phone_number_id=phone_number.id,
            caller_number="+15559876543",
            called_number="+15551234567",
            direction="inbound",
            start_time=datetime.now(timezone.utc),
            end_time=datetime.now(timezone.utc) + timedelta(minutes=3),
            status="completed",
            duration_seconds=180,  # 3 minutes
            credits_consumed=5.5,
            cost_eur=0.055,
            owner_id=test_user.id
        )
        db_session.add(call_log)
        db_session.commit()
        
        logger._update_phone_number_stats(call_log)
        
        # Verify stats update
        db_session.refresh(phone_number)
        assert phone_number.usage["total_calls"] == 6  # 5 + 1
        assert phone_number.usage["total_minutes"] == 103.0  # 100 + 3
        assert phone_number.usage["monthly_cost"] == 10.555  # 10.50 + 0.055

    def test_update_phone_number_stats_failed_call(self, db_session, test_user):
        """Test phone number statistics update for failed call."""
        logger = CallLogger(db_session)
        
        # Create phone number
        phone_number = PhoneNumber(
            number="+15551234567",
            owner_id=test_user.id,
            provider="test_provider",
            region="US",
            usage={"total_calls": 10}
        )
        db_session.add(phone_number)
        db_session.commit()
        
        # Create failed call log
        call_log = CallLog(
            call_sid="test_call_failed",
            phone_number_id=phone_number.id,
            caller_number="+15559876543",
            called_number="+15551234567",
            direction="inbound",
            start_time=datetime.now(timezone.utc),
            status="failed",
            duration_seconds=0,
            credits_consumed=0,
            owner_id=test_user.id
        )
        db_session.add(call_log)
        db_session.commit()
        
        logger._update_phone_number_stats(call_log)
        
        # Should increment call count but not minutes/cost
        db_session.refresh(phone_number)
        assert phone_number.usage["total_calls"] == 11
        assert phone_number.usage.get("total_minutes", 0) == 0
        assert phone_number.usage.get("monthly_cost", 0) == 0

    def test_calculate_period_stats_single_day(self, db_session, test_user):
        """Test period statistics calculation for a single day."""
        logger = CallLogger(db_session)
        
        # Create test date
        test_date = datetime.now(timezone.utc).date()
        start_time = datetime.combine(test_date, datetime.min.time()).replace(tzinfo=timezone.utc)
        
        # Create multiple call logs for the day
        calls_data = [
            {"status": "completed", "duration": 120, "credits": 5.0},
            {"status": "completed", "duration": 180, "credits": 7.5},
            {"status": "failed", "duration": 0, "credits": 0},
            {"status": "busy", "duration": 0, "credits": 0},
        ]
        
        for i, call_data in enumerate(calls_data):
            call_log = CallLog(
                call_sid=f"test_call_{i}",
                phone_number_id=1,  # Assuming exists
                caller_number="+15559876543",
                called_number="+15551234567",
                direction="inbound",
                start_time=start_time + timedelta(hours=i),
                status=call_data["status"],
                duration_seconds=call_data["duration"],
                credits_consumed=call_data["credits"],
                cost_eur=call_data["credits"] * 0.01 * 0.92,
                owner_id=test_user.id
            )
            db_session.add(call_log)
        
        db_session.commit()
        
        stats = logger._calculate_period_stats(test_user.id, test_date, 'daily')
        
        assert stats['total_calls'] == 4
        assert stats['successful_calls'] == 2
        assert stats['failed_calls'] == 2  # failed + busy
        assert stats['total_duration'] == 300  # 120 + 180
        assert stats['total_credits_consumed'] == 12.5  # 5.0 + 7.5
        assert stats['avg_duration'] == 75.0  # 300 / 4

    def test_calculate_period_stats_no_calls(self, db_session, test_user):
        """Test period statistics calculation with no calls."""
        logger = CallLogger(db_session)
        
        test_date = datetime.now(timezone.utc).date()
        stats = logger._calculate_period_stats(test_user.id, test_date, 'daily')
        
        assert stats == {}  # No calls = empty stats


@pytest.fixture
def sample_call_log(db_session, test_user):
    """Create a sample call log for testing."""
    phone_number = PhoneNumber(
        number="+15551234567",
        owner_id=test_user.id,
        provider="test_provider",
        region="US",
        usage={}
    )
    db_session.add(phone_number)
    db_session.commit()
    
    call_log = CallLog(
        call_sid="sample_call_123",
        phone_number_id=phone_number.id,
        caller_number="+15559876543",
        called_number="+15551234567",
        direction="inbound",
        start_time=datetime.now(timezone.utc),
        status="in-progress",
        credits_consumed=0.0,
        owner_id=test_user.id
    )
    db_session.add(call_log)
    db_session.commit()
    
    return call_log