import { EventEmitter } from 'events';

class WebSocketManager extends EventEmitter {
    constructor() {
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.listeners = new Map();
        this.isConnecting = false;
    }

    connect() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            return Promise.resolve();
        }

        if (this.isConnecting) {
            return Promise.resolve();
        }

        this.isConnecting = true;

        return new Promise((resolve, reject) => {
            const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:8001/ws/operator/';
            
            this.ws = new WebSocket(wsUrl);

            this.ws.onopen = () => {
                console.log('WebSocket connected');
                this.isConnecting = false;
                this.reconnectAttempts = 0;
                this.emit('connected');
                resolve();
            };

            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleMessage(data);
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };

            this.ws.onclose = (event) => {
                console.log('WebSocket disconnected:', event.code, event.reason);
                this.isConnecting = false;
                this.emit('disconnected');
                
                if (this.reconnectAttempts < this.maxReconnectAttempts) {
                    this.scheduleReconnect();
                }
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.isConnecting = false;
                reject(error);
            };
        });
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }

    scheduleReconnect() {
        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
        
        setTimeout(() => {
            if (this.ws && this.ws.readyState === WebSocket.CLOSED) {
                this.connect().catch(console.error);
            }
        }, delay);
    }

    send(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        } else {
            console.error('WebSocket is not connected');
        }
    }

    handleMessage(data) {
        const { type, ...payload } = data;
        
        switch (type) {
            case 'incident.created':
                this.emit('incidentCreated', payload.incident);
                break;
            case 'incident.updated':
                this.emit('incidentUpdated', payload.incident);
                break;
            case 'incident.acknowledged':
                this.emit('incidentAcknowledged', payload);
                break;
            case 'chat.message':
                this.emit('chatMessage', payload);
                break;
            case 'connection.confirmed':
                this.emit('connectionConfirmed', payload);
                break;
            default:
                console.log('Unknown WebSocket message type:', type, payload);
        }
    }

    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    off(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('Error in event listener:', error);
                }
            });
        }
    }

    // Convenience methods for common operations
    joinIncident(incidentId) {
        this.send({
            action: 'join.incident',
            incident_id: incidentId
        });
    }

    sendChatMessage(incidentId, message) {
        this.send({
            action: 'chat.send',
            incident_id: incidentId,
            message: message
        });
    }

    acknowledgeIncident(incidentId) {
        this.send({
            action: 'incident.acknowledge',
            incident_id: incidentId
        });
    }
}

// Create and export a singleton instance
const wsManager = new WebSocketManager();
export default wsManager;

