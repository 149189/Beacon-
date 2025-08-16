# WebSocket Testing Checklist

## Pre-Testing Setup

### 1. Backend Verification
- [ ] Django server running on localhost:8000
- [ ] Redis server running (if configured)
- [ ] Django Channels properly configured
- [ ] WebSocket routing.py set up
- [ ] WebSocket consumers implemented

### 2. Test Backend WebSocket (Python)
```bash
# Install required packages
pip install websockets requests

# Run backend test
python test_websocket_backend.py
```

**Expected Output:**
```
🧪 WebSocket Backend Test
============================================================

1. Authentication Test
------------------------------
[14:30:15] ✅ Authentication successful. User ID: 1

2. Alert Creation Test
------------------------------
[14:30:16] ✅ Test alert created: 123

3. WebSocket Connection Tests
------------------------------
[14:30:17] 🔗 Connecting to user WebSocket: ws://localhost:8000/ws/user/1/?token=...
[14:30:18] ✅ User WebSocket connected
[14:30:18] 📤 Ping sent
[14:30:23] ⏰ User WebSocket timeout (normal)
[14:30:24] 🔗 Connecting to alert WebSocket: ws://localhost:8000/ws/alerts/123/?token=...
[14:30:25] ✅ Alert WebSocket connected
[14:30:30] ⏰ Alert WebSocket timeout (normal)
[14:30:31] 🔗 Connecting to location WebSocket: ws://localhost:8000/ws/location/123/?token=...
[14:30:32] ✅ Location WebSocket connected
[14:30:32] 📤 Location update sent
[14:30:35] ⏰ Location WebSocket timeout (normal)
[14:30:36] 🔗 Connecting to chat WebSocket: ws://localhost:8000/ws/chat/123/?token=...
[14:30:37] ✅ Chat WebSocket connected
[14:30:37] 📤 Chat message sent
[14:30:40] ⏰ Chat WebSocket timeout (normal)

4. Cleanup
------------------------------
[14:30:41] ✅ Test alert cleaned up

============================================================
✅ WebSocket Backend Test Complete
============================================================
```

### 3. Flutter Setup
```bash
# Install Flutter dependencies
flutter pub get

# Run Flutter app
flutter run
```

---

## Flutter WebSocket Testing

### Phase 1: Basic Connection Test

#### Step 1: Navigate to WebSocket Test
- [ ] Open Flutter app
- [ ] Look for debug FAB (orange bug icon) OR navigate to `/websocket-test`
- [ ] Tap "WebSocket Test" from debug menu

#### Step 2: Initial State Check
- [ ] Screen shows "Status: DISCONNECTED"
- [ ] Connection indicator is grey
- [ ] Message log shows "No messages yet"

#### Step 3: Authentication Check
- [ ] Tap "Check Auth Status" in debug menu
- [ ] Verify user is logged in
- [ ] If not logged in, complete login first

### Phase 2: Connection Testing

#### Step 4: Establish WebSocket Connection
- [ ] Tap "Connect" button
- [ ] Watch connection status change to "CONNECTING" (orange)
- [ ] Wait for status to change to "CONNECTED" (green)

**Expected Log Messages:**
```
14:30:45: WebSocket test initialized
14:30:46: Connection state: connecting
14:30:47: WebSocket connection initiated
14:30:48: Connection state: connected
14:30:48: WebSocket: User channel connected
```

#### Step 5: Verify Heartbeat
- [ ] Wait 30 seconds
- [ ] Should see periodic heartbeat messages in backend logs
- [ ] Connection should remain stable

### Phase 3: Alert Testing

#### Step 6: Create Test Alert
- [ ] Tap "Create Alert" button
- [ ] Check for success message in log

**Expected Log Messages:**
```
14:31:00: Test alert created: alert_123
14:31:01: WebSocket: Connected to alert channel: alert_123
```

#### Step 7: Location Tracking
- [ ] After alert creation, location updates should start automatically
- [ ] Look for location update messages every 30 seconds

**Expected Log Messages:**
```
14:31:15: WebSocket: Location update sent
14:31:30: WebSocket: Location update sent
14:31:45: WebSocket: Location update sent
```

### Phase 4: Real-time Updates Testing

#### Step 8: Backend Status Change Test
- [ ] Open Django admin in browser
- [ ] Navigate to the created alert
- [ ] Change status from "active" to "acknowledged"
- [ ] Check mobile app for real-time update

**Expected Log Messages:**
```
14:32:00: Alert Update: {type: alert_status_update, status: acknowledged, alert_id: alert_123}
14:32:01: Alert status updated: acknowledged
```

#### Step 9: Operator Message Test
- [ ] In Django admin, send an operator message
- [ ] Check mobile app for incoming message

**Expected Log Messages:**
```
14:32:15: Operator: Emergency services have been notified
```

