import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { AlertTriangle, User, Clock, MapPin, Phone, Shield, AlertCircle } from 'lucide-react';
import apiService from '../services/api';
import { useToast } from './Toast';
import 'leaflet/dist/leaflet.css';

// Custom marker icons
const createAlertIcon = (status, priority) => {
  let color = '#ef4444'; // Default red
  let pulseColor = 'rgba(239, 68, 68, 0.6)';
  
  if (status === 'acknowledged') {
    color = '#f59e0b'; // Orange
    pulseColor = 'rgba(245, 158, 11, 0.6)';
  } else if (status === 'responding') {
    color = '#3b82f6'; // Blue
    pulseColor = 'rgba(59, 130, 246, 0.6)';
  }

  const size = priority >= 4 ? 40 : 32;
  const pulseSize = size + 20;

  return L.divIcon({
    className: 'custom-alert-marker',
    html: `
      <div class="alert-marker-container">
        <div class="alert-pulse" style="
          width: ${pulseSize}px; 
          height: ${pulseSize}px;
          background-color: ${pulseColor};
          border-radius: 50%;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation: pulse 2s infinite;
        "></div>
        <div class="alert-icon" style="
          width: ${size}px; 
          height: ${size}px; 
          background-color: ${color};
          border: 3px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: ${size > 35 ? '14px' : '12px'};
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          position: relative;
          z-index: 1000;
        ">⚠</div>
      </div>
      <style>
        @keyframes pulse {
          0% { transform: translate(-50%, -50%) scale(0.8); opacity: 1; }
          50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.5; }
          100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
        }
      </style>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2]
  });
};

const AlertMarker = ({ alert, onAcknowledge, onResolve, onViewDetails }) => {
  const formatDuration = (seconds) => {
    if (seconds < 60) return `${Math.floor(seconds)}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  const getPriorityText = (priority) => {
    switch (priority) {
      case 5: return 'Emergency';
      case 4: return 'Critical';
      case 3: return 'High';
      case 2: return 'Medium';
      default: return 'Low';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-red-600';
      case 'acknowledged': return 'text-orange-600';
      case 'responding': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <Marker
      position={[alert.latitude, alert.longitude]}
      icon={createAlertIcon(alert.status, alert.priority)}
    >
      <Popup minWidth={320} maxWidth={400} className="alert-popup">
        <div className="p-4 min-w-80">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
              <h3 className="font-semibold text-gray-900">
                {alert.alert_type.replace('_', ' ').toUpperCase()} ALERT
              </h3>
            </div>
            <span className={`px-2 py-1 text-xs rounded-full bg-gray-100 ${getStatusColor(alert.status)}`}>
              {alert.status.toUpperCase()}
            </span>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center">
              <User className="h-4 w-4 text-gray-500 mr-2" />
              <span className="font-medium">{alert.user}</span>
            </div>
            
            <div className="flex items-center">
              <Shield className="h-4 w-4 text-gray-500 mr-2" />
              <span>Priority: <strong>{getPriorityText(alert.priority)}</strong></span>
            </div>
            
            <div className="flex items-center">
              <Clock className="h-4 w-4 text-gray-500 mr-2" />
              <span>Duration: {formatDuration(alert.duration_seconds)}</span>
            </div>
            
            <div className="flex items-center">
              <MapPin className="h-4 w-4 text-gray-500 mr-2" />
              <span className="text-xs">
                {alert.latitude.toFixed(6)}, {alert.longitude.toFixed(6)}
              </span>
            </div>

            {alert.address && (
              <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                📍 {alert.address}
              </div>
            )}

            {alert.assigned_operator && (
              <div className="flex items-center">
                <User className="h-4 w-4 text-blue-500 mr-2" />
                <span>Operator: <strong>{alert.assigned_operator}</strong></span>
              </div>
            )}
          </div>

          <div className="flex space-x-2 mt-4">
            {alert.status === 'active' && (
              <button
                onClick={() => onAcknowledge(alert.id)}
                className="flex-1 px-3 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 text-sm font-medium"
              >
                Acknowledge
              </button>
            )}
            
            {['active', 'acknowledged'].includes(alert.status) && (
              <button
                onClick={() => onResolve(alert.id)}
                className="flex-1 px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm font-medium"
              >
                Resolve
              </button>
            )}
            
            <button
              onClick={() => onViewDetails(alert)}
              className="flex-1 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm font-medium"
            >
              Details
            </button>
          </div>
        </div>
      </Popup>
    </Marker>
  );
};

const MapController = ({ alerts, selectedAlert, onMapReady }) => {
  const map = useMap();

  useEffect(() => {
    if (onMapReady) {
      onMapReady(map);
    }
  }, [map, onMapReady]);

  // Center map on selected alert
  useEffect(() => {
    if (selectedAlert && map) {
      map.setView([selectedAlert.latitude, selectedAlert.longitude], 15);
    }
  }, [selectedAlert, map]);

  // Auto-fit bounds when alerts change
  useEffect(() => {
    if (alerts.length > 0 && map) {
      const group = new L.featureGroup(
        alerts.map(alert => 
          L.marker([alert.latitude, alert.longitude])
        )
      );
      
      if (alerts.length === 1) {
        map.setView([alerts[0].latitude, alerts[0].longitude], 15);
      } else {
        map.fitBounds(group.getBounds().pad(0.1));
      }
    }
  }, [alerts, map]);

  return null;
};

const AlertMap = ({ 
  className = '',
  height = '600px',
  showControls = true,
  selectedAlert = null,
  onAlertAction = null 
}) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wsConnection, setWsConnection] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [selectedAlertDetails, setSelectedAlertDetails] = useState(null);
  const { success, error: showError } = useToast();
  const reconnectTimeoutRef = useRef(null);

  // Fetch initial alerts
  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.request('/auth/alerts/map/');
      setAlerts(response.alerts || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching alerts:', err);
      setError('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  }, []);

  // WebSocket connection for real-time updates
  const connectWebSocket = useCallback(() => {
    if (wsConnection) {
      wsConnection.close();
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/map/alerts/`;
    
    try {
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('Map WebSocket connected');
        setError(null);
        
        // Send authentication token
        const token = localStorage.getItem('access_token');
        if (token) {
          ws.send(JSON.stringify({ type: 'auth', token }));
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'map_alerts':
              setAlerts(data.alerts || []);
              break;
              
            case 'alert_update':
              setAlerts(prev => {
                const updatedAlert = data.alert;
                const existingIndex = prev.findIndex(alert => alert.id === updatedAlert.id);
                
                if (existingIndex >= 0) {
                  // Update existing alert
                  const newAlerts = [...prev];
                  newAlerts[existingIndex] = updatedAlert;
                  return newAlerts;
                } else {
                  // Add new alert
                  return [...prev, updatedAlert];
                }
              });
              break;
              
            case 'error':
              console.error('WebSocket error:', data.message);
              setError(data.message);
              break;
              
            default:
              console.log('Unknown WebSocket message:', data);
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('Connection error');
      };

      ws.onclose = (event) => {
        console.log('Map WebSocket disconnected:', event.code);
        setWsConnection(null);
        
        // Attempt to reconnect after 5 seconds
        if (!event.wasClean) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('Attempting to reconnect WebSocket...');
            connectWebSocket();
          }, 5000);
        }
      };

      setWsConnection(ws);
    } catch (err) {
      console.error('Error creating WebSocket connection:', err);
      setError('Failed to connect to real-time updates');
    }
  }, [wsConnection]);

  // Initialize component
  useEffect(() => {
    fetchAlerts();
    connectWebSocket();

    return () => {
      if (wsConnection) {
        wsConnection.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  // Alert actions
  const handleAcknowledge = async (alertId) => {
    try {
      await apiService.request(`/auth/alerts/${alertId}/acknowledge/`, {
        method: 'POST'
      });
      success('Alert Acknowledged', 'Alert has been acknowledged successfully.');
      
      if (onAlertAction) {
        onAlertAction('acknowledge', alertId);
      }
    } catch (err) {
      showError('Action Failed', 'Failed to acknowledge alert.');
      console.error('Error acknowledging alert:', err);
    }
  };

  const handleResolve = async (alertId) => {
    try {
      const notes = prompt('Resolution notes (optional):');
      await apiService.request(`/auth/alerts/${alertId}/resolve/`, {
        method: 'POST',
        body: JSON.stringify({ notes: notes || '' })
      });
      success('Alert Resolved', 'Alert has been resolved successfully.');
      
      if (onAlertAction) {
        onAlertAction('resolve', alertId);
      }
    } catch (err) {
      showError('Action Failed', 'Failed to resolve alert.');
      console.error('Error resolving alert:', err);
    }
  };

  const handleViewDetails = (alert) => {
    setSelectedAlertDetails(alert);
  };

  const handleMapReady = (map) => {
    setMapInstance(map);
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-gray-50 rounded-lg ${className}`} style={{ height }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  if (error && alerts.length === 0) {
    return (
      <div className={`flex items-center justify-center bg-gray-50 rounded-lg ${className}`} style={{ height }}>
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 font-medium">Error loading map</p>
          <p className="text-gray-600 text-sm">{error}</p>
          <button
            onClick={fetchAlerts}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Controls */}
      {showControls && (
        <div className="absolute top-4 left-4 z-[1000] bg-white rounded-lg shadow-lg p-2">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">
              {alerts.length} Active Alert{alerts.length !== 1 ? 's' : ''}
            </span>
            {error && (
              <div className="flex items-center text-red-600 text-sm">
                <AlertCircle className="h-4 w-4 mr-1" />
                Connection issue
              </div>
            )}
            <button
              onClick={fetchAlerts}
              className="p-1 hover:bg-gray-100 rounded"
              title="Refresh"
            >
              🔄
            </button>
          </div>
        </div>
      )}

      {/* Map */}
      <MapContainer
        center={[40.7128, -74.0060]} // Default to NYC
        zoom={10}
        style={{ height, width: '100%' }}
        className="rounded-lg"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapController
          alerts={alerts}
          selectedAlert={selectedAlert}
          onMapReady={handleMapReady}
        />
        
        {alerts.map((alert) => (
          <AlertMarker
            key={alert.id}
            alert={alert}
            onAcknowledge={handleAcknowledge}
            onResolve={handleResolve}
            onViewDetails={handleViewDetails}
          />
        ))}
      </MapContainer>

      {/* Alert Details Modal */}
      {selectedAlertDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[2000]">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-semibold">Alert Details</h2>
              <button
                onClick={() => setSelectedAlertDetails(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-3 text-sm">
              <div><strong>User:</strong> {selectedAlertDetails.user}</div>
              <div><strong>Type:</strong> {selectedAlertDetails.alert_type.replace('_', ' ').toUpperCase()}</div>
              <div><strong>Status:</strong> 
                <span className={getStatusColor(selectedAlertDetails.status)}>
                  {' ' + selectedAlertDetails.status.toUpperCase()}
                </span>
              </div>
              <div><strong>Priority:</strong> {getPriorityText(selectedAlertDetails.priority)}</div>
              <div><strong>Location:</strong> {selectedAlertDetails.latitude.toFixed(6)}, {selectedAlertDetails.longitude.toFixed(6)}</div>
              {selectedAlertDetails.address && (
                <div><strong>Address:</strong> {selectedAlertDetails.address}</div>
              )}
              <div><strong>Created:</strong> {new Date(selectedAlertDetails.created_at).toLocaleString()}</div>
              {selectedAlertDetails.assigned_operator && (
                <div><strong>Assigned to:</strong> {selectedAlertDetails.assigned_operator}</div>
              )}
            </div>

            <div className="flex space-x-2 mt-6">
              <button
                onClick={() => {
                  if (mapInstance) {
                    mapInstance.setView([selectedAlertDetails.latitude, selectedAlertDetails.longitude], 18);
                  }
                  setSelectedAlertDetails(null);
                }}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                View on Map
              </button>
              <button
                onClick={() => setSelectedAlertDetails(null)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Utility function to get status color (outside component for reusability)
const getStatusColor = (status) => {
  switch (status) {
    case 'active': return 'text-red-600';
    case 'acknowledged': return 'text-orange-600';
    case 'responding': return 'text-blue-600';
    default: return 'text-gray-600';
  }
};

// Utility function to get priority text (outside component for reusability)
const getPriorityText = (priority) => {
  switch (priority) {
    case 5: return 'Emergency';
    case 4: return 'Critical';
    case 3: return 'High';
    case 2: return 'Medium';
    default: return 'Low';
  }
};

export default AlertMap;
