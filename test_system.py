#!/usr/bin/env python
"""
System test script for Beacon
Run this to verify all components are working correctly
"""

import requests
import json
import time
import sys

def test_backend_health():
    """Test backend health endpoint"""
    try:
        response = requests.get('http://localhost:8001/api/health/', timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Backend health check passed: {data.get('status', 'unknown')}")
            return True
        else:
            print(f"❌ Backend health check failed: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Backend health check error: {e}")
        return False

def test_frontend():
    """Test frontend accessibility"""
    try:
        response = requests.get('http://localhost:3000', timeout=5)
        if response.status_code == 200:
            print("✅ Frontend is accessible")
            return True
        else:
            print(f"❌ Frontend check failed: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Frontend check error: {e}")
        return False

def test_incidents_api():
    """Test incidents API endpoint"""
    try:
        response = requests.get('http://localhost:8001/api/operator/incidents/', timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Incidents API working: {len(data)} incidents found")
            return True
        else:
            print(f"❌ Incidents API failed: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Incidents API error: {e}")
        return False

def test_create_incident():
    """Test creating a new incident"""
    try:
        incident_data = {
            'user': 'Test User',
            'latitude': 40.7128,
            'longitude': -74.0060,
            'metadata': {
                'description': 'System test incident',
                'priority': 'low',
                'source': 'test_script'
            }
        }
        
        response = requests.post(
            'http://localhost:8001/api/operator/incidents/',
            json=incident_data,
            timeout=5
        )
        
        if response.status_code == 201:
            data = response.json()
            print(f"✅ Incident creation test passed: {data.get('id', 'unknown')}")
            return True
        else:
            print(f"❌ Incident creation test failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Incident creation test error: {e}")
        return False

def main():
    """Run all system tests"""
    print("🚨 Beacon System Test")
    print("====================")
    print()
    
    tests = [
        ("Backend Health", test_backend_health),
        ("Frontend Access", test_frontend),
        ("Incidents API", test_incidents_api),
        ("Incident Creation", test_create_incident),
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"Testing {test_name}...")
        if test_func():
            passed += 1
        print()
        time.sleep(1)  # Small delay between tests
    
    print("📊 Test Results")
    print("===============")
    print(f"Passed: {passed}/{total}")
    
    if passed == total:
        print("🎉 All tests passed! Beacon is working correctly.")
        return 0
    else:
        print("⚠️  Some tests failed. Please check the logs and configuration.")
        return 1

if __name__ == '__main__':
    sys.exit(main())
