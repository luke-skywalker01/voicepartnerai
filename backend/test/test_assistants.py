"""
Test Suite for VoicePartnerAI Assistant Management
"""

import pytest
import httpx
import asyncio
from datetime import datetime

# Test Configuration
BASE_URL = "http://localhost:8000"
TEST_ASSISTANT_DATA = {
    "name": "Test Assistant",
    "template": "customer-support",
    "first_message": "Hello! How can I help you today?",
    "system_prompt": "You are a helpful customer support assistant.",
    "voice_model": "eleven-labs",
    "language": "en-US"
}

class TestAssistantAPI:
    """Test cases for Assistant API endpoints"""
    
    def setup_method(self):
        """Setup for each test method"""
        self.client = httpx.AsyncClient(base_url=BASE_URL)
        self.created_assistants = []
    
    def teardown_method(self):
        """Cleanup after each test method"""
        asyncio.run(self._cleanup_assistants())
    
    async def _cleanup_assistants(self):
        """Clean up created assistants"""
        for assistant_id in self.created_assistants:
            try:
                await self.client.delete(f"/api/assistants/{assistant_id}")
            except:
                pass
        await self.client.aclose()
    
    @pytest.mark.asyncio
    async def test_health_check(self):
        """Test API health endpoint"""
        response = await self.client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data
    
    @pytest.mark.asyncio
    async def test_create_assistant(self):
        """Test creating a new assistant"""
        response = await self.client.post("/api/assistants", json=TEST_ASSISTANT_DATA)
        assert response.status_code == 200
        
        data = response.json()
        assert data["name"] == TEST_ASSISTANT_DATA["name"]
        assert data["template"] == TEST_ASSISTANT_DATA["template"]
        assert data["status"] == "active"
        assert "id" in data
        assert "created_at" in data
        
        self.created_assistants.append(data["id"])
    
    @pytest.mark.asyncio
    async def test_get_assistants(self):
        """Test getting all assistants"""
        # Create a test assistant first
        create_response = await self.client.post("/api/assistants", json=TEST_ASSISTANT_DATA)
        assistant_id = create_response.json()["id"]
        self.created_assistants.append(assistant_id)
        
        # Get all assistants
        response = await self.client.get("/api/assistants")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        
        # Find our created assistant
        found_assistant = next((a for a in data if a["id"] == assistant_id), None)
        assert found_assistant is not None
        assert found_assistant["name"] == TEST_ASSISTANT_DATA["name"]
    
    @pytest.mark.asyncio
    async def test_get_assistant_by_id(self):
        """Test getting a specific assistant by ID"""
        # Create a test assistant
        create_response = await self.client.post("/api/assistants", json=TEST_ASSISTANT_DATA)
        assistant_id = create_response.json()["id"]
        self.created_assistants.append(assistant_id)
        
        # Get assistant by ID
        response = await self.client.get(f"/api/assistants/{assistant_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["id"] == assistant_id
        assert data["name"] == TEST_ASSISTANT_DATA["name"]
    
    @pytest.mark.asyncio
    async def test_update_assistant(self):
        """Test updating an assistant"""
        # Create a test assistant
        create_response = await self.client.post("/api/assistants", json=TEST_ASSISTANT_DATA)
        assistant_id = create_response.json()["id"]
        self.created_assistants.append(assistant_id)
        
        # Update the assistant
        updated_data = {**TEST_ASSISTANT_DATA, "name": "Updated Test Assistant"}
        response = await self.client.put(f"/api/assistants/{assistant_id}", json=updated_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["name"] == "Updated Test Assistant"
        assert data["id"] == assistant_id
    
    @pytest.mark.asyncio
    async def test_delete_assistant(self):
        """Test deleting an assistant"""
        # Create a test assistant
        create_response = await self.client.post("/api/assistants", json=TEST_ASSISTANT_DATA)
        assistant_id = create_response.json()["id"]
        
        # Delete the assistant
        response = await self.client.delete(f"/api/assistants/{assistant_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert "message" in data
        
        # Verify it's deleted
        get_response = await self.client.get(f"/api/assistants/{assistant_id}")
        assert get_response.status_code == 404
    
    @pytest.mark.asyncio
    async def test_test_assistant(self):
        """Test the assistant testing endpoint"""
        # Create a test assistant
        create_response = await self.client.post("/api/assistants", json=TEST_ASSISTANT_DATA)
        assistant_id = create_response.json()["id"]
        self.created_assistants.append(assistant_id)
        
        # Test the assistant
        response = await self.client.post(f"/api/assistants/{assistant_id}/test")
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "test_completed"
        assert data["assistant_id"] == assistant_id
        assert "test_result" in data
        assert data["test_result"]["first_message_played"] == TEST_ASSISTANT_DATA["first_message"]
    
    @pytest.mark.asyncio
    async def test_invalid_assistant_id(self):
        """Test error handling for invalid assistant ID"""
        invalid_id = "non-existent-id"
        response = await self.client.get(f"/api/assistants/{invalid_id}")
        assert response.status_code == 404
    
    @pytest.mark.asyncio
    async def test_create_assistant_validation(self):
        """Test assistant creation with invalid data"""
        invalid_data = {"name": ""}  # Missing required fields
        response = await self.client.post("/api/assistants", json=invalid_data)
        assert response.status_code == 422  # Validation error

@pytest.mark.asyncio
async def test_analytics_endpoint():
    """Test analytics overview endpoint"""
    async with httpx.AsyncClient(base_url=BASE_URL) as client:
        response = await client.get("/api/analytics/overview")
        assert response.status_code == 200
        
        data = response.json()
        assert "total_assistants" in data
        assert "active_assistants" in data
        assert "success_rate" in data
        assert isinstance(data["top_templates"], list)

if __name__ == "__main__":
    pytest.main([__file__, "-v"])