import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AlertMap from '../components/AlertMap';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { 
  Map, 
  Layers, 
  Filter,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users
} from 'lucide-react';

const MapView = () => {
  const { user } = useAuth();
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  if (!user?.isStaff) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-gray-600">You need administrator privileges to view the map.</p>
        </div>
      </div>
    );
  }

  const handleAlertAction = (action, alertId) => {
    console.log(`Alert ${action}: ${alertId}`);
    // Refresh the map or handle the action result
  };

  const statusFilters = [
    { value: 'all', label: 'All Alerts', color: 'bg-gray-500' },
    { value: 'active', label: 'Active', color: 'bg-red-500' },
    { value: 'acknowledged', label: 'Acknowledged', color: 'bg-orange-500' },
    { value: 'responding', label: 'Responding', color: 'bg-blue-500' }
  ];

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Map className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-semibold text-gray-900">
              Emergency Alert Map
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            {/* Status Filters */}
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <div className="flex space-x-1">
                {statusFilters.map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => setFilterStatus(filter.value)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      filterStatus === filter.value
                        ? `text-white ${filter.color}`
                        : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="w-px h-6 bg-gray-300" />

            {/* Map Controls */}
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Layers className="h-4 w-4 mr-2" />
                Layers
              </Button>
              
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Map */}
        <div className="flex-1">
          <AlertMap
            height="100%"
            selectedAlert={selectedAlert}
            onAlertAction={handleAlertAction}
            className="h-full"
          />
        </div>

        {/* Sidebar */}
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Alert Details</h2>
            <p className="text-sm text-gray-600">
              Select an alert on the map to view details
            </p>
          </div>

          {/* Alert Details */}
          <div className="flex-1 overflow-y-auto">
            {selectedAlert ? (
              <div className="p-4 space-y-4">
                {/* Alert Header */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center text-lg">
                      <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                      {selectedAlert.alert_type.replace('_', ' ').toUpperCase()}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        selectedAlert.status === 'active' ? 'bg-red-100 text-red-800' :
                        selectedAlert.status === 'acknowledged' ? 'bg-orange-100 text-orange-800' :
                        selectedAlert.status === 'responding' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedAlert.status.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">User:</span>
                      <span className="font-medium">{selectedAlert.user}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Priority:</span>
                      <span className="font-medium">
                        {selectedAlert.priority >= 4 ? 'Critical' : 'Normal'}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Location Info */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Location Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-sm">
                      <span className="text-gray-600">Coordinates:</span>
                      <br />
                      <span className="font-mono text-xs">
                        {selectedAlert.latitude.toFixed(6)}, {selectedAlert.longitude.toFixed(6)}
                      </span>
                    </div>
                    
                    {selectedAlert.address && (
                      <div className="text-sm">
                        <span className="text-gray-600">Address:</span>
                        <br />
                        <span>{selectedAlert.address}</span>
                      </div>
                    )}
                    
                    <div className="text-sm">
                      <span className="text-gray-600">Accuracy:</span>{' '}
                      {selectedAlert.accuracy ? `±${selectedAlert.accuracy}m` : 'Unknown'}
                    </div>
                  </CardContent>
                </Card>

                {/* Timeline */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Timeline</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-sm">
                      <span className="text-gray-600">Created:</span>
                      <br />
                      <span>{new Date(selectedAlert.created_at).toLocaleString()}</span>
                    </div>
                    
                    <div className="text-sm">
                      <span className="text-gray-600">Duration:</span>
                      <br />
                      <span>{Math.floor(selectedAlert.duration_seconds / 60)}m {selectedAlert.duration_seconds % 60}s</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Actions */}
                <div className="space-y-2">
                  {selectedAlert.status === 'active' && (
                    <Button 
                      className="w-full bg-orange-500 hover:bg-orange-600"
                      onClick={() => handleAlertAction('acknowledge', selectedAlert.id)}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Acknowledge Alert
                    </Button>
                  )}
                  
                  {['active', 'acknowledged'].includes(selectedAlert.status) && (
                    <Button 
                      className="w-full bg-green-500 hover:bg-green-600"
                      onClick={() => handleAlertAction('resolve', selectedAlert.id)}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Resolve Alert
                    </Button>
                  )}
                  
                  <Button 
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      // Focus on alert location
                      console.log('Focus on alert');
                    }}
                  >
                    Focus on Location
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center">
                  <Map className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Alert Selected
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Click on an alert marker in the map to view its details and take actions.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-white border-t border-gray-200 px-6 py-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span className="text-gray-600">Real-time updates active</span>
            </div>
            
            <div className="flex items-center">
              <Users className="h-4 w-4 text-gray-500 mr-1" />
              <span className="text-gray-600">Operator: {user.username}</span>
            </div>
          </div>
          
          <div className="text-gray-500">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapView;
