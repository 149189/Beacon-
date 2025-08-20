import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { MapPin, AlertTriangle, Users, Clock, Navigation, Phone, MessageSquare } from 'lucide-react';

const LocationTracking = () => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [userLocations, setUserLocations] = useState([]);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [adminId, setAdminId] = useState('1'); // Default admin ID
  const [adminName, setAdminName] = useState('Admin User');
  const [notes, setNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [mapCenter, setMapCenter] = useState({ lat: 0, lng: 0 });
  const mapRef = useRef(null);
  const googleMapRef = useRef(null);

  useEffect(() => {
    // Initialize WebSocket connection
    const newSocket = io('http://localhost:3001');
    
    newSocket.on('connect', () => {
      console.log('Connected to location server');
      setConnected(true);
      
      // Authenticate as admin
      newSocket.emit('admin_connect', {
        adminId: adminId,
        adminName: adminName
      });
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from location server');
      setConnected(false);
    });

    newSocket.on('admin_connected', (data) => {
      console.log('Admin connected:', data);
    });

    newSocket.on('new_panic_alert', (data) => {
      console.log('New panic alert:', data);
      setActiveAlerts(prev => [data.alert, ...prev]);
      
      // Show notification
      if (data.alert.priority >= 4) {
        showNotification('🚨 NEW PANIC ALERT!', `User ${data.alert.user_id} triggered a panic alert`);
      }
    });

    newSocket.on('active_alerts', (data) => {
      console.log('Active alerts received:', data);
      setActiveAlerts(data.alerts);
    });

    newSocket.on('user_location_updated', (data) => {
      console.log('User location updated:', data);
      setUserLocations(prev => {
        const existing = prev.find(loc => loc.user_id === data.userId);
        if (existing) {
          return prev.map(loc => 
            loc.user_id === data.userId ? { ...loc, ...data.location } : loc
          );
        } else {
          return [...prev, { user_id: data.userId, ...data.location }];
        }
      });
    });

    newSocket.on('alert_acknowledged', (data) => {
      console.log('Alert acknowledged:', data);
      setActiveAlerts(prev => 
        prev.map(alert => 
          alert.id === data.alertId 
            ? { ...alert, status: 'acknowledged', acknowledged_at: data.acknowledgedAt }
            : alert
        )
      );
    });

    newSocket.on('alert_resolved', (data) => {
      console.log('Alert resolved:', data);
      setActiveAlerts(prev => 
        prev.map(alert => 
          alert.id === data.alertId 
            ? { ...alert, status: 'resolved', resolved_at: data.resolvedAt }
            : alert
        )
      );
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [adminId, adminName]);

  useEffect(() => {
    // Initialize Google Maps
    if (window.google && !googleMapRef.current) {
      initializeMap();
    }
  }, [activeAlerts, userLocations]);

  const initializeMap = () => {
    if (!mapRef.current) return;

    const map = new window.google.maps.Map(mapRef.current, {
      zoom: 12,
      center: { lat: 37.7749, lng: -122.4194 }, // Default to San Francisco
      mapTypeId: window.google.maps.MapTypeId.ROADMAP,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    });

    googleMapRef.current = map;

    // Add markers for active alerts
    activeAlerts.forEach(alert => {
      if (alert.latitude && alert.longitude) {
        const marker = new window.google.maps.Marker({
          position: { lat: parseFloat(alert.latitude), lng: parseFloat(alert.longitude) },
          map: map,
          title: `Alert ${alert.id}`,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" fill="${alert.priority >= 4 ? '#ef4444' : '#f59e0b'}"/>
                <path d="M12 6v6l4 2" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            `),
            scaledSize: new window.google.maps.Size(24, 24)
          }
        });

        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 10px; min-width: 200px;">
              <h3 style="margin: 0 0 10px 0; color: #1f2937;">Panic Alert</h3>
              <p style="margin: 5px 0;"><strong>User ID:</strong> ${alert.user_id}</p>
              <p style="margin: 5px 0;"><strong>Type:</strong> ${alert.alert_type}</p>
              <p style="margin: 5px 0;"><strong>Status:</strong> ${alert.status}</p>
              <p style="margin: 5px 0;"><strong>Priority:</strong> ${alert.priority}</p>
              <p style="margin: 5px 0;"><strong>Address:</strong> ${alert.address || 'Unknown'}</p>
              <p style="margin: 5px 0;"><strong>Time:</strong> ${new Date(alert.created_at).toLocaleString()}</p>
            </div>
          `
        });

        marker.addListener('click', () => {
          infoWindow.open(map, marker);
          setSelectedAlert(alert);
        });
      }
    });

    // Add markers for user locations
    userLocations.forEach(location => {
      if (location.latitude && location.longitude) {
        const marker = new window.google.maps.Marker({
          position: { lat: parseFloat(location.latitude), lng: parseFloat(location.longitude) },
          map: map,
          title: `User ${location.user_id}`,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="8" fill="#3b82f6"/>
                <circle cx="12" cy="12" r="3" fill="white"/>
              </svg>
            `),
            scaledSize: new window.google.maps.Size(20, 20)
          }
        });

        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 10px; min-width: 200px;">
              <h3 style="margin: 0 0 10px 0; color: #1f2937;">User Location</h3>
              <p style="margin: 5px 0;"><strong>User ID:</strong> ${location.user_id}</p>
              <p style="margin: 5px 0;"><strong>Accuracy:</strong> ${location.accuracy}m</p>
              <p style="margin: 5px 0;"><strong>Provider:</strong> ${location.provider}</p>
              <p style="margin: 5px 0;"><strong>Updated:</strong> ${new Date(location.updated_at).toLocaleString()}</p>
            </div>
          `
        });

        marker.addListener('click', () => {
          infoWindow.open(map, marker);
        });
      }
    });
  };

  const handleAcknowledgeAlert = (alertId) => {
    if (socket && notes.trim()) {
      socket.emit('acknowledge_alert', {
        alertId,
        adminId,
        notes: notes.trim()
      });
      setNotes('');
      setSelectedAlert(null);
    }
  };

  const handleResolveAlert = (alertId) => {
    if (socket && notes.trim()) {
      socket.emit('resolve_alert', {
        alertId,
        adminId,
        resolutionNotes: notes.trim()
      });
      setNotes('');
      setSelectedAlert(null);
    }
  };

  const showNotification = (title, body) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification(title, { body });
        }
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-red-500';
      case 'acknowledged': return 'bg-yellow-500';
      case 'responding': return 'bg-blue-500';
      case 'resolved': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 5: return 'bg-red-600';
      case 4: return 'bg-orange-600';
      case 3: return 'bg-yellow-600';
      case 2: return 'bg-blue-600';
      default: return 'bg-gray-600';
    }
  };

  const filteredAlerts = activeAlerts.filter(alert => {
    const matchesSearch = alert.user_id.toString().includes(searchTerm) ||
                         (alert.address && alert.address.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || alert.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || alert.priority.toString() === filterPriority;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Location Tracking</h1>
          <p className="text-gray-600">Real-time user locations and panic alerts</p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant={connected ? 'default' : 'destructive'}>
            {connected ? 'Connected' : 'Disconnected'}
          </Badge>
          <div className="text-sm text-gray-500">
            {activeAlerts.length} Active Alerts
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map View */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>Live Map</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                ref={mapRef} 
                className="w-full h-96 rounded-lg border"
                style={{ minHeight: '400px' }}
              />
            </CardContent>
          </Card>
        </div>

        {/* Alerts Panel */}
        <div className="space-y-4">
          {/* Search and Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="search">Search</Label>
                  <Input
                    id="search"
                    placeholder="Search by user ID or address..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <select
                      id="status"
                      className="w-full p-2 border rounded-md"
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="acknowledged">Acknowledged</option>
                      <option value="responding">Responding</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <select
                      id="priority"
                      className="w-full p-2 border rounded-md"
                      value={filterPriority}
                      onChange={(e) => setFilterPriority(e.target.value)}
                    >
                      <option value="all">All Priority</option>
                      <option value="5">Emergency (5)</option>
                      <option value="4">Critical (4)</option>
                      <option value="3">High (3)</option>
                      <option value="2">Medium (2)</option>
                      <option value="1">Low (1)</option>
                    </select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <span>Active Alerts</span>
                <Badge variant="secondary">{filteredAlerts.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredAlerts.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">No alerts found</p>
                ) : (
                  filteredAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedAlert?.id === alert.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedAlert(alert)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge className={getStatusColor(alert.status)}>
                              {alert.status}
                            </Badge>
                            <Badge className={getPriorityColor(alert.priority)}>
                              P{alert.priority}
                            </Badge>
                          </div>
                          <p className="font-medium text-sm">User {alert.user_id}</p>
                          <p className="text-xs text-gray-600">
                            {alert.address || `${alert.latitude}, ${alert.longitude}`}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(alert.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Alert Details Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Alert Details</h3>
            
            <div className="space-y-3 mb-4">
              <div>
                <Label className="text-sm font-medium">User ID</Label>
                <p className="text-sm text-gray-600">{selectedAlert.user_id}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Alert Type</Label>
                <p className="text-sm text-gray-600">{selectedAlert.alert_type}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Status</Label>
                <Badge className={getStatusColor(selectedAlert.status)}>
                  {selectedAlert.status}
                </Badge>
              </div>
              <div>
                <Label className="text-sm font-medium">Priority</Label>
                <Badge className={getPriorityColor(selectedAlert.priority)}>
                  P{selectedAlert.priority}
                </Badge>
              </div>
              <div>
                <Label className="text-sm font-medium">Location</Label>
                <p className="text-sm text-gray-600">
                  {selectedAlert.address || `${selectedAlert.latitude}, ${selectedAlert.longitude}`}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Created</Label>
                <p className="text-sm text-gray-600">
                  {new Date(selectedAlert.created_at).toLocaleString()}
                </p>
              </div>
              {selectedAlert.description && (
                <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <p className="text-sm text-gray-600">{selectedAlert.description}</p>
                </div>
              )}
            </div>

            <div className="space-y-3 mb-4">
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                className="w-full p-2 border rounded-md"
                rows="3"
                placeholder="Add notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="flex space-x-2">
              {selectedAlert.status === 'active' && (
                <Button
                  onClick={() => handleAcknowledgeAlert(selectedAlert.id)}
                  disabled={!notes.trim()}
                  className="flex-1"
                >
                  Acknowledge
                </Button>
              )}
              {selectedAlert.status !== 'resolved' && (
                <Button
                  onClick={() => handleResolveAlert(selectedAlert.id)}
                  disabled={!notes.trim()}
                  variant="outline"
                  className="flex-1"
                >
                  Resolve
                </Button>
              )}
              <Button
                onClick={() => setSelectedAlert(null)}
                variant="ghost"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationTracking;
