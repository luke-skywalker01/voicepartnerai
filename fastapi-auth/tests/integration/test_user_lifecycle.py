"""
Integration tests for complete user lifecycle
Tests the full user journey: registration → login → token validation → project creation
"""

import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from tests.conftest import assert_response_success, assert_response_error


class TestUserLifecycle:
    """Integration test suite for complete user lifecycle."""

    def test_complete_user_lifecycle_success(self, client: TestClient, db_session: Session):
        """
        Test complete user lifecycle in sequence:
        1. User registration
        2. User login
        3. Token validation (accessing protected endpoint)
        4. Workspace creation
        5. Assistant creation (as project)
        """
        user_email = "lifecycle_user@example.com"
        user_password = "securepassword123"
        
        # Step 1: User Registration
        registration_data = {
            "email": user_email,
            "password": user_password,
            "first_name": "Lifecycle",
            "last_name": "User"
        }
        
        register_response = client.post("/auth/register", json=registration_data)
        register_data = assert_response_success(register_response, 201)
        
        assert register_data["user"]["email"] == user_email
        assert register_data["user"]["first_name"] == "Lifecycle"
        assert register_data["user"]["last_name"] == "User"
        assert "access_token" in register_data
        assert register_data["token_type"] == "bearer"
        
        # Store token from registration
        access_token = register_data["access_token"]
        
        # Step 2: User Login (verify credentials work)
        login_data = {
            "username": user_email,
            "password": user_password
        }
        
        login_response = client.post("/auth/login", data=login_data)
        login_result = assert_response_success(login_response, 200)
        
        assert "access_token" in login_result
        assert login_result["token_type"] == "bearer"
        
        # Update token with fresh login token
        access_token = login_result["access_token"]
        auth_headers = {"Authorization": f"Bearer {access_token}"}
        
        # Step 3: Token Validation (access protected endpoint)
        profile_response = client.get("/auth/me", headers=auth_headers)
        profile_data = assert_response_success(profile_response, 200)
        
        assert profile_data["email"] == user_email
        assert profile_data["first_name"] == "Lifecycle"
        assert profile_data["last_name"] == "User"
        user_id = profile_data["id"]
        
        # Step 4: Workspace Creation
        workspace_data = {
            "name": "My Integration Test Workspace",
            "description": "A workspace created during integration testing",
            "plan": "free"
        }
        
        workspace_response = client.post("/workspaces/", json=workspace_data, headers=auth_headers)
        workspace_result = assert_response_success(workspace_response, 201)
        
        assert workspace_result["name"] == "My Integration Test Workspace"
        assert workspace_result["description"] == "A workspace created during integration testing"
        assert workspace_result["plan"] == "free"
        assert workspace_result["owner_id"] == user_id
        workspace_id = workspace_result["id"]
        
        # Step 5: Assistant Creation (Project Creation)
        assistant_data = {
            "name": "Integration Test Assistant",
            "description": "An assistant created during integration testing",
            "system_prompt": "You are a helpful assistant for integration testing.",
            "llm_model": "gpt-3.5-turbo",
            "temperature": 0.7,
            "voice_id": "test_voice",
            "language": "en-US",
            "first_message": "Hello! I'm your integration test assistant."
        }
        
        assistant_response = client.post(
            f"/workspaces/{workspace_id}/assistants",
            json=assistant_data,
            headers=auth_headers
        )
        assistant_result = assert_response_success(assistant_response, 201)
        
        assert assistant_result["name"] == "Integration Test Assistant"
        assert assistant_result["description"] == "An assistant created during integration testing"
        assert assistant_result["system_prompt"] == "You are a helpful assistant for integration testing."
        assert assistant_result["workspace_id"] == workspace_id
        assert assistant_result["owner_id"] == user_id
        
        # Step 6: Verify user can access their created resources
        # Get user's workspaces
        workspaces_response = client.get("/workspaces/", headers=auth_headers)
        workspaces_data = assert_response_success(workspaces_response, 200)
        
        assert len(workspaces_data) >= 1
        created_workspace = next(
            (ws for ws in workspaces_data if ws["id"] == workspace_id), 
            None
        )
        assert created_workspace is not None
        assert created_workspace["name"] == "My Integration Test Workspace"
        
        # Get workspace assistants
        assistants_response = client.get(
            f"/workspaces/{workspace_id}/assistants",
            headers=auth_headers
        )
        assistants_data = assert_response_success(assistants_response, 200)
        
        assert len(assistants_data) >= 1
        created_assistant = next(
            (ast for ast in assistants_data if ast["name"] == "Integration Test Assistant"),
            None
        )
        assert created_assistant is not None
        assert created_assistant["workspace_id"] == workspace_id

    def test_user_lifecycle_with_api_key_access(self, client: TestClient, db_session: Session):
        """
        Test user lifecycle including API key creation and usage:
        1. Register and login user
        2. Create workspace
        3. Create API key
        4. Use API key to access resources
        """
        user_email = "apikey_user@example.com"
        user_password = "securepassword456"
        
        # Step 1: Register user
        registration_data = {
            "email": user_email,
            "password": user_password,
            "first_name": "API",
            "last_name": "User"
        }
        
        register_response = client.post("/auth/register", json=registration_data)
        register_data = assert_response_success(register_response, 201)
        access_token = register_data["access_token"]
        auth_headers = {"Authorization": f"Bearer {access_token}"}
        
        # Step 2: Create workspace
        workspace_data = {
            "name": "API Test Workspace",
            "description": "Workspace for API key testing"
        }
        
        workspace_response = client.post("/workspaces/", json=workspace_data, headers=auth_headers)
        workspace_result = assert_response_success(workspace_response, 201)
        workspace_id = workspace_result["id"]
        
        # Step 3: Create API key
        api_key_data = {
            "name": "Integration Test API Key",
            "description": "API key for integration testing", 
            "scopes": ["read", "write"],
            "expires_in_days": 30
        }
        
        api_key_response = client.post(
            f"/workspaces/{workspace_id}/api-keys",
            json=api_key_data,
            headers=auth_headers
        )
        api_key_result = assert_response_success(api_key_response, 201)
        
        assert api_key_result["name"] == "Integration Test API Key"
        assert "api_key" in api_key_result
        assert api_key_result["scopes"] == ["read", "write"]
        
        created_api_key = api_key_result["api_key"] 
        api_key_headers = {"X-API-Key": created_api_key}
        
        # Step 4: Use API key to access workspace resources
        workspace_info_response = client.get(
            f"/workspaces/{workspace_id}",
            headers=api_key_headers
        )
        workspace_info = assert_response_success(workspace_info_response, 200)
        
        assert workspace_info["name"] == "API Test Workspace"
        assert workspace_info["id"] == workspace_id
        
        # Step 5: Create assistant using API key
        assistant_data = {
            "name": "API Created Assistant",
            "description": "Assistant created via API key",
            "system_prompt": "You are an assistant created via API key."
        }
        
        assistant_response = client.post(
            f"/workspaces/{workspace_id}/assistants",
            json=assistant_data,
            headers=api_key_headers
        )
        assistant_result = assert_response_success(assistant_response, 201)
        
        assert assistant_result["name"] == "API Created Assistant"
        assert assistant_result["workspace_id"] == workspace_id

    def test_user_lifecycle_with_team_collaboration(self, client: TestClient, db_session: Session):
        """
        Test user lifecycle with team collaboration:
        1. Owner creates workspace
        2. Owner invites member
        3. Member joins and accesses shared resources
        4. Both users can collaborate on projects
        """
        # Create owner user
        owner_email = "owner@example.com"
        owner_password = "ownerpassword123"
        
        owner_registration = {
            "email": owner_email,
            "password": owner_password,
            "first_name": "Team",
            "last_name": "Owner"
        }
        
        owner_response = client.post("/auth/register", json=owner_registration)
        owner_data = assert_response_success(owner_response, 201)
        owner_token = owner_data["access_token"]
        owner_headers = {"Authorization": f"Bearer {owner_token}"}
        
        # Create member user
        member_email = "member@example.com"
        member_password = "memberpassword123"
        
        member_registration = {
            "email": member_email,
            "password": member_password,
            "first_name": "Team",
            "last_name": "Member"
        }
        
        member_response = client.post("/auth/register", json=member_registration)
        member_data = assert_response_success(member_response, 201)
        member_token = member_data["access_token"]
        member_headers = {"Authorization": f"Bearer {member_token}"}
        
        # Owner creates workspace
        workspace_data = {
            "name": "Team Collaboration Workspace",
            "description": "Workspace for team collaboration testing"
        }
        
        workspace_response = client.post("/workspaces/", json=workspace_data, headers=owner_headers)
        workspace_result = assert_response_success(workspace_response, 201)
        workspace_id = workspace_result["id"]
        
        # Owner invites member
        invite_data = {
            "email": member_email,
            "role": "member"
        }
        
        invite_response = client.post(
            f"/workspaces/{workspace_id}/invite",
            json=invite_data,
            headers=owner_headers
        )
        invite_result = assert_response_success(invite_response, 201)
        
        assert invite_result["email"] == member_email
        assert invite_result["role"] == "member"
        
        # Member can now access workspace
        member_workspaces_response = client.get("/workspaces/", headers=member_headers)
        member_workspaces = assert_response_success(member_workspaces_response, 200)
        
        team_workspace = next(
            (ws for ws in member_workspaces if ws["id"] == workspace_id),
            None
        )
        assert team_workspace is not None
        assert team_workspace["name"] == "Team Collaboration Workspace"
        
        # Owner creates assistant
        owner_assistant_data = {
            "name": "Owner's Assistant",
            "description": "Assistant created by workspace owner",
            "system_prompt": "You are the owner's assistant."
        }
        
        owner_assistant_response = client.post(
            f"/workspaces/{workspace_id}/assistants",
            json=owner_assistant_data,
            headers=owner_headers
        )
        owner_assistant_result = assert_response_success(owner_assistant_response, 201)
        
        # Member creates assistant
        member_assistant_data = {
            "name": "Member's Assistant", 
            "description": "Assistant created by workspace member",
            "system_prompt": "You are the member's assistant."
        }
        
        member_assistant_response = client.post(
            f"/workspaces/{workspace_id}/assistants",
            json=member_assistant_data,
            headers=member_headers
        )
        member_assistant_result = assert_response_success(member_assistant_response, 201)
        
        # Both users can see all assistants in workspace
        owner_assistants_response = client.get(
            f"/workspaces/{workspace_id}/assistants",
            headers=owner_headers
        )
        owner_assistants = assert_response_success(owner_assistants_response, 200)
        
        member_assistants_response = client.get(
            f"/workspaces/{workspace_id}/assistants", 
            headers=member_headers
        )
        member_assistants = assert_response_success(member_assistants_response, 200)
        
        # Both should see both assistants
        assert len(owner_assistants) == 2
        assert len(member_assistants) == 2
        
        assistant_names = [ast["name"] for ast in owner_assistants]
        assert "Owner's Assistant" in assistant_names
        assert "Member's Assistant" in assistant_names

    def test_user_lifecycle_error_scenarios(self, client: TestClient, db_session: Session):
        """
        Test user lifecycle with various error scenarios:
        1. Invalid registration data
        2. Wrong login credentials
        3. Invalid tokens
        4. Unauthorized access attempts
        """
        # Test invalid registration
        invalid_registration = {
            "email": "invalid-email",  # Invalid email format
            "password": "123",  # Too short password
            "first_name": "",  # Empty name
            "last_name": ""
        }
        
        invalid_register_response = client.post("/auth/register", json=invalid_registration)
        assert_response_error(invalid_register_response, 422)  # Validation error
        
        # Register valid user for further tests
        valid_registration = {
            "email": "error_test@example.com",
            "password": "validpassword123",
            "first_name": "Error",
            "last_name": "Test"
        }
        
        register_response = client.post("/auth/register", json=valid_registration)
        register_data = assert_response_success(register_response, 201)
        
        # Test wrong login credentials
        wrong_login = {
            "username": "error_test@example.com",
            "password": "wrongpassword"
        }
        
        wrong_login_response = client.post("/auth/login", data=wrong_login)
        assert_response_error(wrong_login_response, 401)  # Unauthorized
        
        # Test invalid token access
        invalid_headers = {"Authorization": "Bearer invalid_token_12345"}
        
        profile_response = client.get("/auth/me", headers=invalid_headers)
        assert_response_error(profile_response, 401)  # Unauthorized
        
        # Test accessing protected resource without token
        no_token_response = client.get("/auth/me")
        assert_response_error(no_token_response, 401)  # Unauthorized
        
        # Test accessing non-existent workspace
        valid_token = register_data["access_token"]
        valid_headers = {"Authorization": f"Bearer {valid_token}"}
        
        nonexistent_workspace_response = client.get("/workspaces/99999", headers=valid_headers)
        assert_response_error(nonexistent_workspace_response, 404)  # Not found

    def test_user_lifecycle_with_phone_numbers_and_calls(self, client: TestClient, db_session: Session, mock_external_services):
        """
        Test complete user lifecycle including phone number management and call handling:
        1. Register user and create workspace
        2. Purchase phone number
        3. Create assistant and assign to phone number
        4. Simulate incoming call
        5. Log call metrics and billing
        """
        # Step 1: User registration and workspace creation
        user_email = "phone_user@example.com"
        user_password = "phonepassword123"
        
        registration_data = {
            "email": user_email,
            "password": user_password,
            "first_name": "Phone",
            "last_name": "User"
        }
        
        register_response = client.post("/auth/register", json=registration_data)
        register_data = assert_response_success(register_response, 201)
        access_token = register_data["access_token"]
        auth_headers = {"Authorization": f"Bearer {access_token}"}
        
        workspace_data = {
            "name": "Phone Testing Workspace",
            "description": "Workspace for phone number testing"
        }
        
        workspace_response = client.post("/workspaces/", json=workspace_data, headers=auth_headers)
        workspace_result = assert_response_success(workspace_response, 201)
        workspace_id = workspace_result["id"]
        
        # Step 2: Purchase phone number
        phone_number_data = {
            "region": "US",
            "area_code": "555"
        }
        
        phone_response = client.post(
            f"/workspaces/{workspace_id}/phone-numbers/purchase",
            json=phone_number_data,
            headers=auth_headers
        )
        phone_result = assert_response_success(phone_response, 201)
        
        assert phone_result["region"] == "US"
        assert phone_result["number"].startswith("+1555")
        phone_number_id = phone_result["id"]
        
        # Step 3: Create assistant
        assistant_data = {
            "name": "Phone Assistant",
            "description": "Assistant for handling phone calls",
            "system_prompt": "You are a helpful phone assistant.",
            "voice_id": "phone_voice"
        }
        
        assistant_response = client.post(
            f"/workspaces/{workspace_id}/assistants",
            json=assistant_data,
            headers=auth_headers
        )
        assistant_result = assert_response_success(assistant_response, 201)
        assistant_id = assistant_result["id"]
        
        # Step 4: Assign assistant to phone number
        assignment_data = {
            "assistant_id": assistant_id
        }
        
        assign_response = client.put(
            f"/workspaces/{workspace_id}/phone-numbers/{phone_number_id}/assistant",
            json=assignment_data,
            headers=auth_headers
        )
        assign_result = assert_response_success(assign_response, 200)
        
        assert assign_result["assistant_id"] == assistant_id
        
        # Step 5: Simulate incoming call (would be called by webhook)
        call_data = {
            "call_sid": "integration_test_call_123",
            "caller_number": "+15559876543",
            "called_number": phone_result["number"],
            "direction": "inbound",
            "status": "ringing"
        }
        
        call_response = client.post(
            f"/webhooks/twilio/call-start",
            json=call_data,
            headers={"Content-Type": "application/json"}
        )
        call_result = assert_response_success(call_response, 200)
        
        # Step 6: Update call with completion data
        call_update_data = {
            "status": "completed",
            "duration_seconds": 180,  # 3 minutes
            "credits_consumed": 5.5,
            "hangup_cause": "normal"
        }
        
        call_update_response = client.put(
            f"/webhooks/twilio/call-end/{call_data['call_sid']}",
            json=call_update_data,
            headers={"Content-Type": "application/json"}
        )
        call_update_result = assert_response_success(call_update_response, 200)
        
        # Step 7: Verify call appears in user's call logs
        call_logs_response = client.get(
            f"/workspaces/{workspace_id}/call-logs",
            headers=auth_headers
        )
        call_logs_data = assert_response_success(call_logs_response, 200)
        
        assert len(call_logs_data) >= 1
        test_call = next(
            (call for call in call_logs_data if call["call_sid"] == call_data["call_sid"]),
            None
        )
        assert test_call is not None
        assert test_call["status"] == "completed"
        assert test_call["duration_seconds"] == 180
        assert test_call["credits_consumed"] == 5.5

    def test_user_lifecycle_performance_and_limits(self, client: TestClient, db_session: Session):
        """
        Test user lifecycle under various performance conditions and limits:
        1. Create multiple resources rapidly
        2. Test rate limiting behavior
        3. Verify resource access patterns
        """
        # Register user
        user_email = "perf_user@example.com"
        user_password = "perfpassword123"
        
        registration_data = {
            "email": user_email,
            "password": user_password,
            "first_name": "Performance",
            "last_name": "User"
        }
        
        register_response = client.post("/auth/register", json=registration_data)
        register_data = assert_response_success(register_response, 201)
        access_token = register_data["access_token"]
        auth_headers = {"Authorization": f"Bearer {access_token}"}
        
        # Create workspace
        workspace_data = {
            "name": "Performance Test Workspace",
            "description": "Workspace for performance testing"
        }
        
        workspace_response = client.post("/workspaces/", json=workspace_data, headers=auth_headers)
        workspace_result = assert_response_success(workspace_response, 201)
        workspace_id = workspace_result["id"]
        
        # Create multiple assistants rapidly
        created_assistants = []
        for i in range(5):
            assistant_data = {
                "name": f"Performance Assistant {i+1}",
                "description": f"Assistant number {i+1} for performance testing",
                "system_prompt": f"You are assistant number {i+1}."
            }
            
            assistant_response = client.post(
                f"/workspaces/{workspace_id}/assistants",
                json=assistant_data,
                headers=auth_headers
            )
            
            if assistant_response.status_code == 201:
                assistant_result = assistant_response.json()
                created_assistants.append(assistant_result)
            elif assistant_response.status_code == 429:  # Rate limited
                break  # Expected behavior under high load
            else:
                # Unexpected error
                assert False, f"Unexpected response: {assistant_response.status_code}"
        
        # Should have created at least some assistants
        assert len(created_assistants) > 0
        
        # Verify all created assistants are accessible
        assistants_response = client.get(
            f"/workspaces/{workspace_id}/assistants",
            headers=auth_headers
        )
        assistants_data = assert_response_success(assistants_response, 200)
        
        assert len(assistants_data) == len(created_assistants)
        
        # Test concurrent access patterns
        import concurrent.futures
        import threading
        
        def access_assistant(assistant_id):
            response = client.get(
                f"/workspaces/{workspace_id}/assistants/{assistant_id}",
                headers=auth_headers
            )
            return response.status_code == 200
        
        # Test concurrent access to different assistants
        with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
            futures = [
                executor.submit(access_assistant, assistant["id"])
                for assistant in created_assistants[:3]  # Test first 3
            ]
            
            results = [future.result() for future in concurrent.futures.as_completed(futures)]
            
        # All concurrent accesses should succeed
        assert all(results), "Some concurrent accesses failed"