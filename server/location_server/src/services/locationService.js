const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

class LocationService {
  constructor(databaseManager) {
    this.db = databaseManager;
    this.googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
  }

  async updateUserLocation(locationData) {
    try {
      const { userId, latitude, longitude, accuracy, altitude, speed, heading, provider, batteryLevel, deviceInfo, networkInfo } = locationData;

      // Validate coordinates
      if (!this.isValidCoordinates(latitude, longitude)) {
        throw new Error('Invalid coordinates provided');
      }

      // Get reverse geocoded address from Google Maps API
      const address = await this.reverseGeocode(latitude, longitude);

      // Update or insert user location
      const updateQuery = `
        INSERT INTO user_locations 
        (user_id, latitude, longitude, accuracy, altitude, speed, heading, provider, battery_level, device_info, network_info, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE
        latitude = VALUES(latitude),
        longitude = VALUES(longitude),
        accuracy = VALUES(accuracy),
        altitude = VALUES(altitude),
        speed = VALUES(speed),
        heading = VALUES(heading),
        provider = VALUES(provider),
        battery_level = VALUES(battery_level),
        device_info = VALUES(device_info),
        network_info = VALUES(network_info),
        updated_at = NOW()
      `;

      const params = [
        userId, latitude, longitude, accuracy || 0, 
        altitude || null, speed || null, heading || null,
        provider || 'gps', batteryLevel || null,
        JSON.stringify(deviceInfo || {}), JSON.stringify(networkInfo || {})
      ];

      await this.db.execute(updateQuery, params);

      // Store in location history
      await this.storeLocationHistory({
        userId,
        latitude,
        longitude,
        accuracy,
        altitude,
        speed,
        heading,
        provider,
        batteryLevel,
        timestamp: new Date()
      });

      // Return updated location data
      const locationQuery = `
        SELECT * FROM user_locations 
        WHERE user_id = ? 
        ORDER BY updated_at DESC 
        LIMIT 1
      `;
      
      const [location] = await this.db.execute(locationQuery, [userId]);
      
      return {
        ...location,
        address: address || null
      };

    } catch (error) {
      throw new Error(`Failed to update user location: ${error.message}`);
    }
  }

  async storeLocationHistory(locationData) {
    try {
      const { userId, alertId, latitude, longitude, accuracy, altitude, speed, heading, provider, batteryLevel, timestamp } = locationData;

      const insertQuery = `
        INSERT INTO location_history 
        (user_id, alert_id, latitude, longitude, accuracy, altitude, speed, heading, provider, battery_level, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        userId, alertId || null, latitude, longitude, accuracy || 0,
        altitude || null, speed || null, heading || null,
        provider || 'gps', batteryLevel || null, timestamp || new Date()
      ];

      await this.db.execute(insertQuery, params);

    } catch (error) {
      throw new Error(`Failed to store location history: ${error.message}`);
    }
  }

  async getUserLocation(userId) {
    try {
      const query = `
        SELECT * FROM user_locations 
        WHERE user_id = ? 
        ORDER BY updated_at DESC 
        LIMIT 1
      `;
      
      const [location] = await this.db.execute(query, [userId]);
      
      if (!location) {
        return null;
      }

      // Get reverse geocoded address
      if (location.latitude && location.longitude) {
        location.address = await this.reverseGeocode(location.latitude, location.longitude);
      }

      return location;

    } catch (error) {
      throw new Error(`Failed to get user location: ${error.message}`);
    }
  }

  async getLocationHistory(userId, limit = 50) {
    try {
      const query = `
        SELECT * FROM location_history 
        WHERE user_id = ? 
        ORDER BY timestamp DESC 
        LIMIT ?
      `;
      
      const history = await this.db.execute(query, [userId, limit]);
      
      // Get addresses for each location
      for (const location of history) {
        if (location.latitude && location.longitude) {
          location.address = await this.reverseGeocode(location.latitude, location.longitude);
        }
      }

      return history;

    } catch (error) {
      throw new Error(`Failed to get location history: ${error.message}`);
    }
  }

  async getUsersInRadius(centerLat, centerLng, radiusKm, limit = 100) {
    try {
      // Haversine formula to find users within radius
      const query = `
        SELECT 
          ul.*,
          (6371 * acos(cos(radians(?)) * cos(radians(latitude)) * 
           cos(radians(longitude) - radians(?)) + 
           sin(radians(?)) * sin(radians(latitude)))) AS distance
        FROM user_locations ul
        HAVING distance <= ?
        ORDER BY distance
        LIMIT ?
      `;

      const users = await this.db.execute(query, [centerLat, centerLng, centerLat, radiusKm, limit]);
      
      // Get addresses for each location
      for (const user of users) {
        if (user.latitude && user.longitude) {
          user.address = await this.reverseGeocode(user.latitude, user.longitude);
        }
      }

      return users;

    } catch (error) {
      throw new Error(`Failed to get users in radius: ${error.message}`);
    }
  }

  async reverseGeocode(latitude, longitude) {
    try {
      if (!this.googleMapsApiKey) {
        return null;
      }

      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${this.googleMapsApiKey}`,
        { timeout: 5000 }
      );

      if (response.data.status === 'OK' && response.data.results.length > 0) {
        return response.data.results[0].formatted_address;
      }

      return null;

    } catch (error) {
      // Log error but don't fail the location update
      console.warn('Reverse geocoding failed:', error.message);
      return null;
    }
  }

  async cleanupOldLocations() {
    try {
      // Remove location history older than 30 days
      const cleanupQuery = `
        DELETE FROM location_history 
        WHERE timestamp < DATE_SUB(NOW(), INTERVAL 30 DAY)
      `;

      const result = await this.db.execute(cleanupQuery);
      
      return {
        deletedRows: result.affectedRows,
        message: `Cleaned up ${result.affectedRows} old location records`
      };

    } catch (error) {
      throw new Error(`Failed to cleanup old locations: ${error.message}`);
    }
  }

  async getLocationStats(userId) {
    try {
      const statsQuery = `
        SELECT 
          COUNT(*) as total_locations,
          MIN(timestamp) as first_location,
          MAX(timestamp) as last_location,
          AVG(accuracy) as avg_accuracy,
          COUNT(DISTINCT DATE(timestamp)) as active_days
        FROM location_history 
        WHERE user_id = ?
      `;

      const [stats] = await this.db.execute(statsQuery, [userId]);
      
      if (stats.total_locations > 0) {
        stats.first_location = new Date(stats.first_location);
        stats.last_location = new Date(stats.last_location);
        stats.avg_accuracy = parseFloat(stats.avg_accuracy || 0);
        stats.active_days = parseInt(stats.active_days || 0);
      }

      return stats;

    } catch (error) {
      throw new Error(`Failed to get location stats: ${error.message}`);
    }
  }

  isValidCoordinates(latitude, longitude) {
    return (
      typeof latitude === 'number' && 
      typeof longitude === 'number' &&
      latitude >= -90 && latitude <= 90 &&
      longitude >= -180 && longitude <= 180
    );
  }

  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }
}

module.exports = LocationService;
