import requests
import json
from datetime import datetime

# API Configuration
BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api/auth"

class BeaconAPITester:
    def __init__(self):
        self.session = requests.Session()
        self.access_token = None
        self.user_data = None
        
    def test_user_registration(self):
        """Test user registration"""
        print("🔧 Testing user registration...")
        
        registration_data = {
            "username": f"testuser_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "email": f"test_{datetime.now().strftime('%Y%m%d_%H%M%S')}@example.com",
            "password": "TestPassword123!",
            "password2": "TestPassword123!",
            "first_name": "Test",
            "last_name": "User"
        }
        
        try:
            response = self.session.post(f"{API_BASE}/register/", json=registration_data)
            if response.status_code == 201:
                print("✅ User registration successful")
                return registration_data
            else:
                print(f"❌ User registration failed: {response.text}")
                return None
        except Exception as e:
            print(f"❌ Registration error: {e}")
            return None
    
    def test_user_login(self, username, password):
        """Test user login"""
        print("🔧 Testing user login...")
        
        login_data = {
            "username": username,
            "password": password
        }
        
        try:
            response = self.session.post(f"{API_BASE}/login/", json=login_data)
            if response.status_code == 200:
                data = response.json()
                self.access_token = data['tokens']['access']
                self.user_data = data['user']
                
                # Set authorization header for future requests
                self.session.headers.update({
                    'Authorization': f'Bearer {self.access_token}',
                    'Content-Type': 'application/json'
                })
                
                print("✅ User login successful")
                return True
            else:
                print(f"❌ Login failed: {response.text}")
                return False
        except Exception as e:
            print(f"❌ Login error: {e}")
            return False
    
    def test_create_panic_alert(self):
        """Test creating a panic alert"""
        print("🚨 Testing panic alert creation...")
        
        alert_data = {
            "alert_type": "panic_button",
            "priority": 4,
            "latitude": 40.7128,
            "longitude": -74.0060,
            "location_accuracy": 10.5,
            "address": "New York, NY, USA",
            "description": "Test emergency alert",
            "is_silent": False,
            "auto_call_emergency": False,
            "device_info": {
                "platform": "test",
                "version": "1.0.0",
                "device_model": "Test Device"
            },
            "network_info": {
                "connection_type": "wifi",
                "signal_strength": "strong"
            }
        }
        
        try:
            response = self.session.post(f"{API_BASE}/alerts/", json=alert_data)
            if response.status_code == 201:
                data = response.json()
                alert_id = data.get('alert_id')
                print(f"✅ Panic alert created successfully! Alert ID: {alert_id}")
                return alert_id
            else:
                print(f"❌ Panic alert creation failed: {response.text}")
                return None
        except Exception as e:
            print(f"❌ Alert creation error: {e}")
            return None
    
    def test_list_alerts(self):
        """Test listing panic alerts"""
        print("📋 Testing alert listing...")
        
        try:
            response = self.session.get(f"{API_BASE}/alerts/")
            if response.status_code == 200:
                data = response.json()
                alerts = data if isinstance(data, list) else data.get('results', [])
                print(f"✅ Retrieved {len(alerts)} alerts")
                return alerts
            else:
                print(f"❌ Alert listing failed: {response.text}")
                return []
        except Exception as e:
            print(f"❌ Alert listing error: {e}")
            return []
    
    def test_update_alert_location(self, alert_id):
        """Test updating alert location"""
        print("📍 Testing location update...")
        
        location_data = {
            "latitude": 40.7589,
            "longitude": -73.9851,
            "accuracy": 8.2,
            "provider": "gps",
            "battery_level": 85
        }
        
        try:
            response = self.session.post(f"{API_BASE}/alerts/{alert_id}/location/", json=location_data)
            if response.status_code == 200:
                print("✅ Location updated successfully")
                return True
            else:
                print(f"❌ Location update failed: {response.text}")
                return False
        except Exception as e:
            print(f"❌ Location update error: {e}")
            return False
    
    def test_cancel_alert(self, alert_id):
        """Test canceling an alert"""
        print("🔴 Testing alert cancellation...")
        
        try:
            response = self.session.post(f"{API_BASE}/alerts/{alert_id}/cancel/")
            if response.status_code == 200:
                print("✅ Alert canceled successfully")
                return True
            else:
                print(f"❌ Alert cancellation failed: {response.text}")
                return False
        except Exception as e:
            print(f"❌ Alert cancellation error: {e}")
            return False
    
    def test_dashboard_stats(self):
        """Test dashboard statistics (admin only)"""
        print("📊 Testing dashboard stats...")
        
        try:
            response = self.session.get(f"{API_BASE}/dashboard/stats/")
            if response.status_code == 200:
                data = response.json()
                print("✅ Dashboard stats retrieved:")
                for key, value in data.items():
                    print(f"   {key}: {value}")
                return data
            elif response.status_code == 403:
                print("ℹ️  Dashboard stats requires admin privileges (normal behavior)")
                return None
            else:
                print(f"❌ Dashboard stats failed: {response.text}")
                return None
        except Exception as e:
            print(f"❌ Dashboard stats error: {e}")
            return None
    
    def test_emergency_contacts(self):
        """Test emergency contacts management"""
        print("👥 Testing emergency contacts...")
        
        contact_data = {
            "name": "Test Contact",
            "phone": "+1234567890",
            "email": "testcontact@example.com",
            "relationship": "family",
            "notify_on_alert": True,
            "can_receive_location": True,
            "notes": "Test emergency contact"
        }
        
        try:
            # Create contact
            response = self.session.post(f"{API_BASE}/emergency-contacts/", json=contact_data)
            if response.status_code == 201:
                contact_id = response.json().get('id')
                print(f"✅ Emergency contact created! ID: {contact_id}")
                
                # List contacts
                response = self.session.get(f"{API_BASE}/emergency-contacts/")
                if response.status_code == 200:
                    contacts = response.json()
                    print(f"✅ Retrieved {len(contacts)} emergency contacts")
                    return contact_id
                else:
                    print(f"❌ Contact listing failed: {response.text}")
                    return contact_id
            else:
                print(f"❌ Emergency contact creation failed: {response.text}")
                return None
        except Exception as e:
            print(f"❌ Emergency contact error: {e}")
            return None
    
    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Beacon API Tests")
        print("=" * 50)
        
        # Step 1: Register user
        registration_data = self.test_user_registration()
        if not registration_data:
            print("❌ Cannot continue without user registration")
            return False
        
        print()
        
        # Step 2: Login
        if not self.test_user_login(registration_data['username'], registration_data['password']):
            print("❌ Cannot continue without login")
            return False
        
        print()
        
        # Step 3: Create panic alert
        alert_id = self.test_create_panic_alert()
        if not alert_id:
            print("❌ Cannot test other alert features")
        
        print()
        
        # Step 4: List alerts
        alerts = self.test_list_alerts()
        
        print()
        
        # Step 5: Update location (if we have an alert)
        if alert_id:
            self.test_update_alert_location(alert_id)
            print()
        
        # Step 6: Test emergency contacts
        contact_id = self.test_emergency_contacts()
        
        print()
        
        # Step 7: Test dashboard stats
        self.test_dashboard_stats()
        
        print()
        
        # Step 8: Cancel alert (if we have one)
        if alert_id:
            self.test_cancel_alert(alert_id)
        
        print()
        print("=" * 50)
        print("🎉 API Tests Completed!")
        
        return True

def main():
    """Main test function"""
    tester = BeaconAPITester()
    
    try:
        tester.run_all_tests()
    except KeyboardInterrupt:
        print("\n⚠️  Tests interrupted by user")
    except Exception as e:
        print(f"\n❌ Unexpected error during testing: {e}")

if __name__ == "__main__":
    main()
