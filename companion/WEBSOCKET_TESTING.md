# WebSocket Testing Guide

## Prerequisites

1. **Backend Setup**
   - Django server running on `http://localhost:8000`
   - Redis server running (if using Redis channel layers)
   - WebSocket endpoints available at `ws://localhost:8000/ws/`

2. **Flutter Dependencies**
   ```bash
   flutter pub get
   ```

## Testing Steps

### 1. Backend WebSocket Test

First, verify the backend WebSocket is working:

```python
# Run this in the Django project directory
python test_websocket_client.py
```

### 2. Flutter WebSocket Connection Test

1. **Start the Flutter app:**
   ```bash
   flutter run
   ```

2. **Navigate to WebSocket Test Screen:**
   - In the app, navigate to `/websocket-test` or add a debug button
   - You should see the WebSocket Test interface

3. **Test Connection:**
   - Tap "Connect" button
   - Check connection status indicator (should turn green)
   - Verify messages in the log showing connection events

### 3. Alert Creation and Real-time Updates

1. **Create Test Alert:**
   - Tap "Create Alert" button
   - Check log for alert creation success
   - Verify alert ID is displayed
   - Backend should receive WebSocket notification

2. **Monitor Real-time Updates:**
   - From Django admin or API, change alert status
   - Mobile app should receive real-time status updates
   - Check log for incoming alert update messages

### 4. Location Tracking Test

1. **Location Updates:**
   - After creating alert, location updates should start automatically
   - Check log for location update messages
   - Verify coordinates are being sent via WebSocket

2. **Backend Verification:**
   - In Django admin, check alert location updates
   - Should see real-time location data

### 5. Chat Messaging Test

1. **Send Message from Mobile:**
   - Enter text in message field
   - Tap "Send" button
   - Should see "Sent: [message]" in log

2. **Send Message from Backend:**
   - Use Django admin or API to send operator message
   - Mobile app should receive and display the message

## Expected Results

### Successful Connection
```
14:30:45: WebSocket test initialized
14:30:46: Connection state: connecting
14:30:47: WebSocket connection initiated
14:30:48: Connection state: connected
14:30:48: WebSocket: User channel connected
```

### Successful Alert Creation
```
14:31:00: Test alert created: alert_123
14:31:01: WebSocket: Connected to alert channel: alert_123
14:31:02: Alert Update: {type: alert_status, status: active, alert_id: alert_123}
```

### Real-time Location Updates
```
14:31:15: WebSocket: Location update sent
14:31:30: WebSocket: Location update sent
14:31:45: WebSocket: Location update sent
```

### Chat Messages
```
14:32:00: Sent: Help needed at my location
14:32:15: Operator: Emergency services have been notified
14:32:30: Operator: Can you provide more details about your situation?
```

## Troubleshooting

### Connection Issues

1. **"User not logged in" error:**
   - Ensure user is authenticated in AuthService
   - Check access token is valid

2. **"Connection failed" error:**
   - Verify backend WebSocket server is running
   - Check URL matches backend configuration
   - Verify network connectivity

3. **"Connection state: error":**
   - Check Django Channels configuration
   - Verify Redis is running (if used)
   - Check backend logs for WebSocket errors

### Alert Issues

1. **"No active alert to send chat message":**
   - Create an alert first using "Create Alert" button
   - Verify alert creation was successful

2. **No real-time updates received:**
   - Check backend WebSocket consumers are working
   - Verify alert status changes in Django admin
   - Check mobile app WebSocket connection is active

### Location Issues

1. **Location updates not working:**
   - Check location permissions are granted
   - Verify LocationService is initialized
   - Check GPS/location services are enabled

## Advanced Testing

### Multiple Connections
Test with multiple mobile apps or browser tabs to verify:
- Multiple WebSocket connections work
- Messages are properly routed
- No interference between connections

### Network Interruption
Test reconnection functionality:
1. Disable/enable network connection
2. Verify automatic reconnection occurs
3. Check that missed messages are handled properly

### Performance Testing
- Create multiple alerts rapidly
- Send multiple chat messages
- Monitor memory and CPU usage
- Check for connection stability over time

## Backend Integration Points

The WebSocket client integrates with these Django endpoints:

### WebSocket Endpoints
- `ws://localhost:8000/ws/user/{user_id}/` - User-specific updates
- `ws://localhost:8000/ws/alerts/{alert_id}/` - Alert-specific updates  
- `ws://localhost:8000/ws/location/{alert_id}/` - Location tracking
- `ws://localhost:8000/ws/chat/{alert_id}/` - Chat messages

### Expected Message Types

**Incoming (from backend):**
- `alert_status_update` - Alert status changes
- `operator_message` - Messages from operators
- `location_updated` - Location update confirmations
- `chat_message` - Chat messages from operators

**Outgoing (to backend):**
- `ping` - Heartbeat messages
- `location_update` - GPS coordinates
- `chat_message` - User messages
- `cancel_alert` - Alert cancellation

## Success Criteria

✅ **Connection:** WebSocket connects successfully and shows "connected" status

✅ **Authentication:** JWT token authentication works properly

✅ **Real-time Updates:** Alert status changes appear instantly in mobile app

✅ **Location Tracking:** GPS coordinates are sent every 30 seconds during active alert

✅ **Chat:** Bidirectional messaging works between mobile app and operators

✅ **Reconnection:** Automatic reconnection works after network interruption

✅ **Error Handling:** Graceful fallback to HTTP API when WebSocket fails

✅ **Performance:** Stable connection over extended periods without memory leaks
