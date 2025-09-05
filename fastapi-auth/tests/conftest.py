"""
Pytest configuration and fixtures for VoicePartnerAI tests
"""

import os
import pytest
import asyncio
from typing import Generator, AsyncGenerator
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
import tempfile

# Set test environment variables before importing our modules
os.environ["TESTING"] = "true"
os.environ["DATABASE_URL"] = "sqlite:///./test_voicepartnerai.db"
os.environ["SECRET_KEY"] = "test_secret_key_for_testing_only"

# Import after setting environment variables
from database import Base, get_db
from main_with_error_handling import app
from models import User, Workspace, WorkspaceMember, WorkspaceRole, APIKey
from auth import create_access_token, get_password_hash
from api_key_manager import APIKeyManager

# Test database configuration
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_voicepartnerai.db"

# Create test engine with in-memory SQLite for speed
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={
        "check_same_thread": False,
        "isolation_level": None  # Autocommit mode for testing
    },
    poolclass=StaticPool,
    echo=False  # Set to True for SQL debugging
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="function")
def db_session() -> Generator[Session, None, None]:
    """
    Create a fresh database session for each test.
    Automatically rolls back all changes after the test.
    """
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture(scope="function")
def client(db_session: Session) -> Generator[TestClient, None, None]:
    """
    Create a test client with dependency overrides.
    """
    def override_get_db():
        try:
            yield db_session
        finally:
            pass  # Session cleanup handled by db_session fixture
    
    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as test_client:
        yield test_client
    
    app.dependency_overrides.clear()

