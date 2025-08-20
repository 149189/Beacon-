const winston = require('winston');

class WebSocketManager {
  constructor(io, locationService, alertService) {
    this.io = io;
    this.locationService = locationService;
    this.alertService = alertService;
    this.connectedClients = new Map(); // userId -> socket
    this.adminClients = new Set(); // admin socket IDs
    
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.simple(),
      transports: [new winston.transports.Console()]
    });

    this.initialize();
  }

  initialize() {
    this.io.on('connection', (socket) => {
      this.logger.info(`Client connected: ${socket.id}`);
      
      // Handle client authentication
      socket.on('authenticate', async (data) => {
        await this.handleAuthentication(socket, data);
      });

      // Handle location updates from mobile app
      socket.on('location_update', async (data) => {
        await this.handleLocationUpdate(socket, data);
      });

      // Handle panic alert from mobile app
      socket.on('panic_alert', async (data) => {
        await this.handlePanicAlert(socket, data);
      });

      // Handle admin panel connection
      socket.on('admin_connect', (data) => {
        this.handleAdminConnect(socket, data);
      });

      // Handle alert acknowledgment from admin
      socket.on('acknowledge_alert', async (data) => {
        await this.handleAlertAcknowledgment(socket, data);
      });

      // Handle alert resolution from admin
      socket.on('resolve_alert', async (data) => {
        await this.handleAlertResolution(socket, data);
      });

      // Handle admin requesting user location
      socket.on('request_user_location', async (data) => {
        await this.handleLocationRequest(socket, data);
      });

      // Handle client disconnect
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });

      // Handle errors
      socket.on('error', (error) => {
        this.logger.error(`Socket error: ${error.message}`);
      });
    });

    // Start heartbeat to keep connections alive
    this.startHeartbeat();
  }

  async handleAuthentication(socket, data) {
    try {
      const { userId, userType, token } = data;
      
      if (!userId || !userType) {
        socket.emit('auth_error', { message: 'Missing required authentication data' });
        return;
      }

      // Store client information
      this.connectedClients.set(userId, socket);
      socket.userId = userId;
      socket.userType = userType;

      // Join user-specific room
      socket.join(`user_${userId}`);
      
      // Join admin room if admin user
      if (userType === 'admin') {
        this.adminClients.add(socket.id);
        socket.join('admin_room');
      }

      socket.emit('authenticated', { 
        success: true, 
        userId, 
        userType,
        message: 'Successfully authenticated'
      });

      this.logger.info(`User ${userId} (${userType}) authenticated`);

      // Send current user location if available
      if (userType === 'user') {
        const location = await this.locationService.getUserLocation(userId);
        if (location) {
          socket.emit('current_location', location);
        }
      }

    } catch (error) {
      this.logger.error(`Authentication error: ${error.message}`);
      socket.emit('auth_error', { message: 'Authentication failed' });
    }
  }

  async handleLocationUpdate(socket, data) {
    try {
      const { userId, latitude, longitude, accuracy, altitude, speed, heading, provider, batteryLevel, deviceInfo, networkInfo } = data;

      if (!userId || !latitude || !longitude) {
        socket.emit('location_error', { message: 'Missing location data' });
        return;
      }

      // Update location in database
      const locationData = await this.locationService.updateUserLocation({
        userId,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        accuracy: parseFloat(accuracy) || 0,
        altitude: parseFloat(altitude) || null,
        speed: parseFloat(speed) || null,
        heading: parseFloat(heading) || null,
        provider: provider || 'gps',
        batteryLevel: parseInt(batteryLevel) || null,
        deviceInfo: deviceInfo || {},
        networkInfo: networkInfo || {}
      });

      // Confirm location update to mobile app
      socket.emit('location_updated', { 
        success: true, 
        location: locationData,
        timestamp: new Date().toISOString()
      });

      // Notify admin panel of location update
      this.notifyAdminLocationUpdate(userId, locationData);

      this.logger.info(`Location updated for user ${userId}: ${latitude}, ${longitude}`);

    } catch (error) {
      this.logger.error(`Location update error: ${error.message}`);
      socket.emit('location_error', { message: 'Failed to update location' });
    }
  }

  async handlePanicAlert(socket, data) {
    try {
      const { userId, latitude, longitude, accuracy, alertType, description, deviceInfo, networkInfo } = data;

      if (!userId || !latitude || !longitude) {
        socket.emit('alert_error', { message: 'Missing alert data' });
        return;
      }

      // Create panic alert
      const alert = await this.alertService.createPanicAlert({
        userId,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        accuracy: parseFloat(accuracy) || 0,
        alertType: alertType || 'panic_button',
        description: description || '',
        deviceInfo: deviceInfo || {},
        networkInfo: networkInfo || {}
      });

      // Confirm alert creation to mobile app
      socket.emit('alert_created', { 
        success: true, 
        alertId: alert.id,
        message: 'Panic alert created successfully'
      });

      // Notify admin panel immediately
      this.notifyAdminPanel(alert);

      // Start location tracking for this alert
      this.startAlertLocationTracking(alert.id, userId);

      this.logger.info(`Panic alert created for user ${userId}: ${alert.id}`);

    } catch (error) {
      this.logger.error(`Panic alert error: ${error.message}`);
      socket.emit('alert_error', { message: 'Failed to create panic alert' });
    }
  }

  handleAdminConnect(socket, data) {
    try {
      const { adminId, adminName } = data;
      
      if (!adminId || !adminName) {
        socket.emit('admin_error', { message: 'Missing admin information' });
        return;
      }

      // Store admin information
      socket.adminId = adminId;
      socket.adminName = adminName;
      this.adminClients.add(socket.id);
      socket.join('admin_room');

      socket.emit('admin_connected', { 
        success: true, 
        adminId, 
        adminName,
        message: 'Admin panel connected successfully'
      });

      // Send current active alerts
      this.sendActiveAlertsToAdmin(socket);

      this.logger.info(`Admin ${adminName} (${adminId}) connected`);

    } catch (error) {
      this.logger.error(`Admin connection error: ${error.message}`);
      socket.emit('admin_error', { message: 'Admin connection failed' });
    }
  }

  async handleAlertAcknowledgment(socket, data) {
    try {
      const { alertId, adminId, notes } = data;

      if (!alertId || !adminId) {
        socket.emit('ack_error', { message: 'Missing alert acknowledgment data' });
        return;
      }

      // Update alert status
      const updatedAlert = await this.alertService.updateAlertStatus(
        alertId, 
        'acknowledged', 
        adminId, 
        notes || ''
      );

      // Notify all admin clients
      this.io.to('admin_room').emit('alert_acknowledged', {
        alertId,
        adminId,
        status: 'acknowledged',
        acknowledgedAt: new Date().toISOString(),
        notes: notes || ''
      });

      // Notify mobile app if connected
      const userSocket = this.connectedClients.get(updatedAlert.user_id);
      if (userSocket) {
        userSocket.emit('alert_status_updated', {
          alertId,
          status: 'acknowledged',
          adminId,
          acknowledgedAt: new Date().toISOString()
        });
      }

      this.logger.info(`Alert ${alertId} acknowledged by admin ${adminId}`);

    } catch (error) {
      this.logger.error(`Alert acknowledgment error: ${error.message}`);
      socket.emit('ack_error', { message: 'Failed to acknowledge alert' });
    }
  }

  async handleAlertResolution(socket, data) {
    try {
      const { alertId, adminId, resolutionNotes } = data;

      if (!alertId || !adminId) {
        socket.emit('resolve_error', { message: 'Missing alert resolution data' });
        return;
      }

      // Update alert status
      const updatedAlert = await this.alertService.updateAlertStatus(
        alertId, 
        'resolved', 
        adminId, 
        resolutionNotes || ''
      );

      // Notify all admin clients
      this.io.to('admin_room').emit('alert_resolved', {
        alertId,
        adminId,
        status: 'resolved',
        resolvedAt: new Date().toISOString(),
        resolutionNotes: resolutionNotes || ''
      });

      // Notify mobile app if connected
      const userSocket = this.connectedClients.get(updatedAlert.user_id);
      if (userSocket) {
        userSocket.emit('alert_status_updated', {
          alertId,
          status: 'resolved',
          adminId,
          resolvedAt: new Date().toISOString()
        });
      }

      this.logger.info(`Alert ${alertId} resolved by admin ${adminId}`);

    } catch (error) {
      this.logger.error(`Alert resolution error: ${error.message}`);
      socket.emit('resolve_error', { message: 'Failed to resolve alert' });
    }
  }

  async handleLocationRequest(socket, data) {
    try {
      const { userId } = data;

      if (!userId) {
        socket.emit('location_request_error', { message: 'Missing user ID' });
        return;
      }

      // Get user location
      const location = await this.locationService.getUserLocation(userId);
      
      if (location) {
        socket.emit('user_location_response', {
          userId,
          location,
          timestamp: new Date().toISOString()
        });
      } else {
        socket.emit('user_location_response', {
          userId,
          location: null,
          message: 'User location not available'
        });
      }

    } catch (error) {
      this.logger.error(`Location request error: ${error.message}`);
      socket.emit('location_request_error', { message: 'Failed to get user location' });
    }
  }

  handleDisconnect(socket) {
    try {
      if (socket.userId) {
        this.connectedClients.delete(socket.userId);
        this.logger.info(`User ${socket.userId} disconnected`);
      }

      if (socket.adminId) {
        this.adminClients.delete(socket.id);
        this.logger.info(`Admin ${socket.adminName} (${socket.adminId}) disconnected`);
      }

      this.logger.info(`Client disconnected: ${socket.id}`);

    } catch (error) {
      this.logger.error(`Disconnect handling error: ${error.message}`);
    }
  }

  notifyAdminPanel(alert) {
    try {
      this.io.to('admin_room').emit('new_panic_alert', {
        alert,
        timestamp: new Date().toISOString(),
        priority: 'high'
      });

      this.logger.info(`Admin panel notified of new panic alert: ${alert.id}`);

    } catch (error) {
      this.logger.error(`Failed to notify admin panel: ${error.message}`);
    }
  }

  notifyAdminLocationUpdate(userId, locationData) {
    try {
      this.io.to('admin_room').emit('user_location_updated', {
        userId,
        location: locationData,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      this.logger.error(`Failed to notify admin of location update: ${error.message}`);
    }
  }

  async sendActiveAlertsToAdmin(adminSocket) {
    try {
      const activeAlerts = await this.alertService.getActiveAlerts();
      
      adminSocket.emit('active_alerts', {
        alerts: activeAlerts,
        count: activeAlerts.length,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      this.logger.error(`Failed to send active alerts to admin: ${error.message}`);
    }
  }

  startAlertLocationTracking(alertId, userId) {
    // This would start a timer to periodically get user location
    // and store it in the location_history table
    // Implementation depends on specific requirements
    this.logger.info(`Started location tracking for alert ${alertId} (user ${userId})`);
  }

  startHeartbeat() {
    setInterval(() => {
      this.io.emit('heartbeat', {
        timestamp: new Date().toISOString(),
        connectedClients: this.connectedClients.size,
        adminClients: this.adminClients.size
      });
    }, parseInt(process.env.WS_HEARTBEAT_INTERVAL) || 30000);
  }

  // Public methods for external use
  broadcastToAll(event, data) {
    this.io.emit(event, data);
  }

  broadcastToAdmins(event, data) {
    this.io.to('admin_room').emit(event, data);
  }

  broadcastToUser(userId, event, data) {
    const userSocket = this.connectedClients.get(userId);
    if (userSocket) {
      userSocket.emit(event, data);
    }
  }

  getConnectedUsersCount() {
    return this.connectedClients.size;
  }

  getAdminClientsCount() {
    return this.adminClients.size;
  }
}

module.exports = WebSocketManager;
