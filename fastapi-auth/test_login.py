"""
Direct API Test für Login
"""
import requests
import json

# Server URL
BASE_URL = "http://127.0.0.1:8005"

def test_registration():
    """Test user registration"""
    print("=== TESTING REGISTRATION ===")
    
    user_data = {
        "email": "apitest@test.com",
        "password": "apitest123",
        "first_name": "API",
        "last_name": "Test"
    }
    
    response = requests.post(f"{BASE_URL}/api/auth/register", json=user_data)
    print(f"Registration Status: {response.status_code}")
    print(f"Registration Response: {response.json()}")
    return response.status_code == 200

def test_login():
    """Test user login"""
    print("\n=== TESTING LOGIN ===")
    
    login_data = {
        "username": "apitest@test.com",
        "password": "apitest123"
    }
    
    response = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
    print(f"Login Status: {response.status_code}")
    print(f"Login Response: {response.json()}")
    return response.status_code == 200

def test_debug():
    """Check debug endpoint"""
    print("\n=== CHECKING DEBUG ===")
    
    response = requests.get(f"{BASE_URL}/api/auth/debug")
    print(f"Debug Status: {response.status_code}")
    print(f"Debug Response: {response.json()}")

if __name__ == "__main__":
    print("DIRECT API TESTING")
    print("=" * 40)
    
    # Test registration
    reg_success = test_registration()
    
    # Test login
    login_success = test_login()
    
    # Check debug
    test_debug()
    
    print("\n" + "=" * 40)
    print(f"Registration Success: {reg_success}")
    print(f"Login Success: {login_success}")
    
    if reg_success and login_success:
        print("API WORKS PERFECTLY!")
    else:
        print("API HAS ISSUES")