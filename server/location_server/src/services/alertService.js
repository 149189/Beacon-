const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

class AlertService {
  constructor(databaseManager) {
    this.db = databaseManager;
    this.djangoServerUrl = process.env.DJANGO_SERVER_URL || 'http://localhost:8000';
  }

  async createPanicAlert(alertData) {
    try {
      const { userId, latitude, longitude, accuracy, alertType, description, deviceInfo, networkInfo } = alertData;

      // Generate unique alert ID
      const alertId = uuidv4();

      // Get reverse geocoded address
      const address = await this.getAddressFromCoordinates(latitude, longitude);

      // Create alert record
      const insertQuery = `
        INSERT INTO location_alerts 
        (id, user_id, alert_type, status, priority, latitude, longitude, accuracy, address, description, device_info, network_info, created_at)
        VALUES (?, ?, ?, 'active', 4, ?, ?, ?, ?, ?, ?, ?, NOW())
      `;

      const params = [
        alertId, userId, alertType || 'panic_button', latitude, longitude, 
        accuracy || 0, address, description || '', 
        JSON.stringify(deviceInfo || {}), JSON.stringify(networkInfo || {})
      ];

      await this.db.execute(insertQuery, params);

      // Store location in history with alert ID
      await this.storeAlertLocation({
        userId,
        alertId,
        latitude,
        longitude,
        accuracy,
        timestamp: new Date()
      });

      // Get the created alert
      const alertQuery = `
        SELECT * FROM location_alerts WHERE id = ?
      `;
      
      const [alert] = await this.db.execute(alertQuery, [alertId]);

      // Send notification to Django server if configured
      await this.notifyDjangoServer(alert);

      return alert;

    } catch (error) {
      throw new Error(`Failed to create panic alert: ${error.message}`);
    }
  }

  async getActiveAlerts(limit = 100) {
    try {
      const query = `
        SELECT * FROM location_alerts 
        WHERE status IN ('active', 'acknowledged', 'responding')
        ORDER BY created_at DESC 
        LIMIT ?
      `;
      
      const alerts = await this.db.execute(query, [limit]);
      
      // Get addresses for each alert
      for (const alert of alerts) {
        if (!alert.address && alert.latitude && alert.longitude) {
          alert.address = await this.getAddressFromCoordinates(alert.latitude, alert.longitude);
        }
      }

      return alerts;

    } catch (error) {
      throw new Error(`Failed to get active alerts: ${error.message}`);
    }
  }

  async getAlertById(alertId) {
    try {
      const query = `
        SELECT * FROM location_alerts WHERE id = ?
      `;
      
      const [alert] = await this.db.execute(query, [alertId]);
      
      if (!alert) {
        return null;
      }

      // Get address if not available
      if (!alert.address && alert.latitude && alert.longitude) {
        alert.address = await this.getAddressFromCoordinates(alert.latitude, alert.longitude);
      }

      return alert;

    } catch (error) {
      throw new Error(`Failed to get alert: ${error.message}`);
    }
  }

  async updateAlertStatus(alertId, status, operatorId = null, notes = '') {
    try {
      const updateQuery = `
        UPDATE location_alerts 
        SET status = ?, updated_at = NOW()
        ${operatorId ? ', assigned_operator = ?' : ''}
        ${notes ? ', operator_notes = ?' : ''}
        ${status === 'acknowledged' ? ', acknowledged_at = NOW()' : ''}
        ${status === 'resolved' ? ', resolved_at = NOW()' : ''}
        WHERE id = ?
      `;

      const params = [status];
      if (operatorId) params.push(operatorId);
      if (notes) params.push(notes);
      params.push(alertId);

      await this.db.execute(updateQuery, params);

      // Get updated alert
      return await this.getAlertById(alertId);

    } catch (error) {
      throw new Error(`Failed to update alert status: ${error.message}`);
    }
  }