### Phase 5: Chat Testing

#### Step 10: Send Message from Mobile
- [ ] Enter text in message input field
- [ ] Tap "Send" button
- [ ] Verify message appears in log

**Expected Log Messages:**
```
14:32:30: Sent: Help needed at my location
14:32:30: WebSocket: Chat message sent: Help needed at my location
```

#### Step 11: Receive Message from Backend
- [ ] Use Django admin or API to send chat response
- [ ] Check mobile app receives message

**Expected Log Messages:**
```
14:32:45: Chat: Can you provide more details about your situation?
```

### Phase 6: Alert Management

#### Step 12: Cancel Alert via WebSocket
- [ ] Tap "Cancel Alert" button
- [ ] Verify alert cancellation

**Expected Log Messages:**
```
14:33:00: WebSocket: Cancel request sent via WebSocket
14:33:01: Alert status updated: canceled
14:33:02: Alert cancellation requested
```

#### Step 13: Location Tracking Stops
- [ ] After alert cancellation, location updates should stop
- [ ] No more location update messages should appear

### Phase 7: Connection Resilience

#### Step 14: Disconnection Test
- [ ] Tap "Disconnect" button
- [ ] Verify status changes to "DISCONNECTED"
- [ ] Connection indicator turns grey

#### Step 15: Reconnection Test
- [ ] Tap "Connect" again
- [ ] Verify automatic reconnection works
- [ ] Status should return to "CONNECTED"

#### Step 16: Network Interruption Test (Advanced)
- [ ] While connected, turn off WiFi/mobile data
- [ ] Watch connection status change to "ERROR" or "RECONNECTING"
- [ ] Turn network back on
- [ ] Verify automatic reconnection occurs

---

## Success Criteria Verification

### ✅ Connection Management
- [ ] WebSocket connects successfully
- [ ] Connection status indicator works correctly
- [ ] Automatic reconnection functions
- [ ] Heartbeat maintains connection

### ✅ Authentication
- [ ] JWT token authentication works
- [ ] User-specific channels connect properly
- [ ] Permission-based access controls function

### ✅ Real-time Messaging
- [ ] Alert status updates arrive instantly
- [ ] Operator messages display immediately
- [ ] Location updates stream continuously
- [ ] Chat messages work bidirectionally

### ✅ Alert Integration
- [ ] Alert creation triggers WebSocket setup
- [ ] Location tracking starts automatically
- [ ] Alert cancellation works via WebSocket
- [ ] Status changes propagate in real-time

### ✅ Error Handling
- [ ] Graceful handling of connection failures
- [ ] Fallback to HTTP API when WebSocket unavailable
- [ ] Proper error messages displayed
- [ ] No app crashes during network issues

### ✅ Performance
- [ ] Stable connection over 10+ minutes
- [ ] No memory leaks observed
- [ ] Responsive UI during WebSocket operations
- [ ] Efficient message handling

---

## Common Issues & Solutions

### 🚨 Connection Fails
**Symptoms:** Status stays "DISCONNECTED" or shows "ERROR"
**Solutions:**
1. Check backend server is running
2. Verify WebSocket endpoints are accessible
3. Check authentication token is valid
4. Confirm network connectivity

### 🚨 No Real-time Updates
**Symptoms:** Messages sent but not received
**Solutions:**
1. Verify WebSocket consumers are running
2. Check Django Channels configuration
3. Confirm Redis is running (if used)
4. Test with backend WebSocket client first

### 🚨 Authentication Errors
**Symptoms:** "User not logged in" errors
**Solutions:**
1. Complete login process first
2. Check token hasn't expired
3. Verify AuthService is initialized
4. Test with debug auth status check

### 🚨 Location Updates Not Working
**Symptoms:** No location messages in log
**Solutions:**
1. Check location permissions granted
2. Verify GPS is enabled
3. Ensure alert is active
4. Check LocationService initialization

---

## Performance Benchmarks

### Connection Metrics
- [ ] Connection established < 3 seconds
- [ ] Reconnection time < 5 seconds
- [ ] Heartbeat interval = 30 seconds
- [ ] Message latency < 500ms

### Resource Usage
- [ ] Memory usage stable over time
- [ ] CPU usage minimal when idle
- [ ] Battery impact acceptable
- [ ] Network usage efficient

### Reliability
- [ ] 99%+ message delivery success
- [ ] Graceful handling of network interruptions
- [ ] No data loss during reconnections
- [ ] Stable over extended use (1+ hours)

---

## Test Completion

**Date:** ________________
**Tester:** ________________
**Flutter Version:** ________________
**Device/Platform:** ________________

**Overall Result:** ☐ PASS ☐ FAIL ☐ NEEDS WORK

**Notes:**
_________________________________________________
_________________________________________________
_________________________________________________
