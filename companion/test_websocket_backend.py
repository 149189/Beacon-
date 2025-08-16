#!/usr/bin/env python3
"""
WebSocket Backend Test Client
Test the Django Channels WebSocket endpoints before testing the Flutter app
"""

import asyncio
import json
import websockets
import requests
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8000"
WS_BASE_URL = "ws://localhost:8000"

# Test user credentials (adjust as needed)
TEST_USER = {
    "username": "testuser",
    "password": "testpass123"
}

class WebSocketTester:
    def __init__(self):
        self.access_token = None
        self.user_id = None
        self.alert_id = None
        
    def log(self, message):
        """Log with timestamp"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {message}")
        
    async def authenticate(self):
        """Login and get JWT token"""
        try:
            login_url = f"{BASE_URL}/api/auth/login/"
            response = requests.post(login_url, json=TEST_USER)
            
            if response.status_code == 200:
                data = response.json()
                self.access_token = data.get('access_token')
                self.user_id = data.get('user', {}).get('id')
                self.log(f"✅ Authentication successful. User ID: {self.user_id}")
                return True
            else:
                self.log(f"❌ Authentication failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            self.log(f"❌ Authentication error: {e}")
            return False
    
    async def create_test_alert(self):
        """Create a test alert via API"""
        try:
            headers = {"Authorization": f"Bearer {self.access_token}"}
            alert_data = {
                "alert_type": "panic_button",
                "priority": 4,
                "latitude": 40.7128,
                "longitude": -74.0060,
                "location_accuracy": 5.0,
                "address": "New York, NY",
                "description": "WebSocket test alert",
                "is_silent": False,
                "auto_call_emergency": False
            }
            
            response = requests.post(
                f"{BASE_URL}/api/alerts/",
                json=alert_data,
                headers=headers
            )
            
            if response.status_code == 201:
                data = response.json()
                self.alert_id = data.get('id')
                self.log(f"✅ Test alert created: {self.alert_id}")
                return True
            else:
                self.log(f"❌ Alert creation failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            self.log(f"❌ Alert creation error: {e}")
            return False
    
    async def test_user_websocket(self):
        """Test user-specific WebSocket channel"""
        try:
            uri = f"{WS_BASE_URL}/ws/user/{self.user_id}/?token={self.access_token}"
            self.log(f"🔗 Connecting to user WebSocket: {uri}")
            
            async with websockets.connect(uri) as websocket:
                self.log("✅ User WebSocket connected")
                
                # Send a ping
                ping_message = {
                    "type": "ping",
                    "timestamp": datetime.now().isoformat()
                }
                await websocket.send(json.dumps(ping_message))
                self.log("📤 Ping sent")
                
                # Listen for messages for 5 seconds
                try:
                    while True:
                        message = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                        data = json.loads(message)
                        self.log(f"📥 Received: {data}")
                except asyncio.TimeoutError:
                    self.log("⏰ User WebSocket timeout (normal)")
                
        except Exception as e:
            self.log(f"❌ User WebSocket error: {e}")
            return False
        
        return True
    
    async def test_alert_websocket(self):
        """Test alert-specific WebSocket channel"""
        if not self.alert_id:
            self.log("❌ No alert ID available for WebSocket test")
            return False
            
        try:
            uri = f"{WS_BASE_URL}/ws/alerts/{self.alert_id}/?token={self.access_token}"
            self.log(f"🔗 Connecting to alert WebSocket: {uri}")
            
            async with websockets.connect(uri) as websocket:
                self.log("✅ Alert WebSocket connected")
                
                # Listen for messages for 5 seconds
                try:
                    while True:
                        message = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                        data = json.loads(message)
                        self.log(f"📥 Alert message: {data}")
                except asyncio.TimeoutError:
                    self.log("⏰ Alert WebSocket timeout (normal)")
                
        except Exception as e:
            self.log(f"❌ Alert WebSocket error: {e}")
            return False
        
        return True
    
    async def test_location_websocket(self):
        """Test location tracking WebSocket channel"""
        if not self.alert_id:
            self.log("❌ No alert ID available for location WebSocket test")
            return False
            
        try:
            uri = f"{WS_BASE_URL}/ws/location/{self.alert_id}/?token={self.access_token}"
            self.log(f"🔗 Connecting to location WebSocket: {uri}")
            
            async with websockets.connect(uri) as websocket:
                self.log("✅ Location WebSocket connected")
                
                # Send a location update
                location_message = {
                    "type": "location_update",
                    "location": {
                        "latitude": 40.7589,
                        "longitude": -73.9851,
                        "accuracy": 3.5,
                        "provider": "gps",
                        "battery_level": 85
                    },
                    "timestamp": datetime.now().isoformat()
                }
                await websocket.send(json.dumps(location_message))
                self.log("📤 Location update sent")
                
                # Listen for response
                try:
                    while True:
                        message = await asyncio.wait_for(websocket.recv(), timeout=3.0)
                        data = json.loads(message)
                        self.log(f"📥 Location response: {data}")
                except asyncio.TimeoutError:
                    self.log("⏰ Location WebSocket timeout (normal)")
                
        except Exception as e:
            self.log(f"❌ Location WebSocket error: {e}")
            return False
        
        return True
    
    async def test_chat_websocket(self):
        """Test chat WebSocket channel"""
        if not self.alert_id:
            self.log("❌ No alert ID available for chat WebSocket test")
            return False
            
        try:
            uri = f"{WS_BASE_URL}/ws/chat/{self.alert_id}/?token={self.access_token}"
            self.log(f"🔗 Connecting to chat WebSocket: {uri}")
            
            async with websockets.connect(uri) as websocket:
                self.log("✅ Chat WebSocket connected")
                
                # Send a chat message
                chat_message = {
                    "type": "chat_message",
                    "message": "Test message from WebSocket client",
                    "timestamp": datetime.now().isoformat()
                }
                await websocket.send(json.dumps(chat_message))
                self.log("📤 Chat message sent")
                
                # Listen for response
                try:
                    while True:
                        message = await asyncio.wait_for(websocket.recv(), timeout=3.0)
                        data = json.loads(message)
                        self.log(f"📥 Chat response: {data}")
                except asyncio.TimeoutError:
                    self.log("⏰ Chat WebSocket timeout (normal)")
                
        except Exception as e:
            self.log(f"❌ Chat WebSocket error: {e}")
            return False
        
        return True
    
    async def cleanup(self):
        """Clean up test alert"""
        if self.alert_id:
            try:
                headers = {"Authorization": f"Bearer {self.access_token}"}
                response = requests.post(
                    f"{BASE_URL}/api/alerts/{self.alert_id}/cancel/",
                    headers=headers
                )
                if response.status_code == 200:
                    self.log("✅ Test alert cleaned up")
                else:
                    self.log(f"⚠️ Cleanup warning: {response.status_code}")
            except Exception as e:
                self.log(f"⚠️ Cleanup error: {e}")

async def main():
    """Main test function"""
    print("=" * 60)
    print("🧪 WebSocket Backend Test")
    print("=" * 60)
    
    tester = WebSocketTester()
    
    # Step 1: Authenticate
    print("\n1. Authentication Test")
    print("-" * 30)
    if not await tester.authenticate():
        print("❌ Cannot proceed without authentication")
        return
    
    # Step 2: Create test alert
    print("\n2. Alert Creation Test")
    print("-" * 30)
    if not await tester.create_test_alert():
        print("⚠️ Some WebSocket tests will be skipped")
    
    # Step 3: Test WebSocket channels
    print("\n3. WebSocket Connection Tests")
    print("-" * 30)
    
    await tester.test_user_websocket()
    await tester.test_alert_websocket()
    await tester.test_location_websocket()
    await tester.test_chat_websocket()
    
    # Step 4: Cleanup
    print("\n4. Cleanup")
    print("-" * 30)
    await tester.cleanup()
    
    print("\n" + "=" * 60)
    print("✅ WebSocket Backend Test Complete")
    print("=" * 60)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n🛑 Test interrupted by user")
    except Exception as e:
        print(f"💥 Test failed with error: {e}")
