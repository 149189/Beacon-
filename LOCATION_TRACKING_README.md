# Beacon Location Tracking System

This system provides real-time location tracking and panic alert functionality for the Beacon application, integrating with Google Maps API and using a Node.js server for location management.

## System Architecture

### Components

1. **Node.js Location Server** (`server/location_server/`)
   - Real-time location tracking
   - Panic alert management
   - WebSocket communication
   - MySQL database integration

2. **Admin Panel** (`admin_client/beacon_user/`)
   - Real-time map view of user locations
   - Panic alert management interface
   - Location history and analytics

3. **Mobile App** (`companion/`)
   - Location tracking service
   - Panic button functionality
   - WebSocket communication with server

## Setup Instructions

### Prerequisites

- Node.js 18+ installed
- MySQL database running
- Google Maps API key
- Flutter SDK (for mobile app)

### 1. Database Setup

Ensure your MySQL database is running and accessible. The system will automatically create the required tables:

- `user_locations` - Current user locations
- `location_alerts` - Panic alerts and their status
- `location_history` - Location tracking history

### 2. Location Server Setup

1. Navigate to the location server directory:
   ```bash
   cd server/location_server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables in `config.env`:
   ```env
   MYSQL_HOST=localhost
   MYSQL_USER=root
   MYSQL_PASSWORD=your_password
   MYSQL_DATABASE=beacon_db
   GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   ```

4. Start the server:
   ```bash
   npm start
   ```

   Or use the provided scripts:
   - Windows: `start_location_server.bat`
   - PowerShell: `start_location_server.ps1`

The server will start on port 3001 by default.

### 3. Admin Panel Setup

1. Navigate to the admin client directory:
   ```bash
   cd admin_client/beacon_user
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Access the location tracking interface at `/location`

### 4. Mobile App Setup

1. Navigate to the Flutter app directory:
   ```bash
   cd companion
   ```

2. Install dependencies:
   ```bash
   flutter pub get
   ```

3. Configure the WebSocket service URL in your app

## Features

### Real-time Location Tracking

- **Continuous Updates**: Location updates every 5 seconds (configurable)
- **High Accuracy**: GPS-based location with accuracy reporting
- **Battery Optimization**: Efficient location tracking with minimal battery drain
- **Offline Support**: Location caching when network is unavailable

### Panic Alert System

- **Instant Alerts**: One-tap panic button activation
- **Location Sharing**: Automatic location sharing with admin panel
- **Real-time Notifications**: Immediate admin notification via WebSocket
- **Status Tracking**: Full alert lifecycle management

### Admin Interface

- **Live Map**: Real-time Google Maps integration
- **Alert Management**: Acknowledge, respond, and resolve alerts
- **User Tracking**: Monitor user locations in real-time
- **Search & Filter**: Find alerts by status, priority, or location
- **Analytics**: Alert statistics and response time tracking

## API Endpoints

### Location Server (Port 3001)

#### Location Updates
- `POST /api/location/update` - Update user location
- `GET /api/location/history/:userId` - Get location history

#### Panic Alerts
- `POST /api/alert/panic` - Create panic alert
- `GET /api/alerts/active` - Get active alerts

#### Health & Status
- `GET /health` - Server health check

### WebSocket Events

#### Client to Server
- `authenticate` - User authentication
- `location_update` - Send location update
- `panic_alert` - Trigger panic alert

#### Server to Client
- `authenticated` - Authentication confirmation
- `location_updated` - Location update confirmation
- `alert_created` - Panic alert confirmation
- `alert_status_updated` - Alert status changes

## Database Schema

### user_locations
```sql
CREATE TABLE user_locations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  accuracy FLOAT DEFAULT 0,
  altitude FLOAT NULL,
  speed FLOAT NULL,
  heading FLOAT NULL,
  provider VARCHAR(20) DEFAULT 'gps',
  battery_level INT NULL,
  device_info JSON NULL,
  network_info JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### location_alerts
```sql
CREATE TABLE location_alerts (
  id VARCHAR(36) PRIMARY KEY,
  user_id INT NOT NULL,
  alert_type VARCHAR(20) DEFAULT 'panic_button',
  status VARCHAR(20) DEFAULT 'active',
  priority INT DEFAULT 4,
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  accuracy FLOAT DEFAULT 0,
  address TEXT NULL,
  description TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## Security Features

- **User Authentication**: WebSocket authentication required
- **Permission-based Access**: Different access levels for users and admins
- **Data Validation**: Input validation and sanitization
- **Rate Limiting**: Protection against abuse
- **Secure Communication**: WebSocket over WSS in production

## Performance Optimization

- **Connection Pooling**: Efficient database connections
- **Location Caching**: Reduce API calls to Google Maps
- **Batch Updates**: Group location updates for efficiency
- **Heartbeat Monitoring**: Keep connections alive and detect failures
- **Automatic Reconnection**: Seamless connection recovery

## Monitoring & Logging

- **Structured Logging**: Winston-based logging system
- **Health Checks**: Regular server health monitoring
- **Performance Metrics**: Response time and throughput tracking
- **Error Tracking**: Comprehensive error logging and reporting

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check MySQL service is running
   - Verify connection credentials in `config.env`
   - Ensure database exists

2. **WebSocket Connection Failed**
   - Check if location server is running on port 3001
   - Verify firewall settings
   - Check network connectivity

3. **Google Maps Not Loading**
   - Verify API key is valid
   - Check API key restrictions
   - Ensure billing is enabled for Google Cloud project

4. **Location Updates Not Working**
   - Check location permissions on mobile device
   - Verify GPS is enabled
   - Check network connectivity

### Debug Mode

Enable debug logging by setting:
```env
LOG_LEVEL=debug
```

## Production Deployment

### Environment Variables
- Set `NODE_ENV=production`
- Use strong database passwords
- Configure proper CORS origins
- Enable HTTPS/WSS

### Scaling
- Use load balancer for multiple server instances
- Implement Redis for session management
- Use connection pooling for database
- Monitor resource usage

### Security
- Enable HTTPS/WSS
- Implement rate limiting
- Use environment variables for secrets
- Regular security updates

## Support

For technical support or questions about the location tracking system, please refer to the main project documentation or contact the development team.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
