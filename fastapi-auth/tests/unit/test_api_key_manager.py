"""
Unit tests for API Key Manager
Tests the core business logic for API key management with mocked dependencies
"""

import pytest
import hashlib
from datetime import datetime, timezone, timedelta
from unittest.mock import Mock, patch
from sqlalchemy.orm import Session

from api_key_manager import APIKeyManager
from models import APIKey, APIKeyUsage, APIKeyScope, User, Workspace

class TestAPIKeyManager:
    """Test suite for APIKeyManager core functionality."""
    
    def test_generate_api_key_format(self):
        """Test that generated API keys follow the correct format."""
        api_key = APIKeyManager.generate_api_key()
        
        assert api_key.startswith("vp_live_")
        assert len(api_key) > 20  # Should be reasonably long
        
        # Generate multiple keys to ensure uniqueness
        keys = [APIKeyManager.generate_api_key() for _ in range(10)]
        assert len(set(keys)) == 10  # All keys should be unique

    def test_hash_api_key(self):
        """Test API key hashing functionality."""
        api_key = "vp_live_test123456789"
        hash1 = APIKeyManager.hash_api_key(api_key)
        hash2 = APIKeyManager.hash_api_key(api_key)
        
        # Same key should produce same hash
        assert hash1 == hash2
        
        # Hash should be deterministic and match expected format
        expected_hash = hashlib.sha256(api_key.encode()).hexdigest()
        assert hash1 == expected_hash
        
        # Different keys should produce different hashes
        different_key = "vp_live_different123"
        different_hash = APIKeyManager.hash_api_key(different_key)
        assert hash1 != different_hash

    def test_get_key_prefix(self):
        """Test key prefix extraction."""
        api_key = "vp_live_abcdef123456789"
        prefix = APIKeyManager.get_key_prefix(api_key)
        
        assert prefix == "vp_live_"
        assert len(prefix) == 8
        
        # Test with short key
        short_key = "short"
        short_prefix = APIKeyManager.get_key_prefix(short_key)
        assert short_prefix == "short"

    @patch('api_key_manager.WorkspacePermissions.user_has_permission')
    def test_create_api_key_success(self, mock_permission_check, db_session: Session, test_user: User, test_workspace: Workspace):
        """Test successful API key creation."""
        mock_permission_check.return_value = True
        
        result = APIKeyManager.create_api_key(
            db=db_session,
            user_id=test_user.id,
            workspace_id=test_workspace.id,
            name="Test Key",
            description="A test API key",
            scopes=[APIKeyScope.READ, APIKeyScope.WRITE]
        )
        
        # Verify result structure
        assert "id" in result
        assert "api_key" in result
        assert "key_prefix" in result
        assert result["name"] == "Test Key"
        assert result["description"] == "A test API key"
        assert result["scopes"] == ["read", "write"]
        assert result["is_active"] is True
        
        # Verify API key format
        api_key = result["api_key"]
        assert api_key.startswith("vp_live_")
        
        # Verify database record
        api_key_record = db_session.query(APIKey).filter(APIKey.id == result["id"]).first()
        assert api_key_record is not None
        assert api_key_record.name == "Test Key"
        assert api_key_record.user_id == test_user.id
        assert api_key_record.workspace_id == test_workspace.id
        assert api_key_record.is_active is True
        
        # Verify key is hashed in database
        expected_hash = APIKeyManager.hash_api_key(api_key)
        assert api_key_record.key_hash == expected_hash

    @patch('api_key_manager.WorkspacePermissions.user_has_permission')
    def test_create_api_key_permission_denied(self, mock_permission_check, db_session: Session, test_user: User, test_workspace: Workspace):
        """Test API key creation with insufficient permissions."""
        mock_permission_check.return_value = False
        
        with pytest.raises(ValueError, match="does not have permission"):
            APIKeyManager.create_api_key(
                db=db_session,
                user_id=test_user.id,
                workspace_id=test_workspace.id,
                name="Test Key"
            )

    def test_validate_api_key_valid(self, db_session: Session, test_api_key):
        """Test validation of a valid API key."""
        plain_key, api_key_record = test_api_key
        
        # Validate the key
        result = APIKeyManager.validate_api_key(db_session, plain_key)
        
        assert result is not None
        assert result.id == api_key_record.id
        assert result.is_active is True
        
        # Verify usage count increased
        db_session.refresh(result)
        assert result.usage_count > 0
        assert result.last_used_at is not None

    def test_validate_api_key_invalid(self, db_session: Session):
        """Test validation of an invalid API key."""
        invalid_key = "vp_live_invalid_key_123"
        result = APIKeyManager.validate_api_key(db_session, invalid_key)
        
        assert result is None

    def test_validate_api_key_expired(self, db_session: Session, test_user: User, test_workspace: Workspace):
        """Test validation of an expired API key."""
        # Create an expired API key
        with patch('api_key_manager.WorkspacePermissions.user_has_permission', return_value=True):
            expired_date = datetime.now(timezone.utc) - timedelta(days=1)
            result = APIKeyManager.create_api_key(
                db=db_session,
                user_id=test_user.id,
                workspace_id=test_workspace.id,
                name="Expired Key",
                expires_at=expired_date
            )
        
        # Try to validate expired key
        validation_result = APIKeyManager.validate_api_key(db_session, result["api_key"])
        assert validation_result is None

    def test_validate_api_key_inactive(self, db_session: Session, test_api_key):
        """Test validation of an inactive API key."""
        plain_key, api_key_record = test_api_key
        
        # Deactivate the key
        api_key_record.is_active = False
        db_session.commit()
        
        # Try to validate inactive key
        result = APIKeyManager.validate_api_key(db_session, plain_key)
        assert result is None

    def test_check_rate_limit_within_limits(self, db_session: Session, test_api_key):
        """Test rate limit checking when within limits."""
        _, api_key_record = test_api_key
        
        result = APIKeyManager.check_rate_limit(db_session, api_key_record)
        
        assert result["rate_limited"] is False
        assert result["limit_type"] is None
        assert "usage" in result
        assert "limits" in result
        assert "remaining" in result
        
        # Check that remaining counts are correct
        assert result["remaining"]["minute"] == api_key_record.rate_limit_per_minute
        assert result["remaining"]["hour"] == api_key_record.rate_limit_per_hour
        assert result["remaining"]["day"] == api_key_record.rate_limit_per_day

    def test_check_rate_limit_exceeded(self, db_session: Session, test_api_key):
        """Test rate limit checking when limits are exceeded."""
        _, api_key_record = test_api_key
        
        # Create usage records to exceed minute limit
        now = datetime.now(timezone.utc)
        for i in range(api_key_record.rate_limit_per_minute + 1):
            usage = APIKeyUsage(
                api_key_id=api_key_record.id,
                endpoint="/test",
                method="GET",
                status_code=200,
                timestamp=now
            )
            db_session.add(usage)
        db_session.commit()
        
        result = APIKeyManager.check_rate_limit(db_session, api_key_record)
        
        assert result["rate_limited"] is True
        assert result["limit_type"] == "minute"
        assert result["remaining"]["minute"] == 0

    def test_log_api_usage(self, db_session: Session, test_api_key):
        """Test API usage logging."""
        _, api_key_record = test_api_key
        
        APIKeyManager.log_api_usage(
            db=db_session,
            api_key_id=api_key_record.id,
            endpoint="/api/v1/assistants",
            method="GET",
            status_code=200,
            ip_address="192.168.1.1",
            user_agent="TestClient/1.0",
            response_time_ms=150,
            tokens_used=25,
            credits_consumed=0.5
        )
        
        # Verify usage record was created
        usage_record = db_session.query(APIKeyUsage).filter(
            APIKeyUsage.api_key_id == api_key_record.id
        ).first()
        
        assert usage_record is not None
        assert usage_record.endpoint == "/api/v1/assistants"
        assert usage_record.method == "GET"
        assert usage_record.status_code == 200
        assert usage_record.ip_address == "192.168.1.1"
        assert usage_record.response_time_ms == 150
        assert usage_record.tokens_used == 25
        assert usage_record.credits_consumed == 0.5

    def test_get_user_api_keys(self, db_session: Session, test_user: User, test_workspace: Workspace):
        """Test retrieving user's API keys."""
        # Create multiple API keys
        with patch('api_key_manager.WorkspacePermissions.user_has_permission', return_value=True):
            key1 = APIKeyManager.create_api_key(
                db=db_session,
                user_id=test_user.id,
                workspace_id=test_workspace.id,
                name="Key 1"
            )
            key2 = APIKeyManager.create_api_key(
                db=db_session,
                user_id=test_user.id,
                workspace_id=test_workspace.id,
                name="Key 2"
            )
        
        # Retrieve keys
        result = APIKeyManager.get_user_api_keys(db_session, test_user.id, test_workspace.id)
        
        assert len(result) == 2
        key_names = [key["name"] for key in result]
        assert "Key 1" in key_names
        assert "Key 2" in key_names
        
        # Verify no actual keys are returned
        for key in result:
            assert "api_key" not in key
            assert "key_prefix" in key
            assert key["key_prefix"].startswith("vp_live_")

    @patch('api_key_manager.WorkspacePermissions.user_has_permission')
    def test_revoke_api_key_success(self, mock_permission_check, db_session: Session, test_api_key, test_user: User, test_workspace: Workspace):
        """Test successful API key revocation."""
        mock_permission_check.return_value = True
        _, api_key_record = test_api_key
        
        result = APIKeyManager.revoke_api_key(
            db=db_session,
            api_key_id=api_key_record.id,
            user_id=test_user.id,
            workspace_id=test_workspace.id
        )
        
        assert result is True
        
        # Verify key is deactivated
        db_session.refresh(api_key_record)
        assert api_key_record.is_active is False
        assert api_key_record.updated_at is not None

    def test_revoke_api_key_not_found(self, db_session: Session, test_user: User, test_workspace: Workspace):
        """Test revoking non-existent API key."""
        result = APIKeyManager.revoke_api_key(
            db=db_session,
            api_key_id=99999,  # Non-existent ID
            user_id=test_user.id,
            workspace_id=test_workspace.id
        )
        
        assert result is False

    @patch('api_key_manager.WorkspacePermissions.user_has_permission')
    def test_update_api_key_success(self, mock_permission_check, db_session: Session, test_api_key, test_user: User, test_workspace: Workspace):
        """Test successful API key update."""
        mock_permission_check.return_value = True
        _, api_key_record = test_api_key
        
        result = APIKeyManager.update_api_key(
            db=db_session,
            api_key_id=api_key_record.id,
            user_id=test_user.id,
            workspace_id=test_workspace.id,
            name="Updated Name",
            description="Updated description",
            scopes=[APIKeyScope.READ],
            rate_limit_per_minute=30
        )
        
        assert result is True
        
        # Verify updates
        db_session.refresh(api_key_record)
        assert api_key_record.name == "Updated Name"
        assert api_key_record.description == "Updated description"
        assert api_key_record.scopes == ["read"]
        assert api_key_record.rate_limit_per_minute == 30

    def test_check_ip_restriction_no_restrictions(self, test_api_key):
        """Test IP restriction checking when no restrictions are set."""
        _, api_key_record = test_api_key
        api_key_record.allowed_ips = None
        
        result = APIKeyManager.check_ip_restriction(api_key_record, "192.168.1.1")
        assert result is True

    def test_check_ip_restriction_allowed_ip(self, test_api_key):
        """Test IP restriction checking with allowed IP."""
        _, api_key_record = test_api_key
        api_key_record.allowed_ips = ["192.168.1.1", "10.0.0.1"]
        
        result = APIKeyManager.check_ip_restriction(api_key_record, "192.168.1.1")
        assert result is True

    def test_check_ip_restriction_blocked_ip(self, test_api_key):
        """Test IP restriction checking with blocked IP."""
        _, api_key_record = test_api_key
        api_key_record.allowed_ips = ["192.168.1.1", "10.0.0.1"]
        
        result = APIKeyManager.check_ip_restriction(api_key_record, "192.168.1.100")
        assert result is False

    @patch('api_key_manager.WorkspacePermissions.user_has_permission')
    def test_get_api_key_usage_stats(self, mock_permission_check, db_session: Session, test_api_key, test_user: User, test_workspace: Workspace):
        """Test getting API key usage statistics."""
        mock_permission_check.return_value = True
        _, api_key_record = test_api_key
        
        # Create some usage records
        now = datetime.now(timezone.utc)
        for i in range(5):
            usage = APIKeyUsage(
                api_key_id=api_key_record.id,
                endpoint=f"/api/v1/test/{i}",
                method="GET",
                status_code=200 if i < 4 else 400,  # 4 successful, 1 error
                response_time_ms=100 + i * 10,
                tokens_used=10,
                credits_consumed=0.1,
                timestamp=now
            )
            db_session.add(usage)
        db_session.commit()
        
        result = APIKeyManager.get_api_key_usage_stats(
            db=db_session,
            api_key_id=api_key_record.id,
            user_id=test_user.id,
            workspace_id=test_workspace.id,
            days=30
        )
        
        assert result["total_requests"] == 5
        assert result["successful_requests"] == 4
        assert result["error_requests"] == 1
        assert result["success_rate"] == 80.0
        assert result["total_tokens_used"] == 50
        assert result["total_credits_consumed"] == 0.5
        assert result["average_response_time_ms"] > 0
        assert len(result["endpoint_breakdown"]) > 0

    def test_create_api_key_with_expiration(self, db_session: Session, test_user: User, test_workspace: Workspace):
        """Test creating API key with expiration date."""
        with patch('api_key_manager.WorkspacePermissions.user_has_permission', return_value=True):
            expires_at = datetime.now(timezone.utc) + timedelta(days=30)
            result = APIKeyManager.create_api_key(
                db=db_session,
                user_id=test_user.id,
                workspace_id=test_workspace.id,
                name="Expiring Key",
                expires_at=expires_at
            )
        
        assert result["expires_at"] == expires_at.isoformat()
        
        # Verify in database
        api_key_record = db_session.query(APIKey).filter(APIKey.id == result["id"]).first()
        assert api_key_record.expires_at == expires_at

    def test_create_api_key_with_custom_rate_limits(self, db_session: Session, test_user: User, test_workspace: Workspace):
        """Test creating API key with custom rate limits."""
        with patch('api_key_manager.WorkspacePermissions.user_has_permission', return_value=True):
            result = APIKeyManager.create_api_key(
                db=db_session,
                user_id=test_user.id,
                workspace_id=test_workspace.id,
                name="Custom Limits Key",
                rate_limit_per_minute=120,
                rate_limit_per_hour=5000,
                rate_limit_per_day=50000
            )
        
        assert result["rate_limits"]["per_minute"] == 120
        assert result["rate_limits"]["per_hour"] == 5000
        assert result["rate_limits"]["per_day"] == 50000

    def test_create_api_key_with_ip_restrictions(self, db_session: Session, test_user: User, test_workspace: Workspace):
        """Test creating API key with IP restrictions."""
        with patch('api_key_manager.WorkspacePermissions.user_has_permission', return_value=True):
            allowed_ips = ["192.168.1.1", "10.0.0.1"]
            result = APIKeyManager.create_api_key(
                db=db_session,
                user_id=test_user.id,
                workspace_id=test_workspace.id,
                name="IP Restricted Key",
                allowed_ips=allowed_ips
            )
        
        assert result["allowed_ips"] == allowed_ips