  async assignOperator(alertId, operatorId) {
    try {
      const updateQuery = `
        UPDATE location_alerts 
        SET assigned_operator = ?, updated_at = NOW()
        WHERE id = ?
      `;

      await this.db.execute(updateQuery, [operatorId, alertId]);

      return await this.getAlertById(alertId);

    } catch (error) {
      throw new Error(`Failed to assign operator: ${error.message}`);
    }
  }

  async addOperatorNotes(alertId, notes) {
    try {
      const updateQuery = `
        UPDATE location_alerts 
        SET operator_notes = CONCAT(COALESCE(operator_notes, ''), '\n', ?), updated_at = NOW()
        WHERE id = ?
      `;

      await this.db.execute(updateQuery, [notes, alertId]);

      return await this.getAlertById(alertId);

    } catch (error) {
      throw new Error(`Failed to add operator notes: ${error.message}`);
    }
  }

  async getAlertsByUser(userId, limit = 50) {
    try {
      const query = `
        SELECT * FROM location_alerts 
        WHERE user_id = ?
        ORDER BY created_at DESC 
        LIMIT ?
      `;
      
      const alerts = await this.db.execute(query, [userId, limit]);
      
      // Get addresses for each alert
      for (const alert of alerts) {
        if (!alert.address && alert.latitude && alert.longitude) {
          alert.address = await this.getAddressFromCoordinates(alert.latitude, alert.longitude);
        }
      }

      return alerts;

    } catch (error) {
      throw new Error(`Failed to get user alerts: ${error.message}`);
    }
  }

  async getAlertsByStatus(status, limit = 100) {
    try {
      const query = `
        SELECT * FROM location_alerts 
        WHERE status = ?
        ORDER BY created_at DESC 
        LIMIT ?
      `;
      
      const alerts = await this.db.execute(query, [status, limit]);
      
      // Get addresses for each alert
      for (const alert of alerts) {
        if (!alert.address && alert.latitude && alert.longitude) {
          alert.address = await this.getAddressFromCoordinates(alert.latitude, alert.longitude);
        }
      }

      return alerts;

    } catch (error) {
      throw new Error(`Failed to get alerts by status: ${error.message}`);
    }
  }

  async getAlertsByPriority(priority, limit = 100) {
    try {
      const query = `
        SELECT * FROM location_alerts 
        WHERE priority = ?
        ORDER BY created_at DESC 
        LIMIT ?
      `;
      
      const alerts = await this.db.execute(query, [priority, limit]);
      
      // Get addresses for each alert
      for (const alert of alerts) {
        if (!alert.address && alert.latitude && alert.longitude) {
          alert.address = await this.getAddressFromCoordinates(alert.latitude, alert.longitude);
        }
      }

      return alerts;

    } catch (error) {
      throw new Error(`Failed to get alerts by priority: ${error.message}`);
    }
  }

  async getAlertStats() {
    try {
      const statsQuery = `
        SELECT 
          COUNT(*) as total_alerts,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_alerts,
          COUNT(CASE WHEN status = 'acknowledged' THEN 1 END) as acknowledged_alerts,
          COUNT(CASE WHEN status = 'responding' THEN 1 END) as responding_alerts,
          COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_alerts,
          COUNT(CASE WHEN status = 'false_alarm' THEN 1 END) as false_alarms,
          COUNT(CASE WHEN priority = 5 THEN 1 END) as emergency_alerts,
          COUNT(CASE WHEN priority = 4 THEN 1 END) as critical_alerts,
          AVG(CASE WHEN resolved_at IS NOT NULL THEN TIMESTAMPDIFF(MINUTE, created_at, resolved_at) END) as avg_resolution_time
        FROM location_alerts
      `;

      const [stats] = await this.db.execute(statsQuery);
      
      return {
        totalAlerts: parseInt(stats.total_alerts || 0),
        activeAlerts: parseInt(stats.active_alerts || 0),
        acknowledgedAlerts: parseInt(stats.acknowledged_alerts || 0),
        respondingAlerts: parseInt(stats.responding_alerts || 0),
        resolvedAlerts: parseInt(stats.resolved_alerts || 0),
        falseAlarms: parseInt(stats.false_alarms || 0),
        emergencyAlerts: parseInt(stats.emergency_alerts || 0),
        criticalAlerts: parseInt(stats.critical_alerts || 0),
        avgResolutionTime: parseFloat(stats.avg_resolution_time || 0)
      };

    } catch (error) {
      throw new Error(`Failed to get alert stats: ${error.message}`);
    }
  }