@pytest.fixture
def test_user(db_session: Session) -> User:
    """Create a test user in the database."""
    user = User(
        email="test@example.com",
        hashed_password=get_password_hash("testpassword123"),
        first_name="Test",
        last_name="User"
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture
def test_workspace(db_session: Session, test_user: User) -> Workspace:
    """Create a test workspace."""
    workspace = Workspace(
        name="Test Workspace",
        slug="test-workspace",
        description="A workspace for testing",
        plan="free"
    )
    db_session.add(workspace)
    db_session.commit()
    db_session.refresh(workspace)
    
    # Add user as owner
    membership = WorkspaceMember(
        user_id=test_user.id,
        workspace_id=workspace.id,
        role=WorkspaceRole.OWNER,
        is_active=True
    )
    db_session.add(membership)
    db_session.commit()
    
    return workspace

@pytest.fixture
def test_user_token(test_user: User) -> str:
    """Create a JWT token for the test user."""
    return create_access_token(data={"sub": test_user.email})

@pytest.fixture
def auth_headers(test_user_token: str) -> dict:
    """Create authorization headers with JWT token."""
    return {"Authorization": f"Bearer {test_user_token}"}

@pytest.fixture
def test_api_key(db_session: Session, test_user: User, test_workspace: Workspace) -> tuple[str, APIKey]:
    """Create a test API key and return both the plain key and the record."""
    api_key_data = APIKeyManager.create_api_key(
        db=db_session,
        user_id=test_user.id,
        workspace_id=test_workspace.id,
        name="Test API Key",
        description="API key for testing",
        scopes=["read", "write"]
    )
    
    # Get the API key record
    api_key_record = db_session.query(APIKey).filter(
        APIKey.id == api_key_data["id"]
    ).first()
    
    return api_key_data["api_key"], api_key_record

@pytest.fixture
def api_key_headers(test_api_key: tuple[str, APIKey]) -> dict:
    """Create headers with API key authentication."""
    api_key, _ = test_api_key
    return {"X-API-Key": api_key}

@pytest.fixture
def sample_assistant_data() -> dict:
    """Sample data for creating an assistant."""
    return {
        "name": "Test Assistant",
        "description": "An assistant for testing",
        "system_prompt": "You are a helpful test assistant.",
        "llm_model": "gpt-3.5-turbo",
        "temperature": 0.7,
        "voice_id": "test_voice_id",
        "language": "en-US",
        "first_message": "Hello, I'm your test assistant!"
    }

@pytest.fixture
def sample_project_data() -> dict:
    """Sample data for creating a project."""
    return {
        "title": "Test Project",
        "description": "A project for testing purposes"
    }

@pytest.fixture
def mock_external_services():
    """Mock external services to avoid real API calls during tests."""
    import unittest.mock as mock
    
    # Mock OpenAI
    with mock.patch('external_services.OpenAIService') as mock_openai:
        mock_openai.return_value.create_chat_completion.return_value = {
            "content": "This is a test response",
            "usage": {
                "prompt_tokens": 10,
                "completion_tokens": 15,
                "total_tokens": 25
            },
            "model": "gpt-3.5-turbo",
            "finish_reason": "stop"
        }
        
        # Mock Twilio
        with mock.patch('external_services.TwilioService') as mock_twilio:
            mock_twilio.return_value.create_call.return_value = {
                "call_sid": "test_call_sid_123",
                "status": "queued",
                "to": "+15551234567",
                "from": "+15559876543",
                "date_created": "2024-01-15T10:30:00Z"
            }
            
            # Mock Stripe
            with mock.patch('external_services.StripeService') as mock_stripe:
                mock_stripe.return_value.create_payment_intent.return_value = {
                    "payment_intent_id": "pi_test_123",
                    "client_secret": "pi_test_123_secret",
                    "status": "requires_payment_method",
                    "amount": 1000,
                    "currency": "eur"
                }
                
                # Mock ElevenLabs
                with mock.patch('external_services.ElevenLabsService') as mock_elevenlabs:
                    mock_elevenlabs.return_value.text_to_speech.return_value = b"fake_audio_data"
                    
                    yield {
                        "openai": mock_openai,
                        "twilio": mock_twilio,
                        "stripe": mock_stripe,
                        "elevenlabs": mock_elevenlabs
                    }

# Custom pytest markers and utilities

class TestDataFactory:
    """Factory for creating test data objects."""
    
    @staticmethod
    def create_user_data(email: str = None, password: str = None) -> dict:
        """Create user registration data."""
        return {
            "email": email or "newuser@example.com",
            "password": password or "securepassword123",
            "first_name": "New",
            "last_name": "User"
        }
    
    @staticmethod
    def create_workspace_data(name: str = None) -> dict:
        """Create workspace creation data."""
        return {
            "name": name or "New Workspace",
            "description": "A new workspace for testing",
            "plan": "free"
        }
    
    @staticmethod
    def create_api_key_data(name: str = None) -> dict:
        """Create API key creation data."""
        return {
            "name": name or "Test API Key",
            "description": "API key for testing",
            "scopes": ["read", "write"],
            "rate_limit_per_minute": 60,
            "expires_in_days": 365
        }

@pytest.fixture
def test_data_factory() -> TestDataFactory:
    """Provide test data factory."""
    return TestDataFactory()

# Database utilities for tests

def create_test_data(db_session: Session, model_class, **kwargs):
    """Helper function to create test data."""
    instance = model_class(**kwargs)
    db_session.add(instance)
    db_session.commit()
    db_session.refresh(instance)
    return instance

def count_records(db_session: Session, model_class) -> int:
    """Helper function to count records of a specific model."""
    return db_session.query(model_class).count()

# Assertion helpers

def assert_response_success(response, expected_status=200):
    """Assert that a response is successful with expected status."""
    assert response.status_code == expected_status, f"Expected {expected_status}, got {response.status_code}. Response: {response.text}"
    
    if response.headers.get("content-type", "").startswith("application/json"):
        data = response.json()
        assert data.get("success") is True, f"Response not successful: {data}"
        return data
    
    return response

def assert_response_error(response, expected_status=400):
    """Assert that a response is an error with expected status."""
    assert response.status_code == expected_status, f"Expected {expected_status}, got {response.status_code}. Response: {response.text}"
    
    if response.headers.get("content-type", "").startswith("application/json"):
        data = response.json()
        assert data.get("success") is False, f"Response should be an error: {data}"
        assert "error" in data, f"Error details missing: {data}"
        return data
    
    return response

# Test environment setup and teardown

@pytest.fixture(autouse=True, scope="session")
def setup_test_environment():
    """Set up test environment before running tests."""
    # Create test database directory if it doesn't exist
    os.makedirs("tests", exist_ok=True)
    
    # Set environment variables for testing
    os.environ["TESTING"] = "true"
    os.environ["LOG_LEVEL"] = "WARNING"  # Reduce log noise during tests
    
    yield
    
    # Cleanup after all tests
    try:
        os.remove("test_voicepartnerai.db")
    except FileNotFoundError:
        pass

@pytest.fixture(autouse=True)
def cleanup_after_test():
    """Clean up after each test."""
    yield
    # Any per-test cleanup can go here

# Performance and debugging utilities

@pytest.fixture
def performance_monitor():
    """Monitor test performance."""
    import time
    
    class PerformanceMonitor:
        def __init__(self):
            self.start_time = None
            self.end_time = None
        
        def start(self):
            self.start_time = time.time()
        
        def stop(self):
            self.end_time = time.time()
        
        @property
        def duration(self):
            if self.start_time and self.end_time:
                return self.end_time - self.start_time
            return None
    
    return PerformanceMonitor()

# Async test utilities

@pytest.fixture
async def async_client(db_session: Session) -> AsyncGenerator:
    """Async test client for testing async endpoints."""
    from httpx import AsyncClient
    
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac
    
    app.dependency_overrides.clear()

# Export commonly used fixtures and utilities
__all__ = [
    "db_session",
    "client", 
    "test_user",
    "test_workspace",
    "test_user_token",
    "auth_headers",
    "test_api_key",
    "api_key_headers",
    "sample_assistant_data",
    "sample_project_data",
    "mock_external_services",
    "test_data_factory",
    "create_test_data",
    "count_records",
    "assert_response_success",
    "assert_response_error",
    "performance_monitor",
    "async_client"
]