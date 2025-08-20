class WebSocketService {
  constructor() {
    this.connections = new Map();
    this.reconnectAttempts = new Map();
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 5000;
    this.eventListeners = new Map();
  }

  /**
   * Connect to a WebSocket endpoint
   * @param {string} endpoint - WebSocket endpoint (e.g., 'alerts', 'admin/dashboard')
   * @param {Object} options - Connection options
   */
  connect(endpoint, options = {}) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/${endpoint}/`;
    
    if (this.connections.has(endpoint)) {
      console.warn(`WebSocket connection to ${endpoint} already exists`);
      return this.connections.get(endpoint);
    }

    try {
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log(`WebSocket connected: ${endpoint}`);
        this.reconnectAttempts.set(endpoint, 0);
        
        // Send authentication token
        const token = localStorage.getItem('access_token');
        if (token) {
          this.send(endpoint, { type: 'auth', token });
        }
        
        this.emit(endpoint, 'connected', { endpoint });
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log(`WebSocket message from ${endpoint}:`, data);
          this.emit(endpoint, 'message', data);
          
          // Emit specific event types
          if (data.type) {
            this.emit(endpoint, data.type, data);
          }
        } catch (error) {
          console.error(`Error parsing WebSocket message from ${endpoint}:`, error);
        }
      };

      ws.onerror = (error) => {
        console.error(`WebSocket error on ${endpoint}:`, error);
        this.emit(endpoint, 'error', error);
      };

      ws.onclose = (event) => {
        console.log(`WebSocket disconnected: ${endpoint}`, event.code, event.reason);
        this.connections.delete(endpoint);
        this.emit(endpoint, 'disconnected', { endpoint, event });
        
        // Attempt to reconnect if not a clean close
        if (!event.wasClean && options.autoReconnect !== false) {
          this.attemptReconnect(endpoint, options);
        }
      };

      this.connections.set(endpoint, ws);
      return ws;
    } catch (error) {
      console.error(`Failed to create WebSocket connection to ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Disconnect from a WebSocket endpoint
   * @param {string} endpoint - WebSocket endpoint
   */
  disconnect(endpoint) {
    const ws = this.connections.get(endpoint);
    if (ws) {
      ws.close(1000, 'Client disconnect');
      this.connections.delete(endpoint);
      this.eventListeners.delete(endpoint);
      this.reconnectAttempts.delete(endpoint);
    }
  }

  /**
   * Disconnect from all WebSocket connections
   */
  disconnectAll() {
    for (const endpoint of this.connections.keys()) {
      this.disconnect(endpoint);
    }
  }

  /**
   * Send a message to a WebSocket endpoint
   * @param {string} endpoint - WebSocket endpoint
   * @param {Object} message - Message to send
   */
  send(endpoint, message) {
    const ws = this.connections.get(endpoint);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    } else {
      console.warn(`Cannot send message to ${endpoint}: connection not ready`);
    }
  }

  /**
   * Check if connected to an endpoint
   * @param {string} endpoint - WebSocket endpoint
   */
  isConnected(endpoint) {
    const ws = this.connections.get(endpoint);
    return ws && ws.readyState === WebSocket.OPEN;
  }

  /**
   * Add event listener for an endpoint
   * @param {string} endpoint - WebSocket endpoint
   * @param {string} event - Event name
   * @param {Function} callback - Event callback
   */
  on(endpoint, event, callback) {
    const key = `${endpoint}:${event}`;
    if (!this.eventListeners.has(key)) {
      this.eventListeners.set(key, []);
    }
    this.eventListeners.get(key).push(callback);
  }

  /**
   * Remove event listener for an endpoint
   * @param {string} endpoint - WebSocket endpoint
   * @param {string} event - Event name
   * @param {Function} callback - Event callback
   */
  off(endpoint, event, callback) {
    const key = `${endpoint}:${event}`;
    const listeners = this.eventListeners.get(key);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit event for an endpoint
   * @param {string} endpoint - WebSocket endpoint
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(endpoint, event, data) {
    const key = `${endpoint}:${event}`;
    const listeners = this.eventListeners.get(key);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in WebSocket event listener for ${key}:`, error);
        }
      });
    }
  }

  /**
   * Attempt to reconnect to an endpoint
   * @param {string} endpoint - WebSocket endpoint
   * @param {Object} options - Connection options
   */
  attemptReconnect(endpoint, options = {}) {
    const attempts = this.reconnectAttempts.get(endpoint) || 0;
    
    if (attempts >= this.maxReconnectAttempts) {
      console.error(`Max reconnection attempts reached for ${endpoint}`);
      this.emit(endpoint, 'reconnect_failed', { endpoint, attempts });
      return;
    }

    const delay = this.reconnectDelay * Math.pow(2, attempts); // Exponential backoff
    console.log(`Attempting to reconnect to ${endpoint} in ${delay}ms (attempt ${attempts + 1})`);
    
    this.reconnectAttempts.set(endpoint, attempts + 1);
    
    setTimeout(() => {
      if (!this.connections.has(endpoint)) {
        this.connect(endpoint, options);
      }
    }, delay);
  }

  /**
   * Get connection status for all endpoints
   */
  getConnectionStatus() {
    const status = {};
    for (const [endpoint, ws] of this.connections) {
      status[endpoint] = {
        readyState: ws.readyState,
        connected: ws.readyState === WebSocket.OPEN,
        reconnectAttempts: this.reconnectAttempts.get(endpoint) || 0
      };
    }
    return status;
  }
}

// Specific service methods for different WebSocket endpoints

/**
 * Admin Dashboard WebSocket Service
 */
export class AdminDashboardWebSocket {
  constructor(webSocketService) {
    this.ws = webSocketService;
    this.endpoint = 'admin/dashboard';
  }

  connect() {
    return this.ws.connect(this.endpoint);
  }

  disconnect() {
    this.ws.disconnect(this.endpoint);
  }

  onStatsUpdate(callback) {
    this.ws.on(this.endpoint, 'stats_updated', callback);
  }

  onDashboardStats(callback) {
    this.ws.on(this.endpoint, 'dashboard_stats', callback);
  }

  requestStats() {
    this.ws.send(this.endpoint, { type: 'get_stats' });
  }
}

/**
 * Panic Alerts WebSocket Service
 */
export class PanicAlertsWebSocket {
  constructor(webSocketService) {
    this.ws = webSocketService;
    this.endpoint = 'alerts';
  }

  connect() {
    return this.ws.connect(this.endpoint);
  }

  disconnect() {
    this.ws.disconnect(this.endpoint);
  }

  onNewAlert(callback) {
    this.ws.on(this.endpoint, 'new_alert', callback);
  }

  onAlertAcknowledged(callback) {
    this.ws.on(this.endpoint, 'alert_acknowledged', callback);
  }

  onAlertResolved(callback) {
    this.ws.on(this.endpoint, 'alert_resolved', callback);
  }

  onLocationUpdate(callback) {
    this.ws.on(this.endpoint, 'location_update', callback);
  }

  onActiveAlerts(callback) {
    this.ws.on(this.endpoint, 'active_alerts', callback);
  }

  requestActiveAlerts() {
    this.ws.send(this.endpoint, { type: 'get_active_alerts' });
  }

  acknowledgeAlert(alertId) {
    this.ws.send(this.endpoint, { type: 'acknowledge_alert', alert_id: alertId });
  }

  resolveAlert(alertId, notes = '') {
    this.ws.send(this.endpoint, { type: 'resolve_alert', alert_id: alertId, notes });
  }
}

/**
 * Map Alerts WebSocket Service
 */
export class MapAlertsWebSocket {
  constructor(webSocketService) {
    this.ws = webSocketService;
    this.endpoint = 'map/alerts';
  }

  connect() {
    return this.ws.connect(this.endpoint);
  }

  disconnect() {
    this.ws.disconnect(this.endpoint);
  }

  onMapAlerts(callback) {
    this.ws.on(this.endpoint, 'map_alerts', callback);
  }

  onAlertUpdate(callback) {
    this.ws.on(this.endpoint, 'alert_update', callback);
  }

  requestMapAlerts() {
    this.ws.send(this.endpoint, { type: 'get_map_alerts' });
  }
}

/**
 * Alert-specific WebSocket Service
 */
export class AlertWebSocket {
  constructor(webSocketService, alertId) {
    this.ws = webSocketService;
    this.alertId = alertId;
    this.endpoint = `alerts/${alertId}`;
  }

  connect() {
    return this.ws.connect(this.endpoint);
  }

  disconnect() {
    this.ws.disconnect(this.endpoint);
  }

  onAlertUpdate(callback) {
    this.ws.on(this.endpoint, 'alert_updated', callback);
  }

  onAlertStatus(callback) {
    this.ws.on(this.endpoint, 'alert_status', callback);
  }

  requestStatus() {
    this.ws.send(this.endpoint, { type: 'get_status' });
  }

  cancelAlert() {
    this.ws.send(this.endpoint, { type: 'cancel_alert' });
  }
}

/**
 * Chat WebSocket Service
 */
export class ChatWebSocket {
  constructor(webSocketService, alertId) {
    this.ws = webSocketService;
    this.alertId = alertId;
    this.endpoint = `chat/${alertId}`;
  }

  connect() {
    return this.ws.connect(this.endpoint);
  }

  disconnect() {
    this.ws.disconnect(this.endpoint);
  }

  onChatMessage(callback) {
    this.ws.on(this.endpoint, 'chat_message', callback);
  }

  sendMessage(message) {
    this.ws.send(this.endpoint, { type: 'chat_message', message });
  }
}

// Create and export singleton instance
const webSocketService = new WebSocketService();

// Export specific services
export const adminDashboardWS = new AdminDashboardWebSocket(webSocketService);
export const panicAlertsWS = new PanicAlertsWebSocket(webSocketService);
export const mapAlertsWS = new MapAlertsWebSocket(webSocketService);

// Factory functions for alert-specific services
export const createAlertWebSocket = (alertId) => new AlertWebSocket(webSocketService, alertId);
export const createChatWebSocket = (alertId) => new ChatWebSocket(webSocketService, alertId);

export default webSocketService;
