#!/usr/bin/env python
"""
Test script for JWT authentication in Beacon backend
Run this after starting the backend server
"""

import requests
import json

# Configuration
BASE_URL = "http://localhost:8001"
API_BASE = f"{BASE_URL}/api"

def test_health_check():
    """Test the health check endpoint"""
    print("🔍 Testing health check...")
    try:
        response = requests.get(f"{API_BASE}/health/")
        if response.status_code == 200:
            print("✅ Health check passed")
            print(f"   Response: {response.json()}")
        else:
            print(f"❌ Health check failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Health check error: {e}")
    print()

def test_user_registration():
    """Test user registration"""
    print("🔍 Testing user registration...")
    user_data = {
        "username": "testuser",
        "email": "test@beacon.com",
        "password": "testpass123",
        "confirm_password": "testpass123",
        "first_name": "Test",
        "last_name": "User"
    }
    
    try:
        response = requests.post(f"{API_BASE}/auth/register/", json=user_data)
        if response.status_code == 201:
            print("✅ User registration passed")
            data = response.json()
            print(f"   User ID: {data['user']['id']}")
            print(f"   Access Token: {data['tokens']['access'][:50]}...")
            return data['tokens']['access']
        else:
            print(f"❌ User registration failed: {response.status_code}")
            print(f"   Error: {response.text}")
            return None
    except Exception as e:
        print(f"❌ User registration error: {e}")
        return None
    print()

def test_user_login():
    """Test user login"""
    print("🔍 Testing user login...")
    login_data = {
        "email": "test@beacon.com",
        "password": "testpass123"
    }
    
    try:
        response = requests.post(f"{API_BASE}/auth/login/", json=login_data)
        if response.status_code == 200:
            print("✅ User login passed")
            data = response.json()
            print(f"   User ID: {data['user']['id']}")
            print(f"   Access Token: {data['tokens']['access'][:50]}...")
            return data['tokens']['access']
        else:
            print(f"❌ User login failed: {response.status_code}")
            print(f"   Error: {response.text}")
            return None
    except Exception as e:
        print(f"❌ User login error: {e}")
        return None
    print()

def test_protected_endpoint(access_token):
    """Test accessing a protected endpoint"""
    print("🔍 Testing protected endpoint...")
    headers = {"Authorization": f"Bearer {access_token}"}
    
    try:
        response = requests.get(f"{API_BASE}/auth/profile/", headers=headers)
        if response.status_code == 200:
            print("✅ Protected endpoint access passed")
            data = response.json()
            print(f"   User: {data['username']} ({data['email']})")
        else:
            print(f"❌ Protected endpoint access failed: {response.status_code}")
            print(f"   Error: {response.text}")
    except Exception as e:
        print(f"❌ Protected endpoint error: {e}")
    print()

def test_incidents_endpoint(access_token):
    """Test incidents endpoint"""
    print("🔍 Testing incidents endpoint...")
    headers = {"Authorization": f"Bearer {access_token}"}
    
    try:
        response = requests.get(f"{API_BASE}/incidents/", headers=headers)
        if response.status_code == 200:
            print("✅ Incidents endpoint access passed")
            data = response.json()
            print(f"   Incidents count: {len(data)}")
        else:
            print(f"❌ Incidents endpoint access failed: {response.status_code}")
            print(f"   Error: {response.text}")
    except Exception as e:
        print(f"❌ Incidents endpoint error: {e}")
    print()

def test_unauthorized_access():
    """Test accessing protected endpoint without token"""
    print("🔍 Testing unauthorized access...")
    
    try:
        response = requests.get(f"{API_BASE}/auth/profile/")
        if response.status_code == 401:
            print("✅ Unauthorized access properly blocked")
        else:
            print(f"❌ Unauthorized access not properly blocked: {response.status_code}")
    except Exception as e:
        print(f"❌ Unauthorized access test error: {e}")
    print()

def main():
    """Run all tests"""
    print("🚀 Starting JWT Authentication Tests")
    print("=" * 50)
    
    # Test health check
    test_health_check()
    
    # Test user registration
    access_token = test_user_registration()
    
    if access_token:
        # Test protected endpoints
        test_protected_endpoint(access_token)
        test_incidents_endpoint(access_token)
    else:
        # Try login instead
        access_token = test_user_login()
        if access_token:
            test_protected_endpoint(access_token)
            test_incidents_endpoint(access_token)
    
    # Test unauthorized access
    test_unauthorized_access()
    
    print("=" * 50)
    print("🏁 JWT Authentication Tests Completed")

if __name__ == "__main__":
    main()
