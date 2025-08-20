#!/usr/bin/env python3
"""
Test script for Beacon Location Server
Tests basic functionality including location updates and panic alerts
"""

import requests
import json
import time
import sys

# Configuration
LOCATION_SERVER_URL = "http://localhost:3001"
TEST_USER_ID = 1

def test_health_check():
    """Test server health endpoint"""
    print("Testing health check...")
    try:
        response = requests.get(f"{LOCATION_SERVER_URL}/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Health check passed: {data['status']}")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False

def test_location_update():
    """Test location update endpoint"""
    print("\nTesting location update...")
    try:
        location_data = {
            "userId": TEST_USER_ID,
            "latitude": 37.7749,
            "longitude": -122.4194,
            "accuracy": 10.5,
            "altitude": 100.0,
            "speed": 5.2,
            "heading": 180.0,
            "provider": "gps",
            "batteryLevel": 85,
            "deviceInfo": {"platform": "test", "version": "1.0.0"},
            "networkInfo": {"type": "wifi", "strength": "strong"}
        }
        
        response = requests.post(
            f"{LOCATION_SERVER_URL}/api/location/update",
            json=location_data,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Location update successful: {data['success']}")
            return True
        else:
            print(f"❌ Location update failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Location update error: {e}")
        return False

def test_panic_alert():
    """Test panic alert endpoint"""
    print("\nTesting panic alert...")
    try:
        alert_data = {
            "userId": TEST_USER_ID,
            "latitude": 37.7749,
            "longitude": -122.4194,
            "accuracy": 10.5,
            "alertType": "panic_button",
            "description": "Test panic alert from Python script",
            "deviceInfo": {"platform": "test", "version": "1.0.0"},
            "networkInfo": {"type": "wifi", "strength": "strong"}
        }
        
        response = requests.post(
            f"{LOCATION_SERVER_URL}/api/alert/panic",
            json=alert_data,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Panic alert successful: {data['success']}")
            print(f"Alert ID: {data['alertId']}")
            return True
        else:
            print(f"❌ Panic alert failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Panic alert error: {e}")
        return False

def test_get_active_alerts():
    """Test getting active alerts"""
    print("\nTesting get active alerts...")
    try:
        response = requests.get(f"{LOCATION_SERVER_URL}/api/alerts/active", timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Get active alerts successful: {data['success']}")
            print(f"Found {len(data['alerts'])} active alerts")
            return True
        else:
            print(f"❌ Get active alerts failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Get active alerts error: {e}")
        return False

def test_get_location_history():
    """Test getting location history"""
    print("\nTesting get location history...")
    try:
        response = requests.get(
            f"{LOCATION_SERVER_URL}/api/location/history/{TEST_USER_ID}",
            timeout=5
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Get location history successful: {data['success']}")
            print(f"Found {len(data['history'])} location records")
            return True
        else:
            print(f"❌ Get location history failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Get location history error: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 Beacon Location Server Test Suite")
    print("=" * 50)
    
    # Check if server is running
    if not test_health_check():
        print("\n❌ Server is not running or not accessible")
        print("Please start the location server first:")
        print("cd server/location_server && npm start")
        sys.exit(1)
    
    # Run tests
    tests = [
        test_location_update,
        test_panic_alert,
        test_get_active_alerts,
        test_get_location_history
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        if test():
            passed += 1
        time.sleep(1)  # Small delay between tests
    
    # Summary
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Location server is working correctly.")
        return 0
    else:
        print("⚠️  Some tests failed. Check the server logs for details.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
