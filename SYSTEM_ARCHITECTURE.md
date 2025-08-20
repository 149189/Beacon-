# Beacon System Architecture

## System Overview
Beacon is a comprehensive emergency response platform consisting of three main components:

1. **Django Backend Server** - API and WebSocket services
2. **React Admin Client** - Operator dashboard for emergency management
3. **Flutter Companion App** - Mobile app for users to send panic alerts

## Component Architecture

### 1. Django Backend Server (`/server`)
- **Models**: PanicAlert, AlertLocation, AlertMedia, EmergencyContact, AlertNotification
- **APIs**: RESTful endpoints for all CRUD operations
- **WebSockets**: Real-time communication via Django Channels
- **Database**: SQLite (dev) / MySQL (prod)
- **Authentication**: JWT tokens

### 2. React Admin Client (`/admin_client`)
- **Dashboard**: Real-time statistics and monitoring
- **Map Integration**: Live tracking of panic alerts and locations
- **User Management**: Admin interface for user operations
- **WebSocket Client**: Real-time updates from server

### 3. Flutter Companion App (`/companion`)
- **Panic Button**: Emergency alert triggering
- **Location Services**: GPS tracking and location sharing
- **WebSocket Client**: Real-time communication with server
- **Offline Support**: Store alerts locally when offline

## Data Flow Architecture

```
[Companion App] <--WebSocket--> [Django Server] <--WebSocket--> [Admin Client]
      |                              |                              |
   Location GPS                 Database Layer                   Map Display
      |                              |                              |
  Panic Alerts                  Alert Processing              Operator Actions
      |                              |                              |
   HTTP APIs                    Notifications                  Status Updates
```

## Real-time Communication

### WebSocket Channels:
1. `panic_alerts` - New alerts, location updates
2. `admin_dashboard` - Dashboard updates, statistics
3. `user_notifications` - User-specific notifications

### Message Types:
- `new_panic_alert` - New emergency alert created
- `alert_location_update` - Location update for active alert
- `alert_status_change` - Alert status updated by operator
- `dashboard_stats_update` - Dashboard statistics refresh

## API Endpoints

### Panic Alert Endpoints:
- `POST /api/panic-alerts/` - Create new panic alert
- `GET /api/panic-alerts/` - List panic alerts
- `PATCH /api/panic-alerts/{id}/` - Update alert status
- `POST /api/panic-alerts/{id}/location/` - Update location
- `POST /api/panic-alerts/{id}/media/` - Upload media

### Dashboard Endpoints:
- `GET /api/dashboard/stats/` - Real-time statistics
- `GET /api/dashboard/active-alerts/` - Active alerts for map
- `GET /api/dashboard/alert-history/` - Historical data

## Security Considerations

1. **Authentication**: JWT tokens with refresh mechanism
2. **Authorization**: Role-based access (admin/user)
3. **Location Privacy**: Encrypted location data
4. **Media Security**: Signed URLs for media access
5. **WebSocket Security**: Token-based authentication

## Deployment Architecture

```
[Load Balancer] 
      |
[Django Server] <-> [Redis] <-> [Database]
      |
[Static Files CDN]
      |
[Media Storage S3]
```

## Integration Improvements Planned

1. **Enhanced Panic Button**: Multi-trigger options (shake, decoy screen)
2. **Map Integration**: Real-time location visualization
3. **WebSocket Enhancement**: Improved real-time updates
4. **Offline Capabilities**: Local storage and sync
5. **Media Upload**: Audio/video evidence capture
6. **Emergency Contacts**: Automatic notifications
7. **Analytics Dashboard**: Advanced reporting and insights