  async storeAlertLocation(locationData) {
    try {
      const { userId, alertId, latitude, longitude, accuracy, altitude, speed, heading, provider, batteryLevel, timestamp } = locationData;

      const insertQuery = `
        INSERT INTO location_history 
        (user_id, alert_id, latitude, longitude, accuracy, altitude, speed, heading, provider, battery_level, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        userId, alertId, latitude, longitude, accuracy || 0,
        altitude || null, speed || null, heading || null,
        provider || 'gps', batteryLevel || null, timestamp || new Date()
      ];

      await this.db.execute(insertQuery, params);

    } catch (error) {
      throw new Error(`Failed to store alert location: ${error.message}`);
    }
  }

  async getAddressFromCoordinates(latitude, longitude) {
    try {
      const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
      
      if (!googleMapsApiKey) {
        return null;
      }

      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${googleMapsApiKey}`,
        { timeout: 5000 }
      );

      if (response.data.status === 'OK' && response.data.results.length > 0) {
        return response.data.results[0].formatted_address;
      }

      return null;

    } catch (error) {
      console.warn('Reverse geocoding failed:', error.message);
      return null;
    }
  }

  async notifyDjangoServer(alert) {
    try {
      if (!this.djangoServerUrl) {
        return;
      }

      // Send alert to Django server for additional processing
      await axios.post(`${this.djangoServerUrl}/api/location-alerts/`, {
        alert_id: alert.id,
        user_id: alert.user_id,
        alert_type: alert.alert_type,
        status: alert.status,
        priority: alert.priority,
        latitude: alert.latitude,
        longitude: alert.longitude,
        accuracy: alert.accuracy,
        address: alert.address,
        description: alert.description,
        created_at: alert.created_at
      }, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

    } catch (error) {
      console.warn('Failed to notify Django server:', error.message);
    }
  }

  async searchAlerts(searchParams) {
    try {
      const { userId, status, priority, alertType, startDate, endDate, limit = 100 } = searchParams;
      
      let whereClause = 'WHERE 1=1';
      const params = [];

      if (userId) {
        whereClause += ' AND user_id = ?';
        params.push(userId);
      }

      if (status) {
        whereClause += ' AND status = ?';
        params.push(status);
      }

      if (priority) {
        whereClause += ' AND priority = ?';
        params.push(priority);
      }

      if (alertType) {
        whereClause += ' AND alert_type = ?';
        params.push(alertType);
      }

      if (startDate) {
        whereClause += ' AND created_at >= ?';
        params.push(startDate);
      }

      if (endDate) {
        whereClause += ' AND created_at <= ?';
        params.push(endDate);
      }

      const query = `
        SELECT * FROM location_alerts 
        ${whereClause}
        ORDER BY created_at DESC 
        LIMIT ?
      `;

      params.push(limit);
      const alerts = await this.db.execute(query, params);
      
      // Get addresses for each alert
      for (const alert of alerts) {
        if (!alert.address && alert.latitude && alert.longitude) {
          alert.address = await this.getAddressFromCoordinates(alert.latitude, alert.longitude);
        }
      }

      return alerts;

    } catch (error) {
      throw new Error(`Failed to search alerts: ${error.message}`);
    }
  }
}

module.exports = AlertService;
