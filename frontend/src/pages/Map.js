import React, { useState, useEffect } from 'react';
import './Map.css';

const Map = () => {
  const [incidents, setIncidents] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [mapView, setMapView] = useState('satellite'); // satellite, street, terrain
  const [filters, setFilters] = useState({
    showActive: true,
    showResponding: true,
    showResolved: false,
    showHighPriority: true,
    showMediumPriority: true,
    showLowPriority: true
  });

  useEffect(() => {
    // Simulate API call for incidents with coordinates
    setTimeout(() => {
      setIncidents([
        {
          id: 1,
          type: 'Fire',
          location: 'Downtown Mall',
          status: 'Active',
          priority: 'High',
          coordinates: { lat: 40.7128, lng: -74.0060 },
          reportedAt: '2 minutes ago'
        },
        {
          id: 2,
          type: 'Medical',
          location: 'Central Park',
          status: 'Responding',
          priority: 'Medium',
          coordinates: { lat: 40.7829, lng: -73.9654 },
          reportedAt: '15 minutes ago'
        },
        {
          id: 3,
          type: 'Traffic',
          location: 'Brooklyn Bridge',
          status: 'Resolved',
          priority: 'Low',
          coordinates: { lat: 40.7061, lng: -73.9969 },
          reportedAt: '1 hour ago'
        },
        {
          id: 4,
          type: 'Security',
          location: 'Times Square',
          status: 'Active',
          priority: 'High',
          coordinates: { lat: 40.7580, lng: -73.9855 },
          reportedAt: '30 minutes ago'
        }
      ]);
    }, 1000);
  }, []);

  const getIncidentIcon = (type) => {
    switch (type) {
      case 'Fire': return '🔥';
      case 'Medical': return '🚑';
      case 'Traffic': return '🚗';
      case 'Security': return '🚨';
      default: return '⚠️';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return '#ff4444';
      case 'Medium': return '#ffaa00';
      case 'Low': return '#44ff44';
      default: return '#888888';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return '#ff4444';
      case 'Responding': return '#ffaa00';
      case 'Resolved': return '#44ff44';
      default: return '#888888';
    }
  };

  const filteredIncidents = incidents.filter(incident => {
    if (!filters.showActive && incident.status === 'Active') return false;
    if (!filters.showResponding && incident.status === 'Responding') return false;
    if (!filters.showResolved && incident.status === 'Resolved') return false;
    if (!filters.showHighPriority && incident.priority === 'High') return false;
    if (!filters.showMediumPriority && incident.priority === 'Medium') return false;
    if (!filters.showLowPriority && incident.priority === 'Low') return false;
    return true;
  });

  return (
    <div className="map-page">
      <div className="map-header">
        <h1>Map View</h1>
        <p>Geographic overview of emergency incidents</p>
      </div>

      <div className="map-container">
        {/* Map Controls */}
        <div className="map-controls">
          <div className="control-group">
            <label>Map View:</label>
            <select 
              value={mapView} 
              onChange={(e) => setMapView(e.target.value)}
            >
              <option value="satellite">Satellite</option>
              <option value="street">Street</option>
              <option value="terrain">Terrain</option>
            </select>
          </div>

          <div className="control-group">
            <label>Status Filters:</label>
            <div className="filter-checkboxes">
              <label>
                <input
                  type="checkbox"
                  checked={filters.showActive}
                  onChange={(e) => setFilters(prev => ({ ...prev, showActive: e.target.checked }))}
                />
                Active
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={filters.showResponding}
                  onChange={(e) => setFilters(prev => ({ ...prev, showResponding: e.target.checked }))}
                />
                Responding
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={filters.showResolved}
                  onChange={(e) => setFilters(prev => ({ ...prev, showResolved: e.target.checked }))}
                />
                Resolved
              </label>
            </div>
          </div>

          <div className="control-group">
            <label>Priority Filters:</label>
            <div className="filter-checkboxes">
              <label>
                <input
                  type="checkbox"
                  checked={filters.showHighPriority}
                  onChange={(e) => setFilters(prev => ({ ...prev, showHighPriority: e.target.checked }))}
                />
                High
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={filters.showMediumPriority}
                  onChange={(e) => setFilters(prev => ({ ...prev, showMediumPriority: e.target.checked }))}
                />
                Medium
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={filters.showLowPriority}
                  onChange={(e) => setFilters(prev => ({ ...prev, showLowPriority: e.target.checked }))}
                />
                Low
              </label>
            </div>
          </div>
        </div>

        {/* Map Display */}
        <div className="map-display">
          <div className="map-placeholder">
            <div className="map-overlay">
              <h3>🗺️ Interactive Map</h3>
              <p>Map integration would be implemented here with Mapbox or Google Maps</p>
              <p>Showing {filteredIncidents.length} incidents</p>
            </div>
            
            {/* Simulated Map Markers */}
            {filteredIncidents.map((incident) => (
              <div
                key={incident.id}
                className="map-marker"
                style={{
                  left: `${((incident.coordinates.lng + 74.1) / 0.2) * 100}%`,
                  top: `${((40.8 - incident.coordinates.lat) / 0.2) * 100}%`
                }}
                onClick={() => setSelectedIncident(incident)}
              >
                <div 
                  className="marker-icon"
                  style={{ backgroundColor: getPriorityColor(incident.priority) }}
                >
                  {getIncidentIcon(incident.type)}
                </div>
                <div className="marker-pulse"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Incident List Sidebar */}
        <div className="incidents-sidebar">
          <h3>Incidents on Map</h3>
          <div className="incidents-list">
            {filteredIncidents.map((incident) => (
              <div
                key={incident.id}
                className={`incident-item ${selectedIncident?.id === incident.id ? 'selected' : ''}`}
                onClick={() => setSelectedIncident(incident)}
              >
                <div className="incident-icon">
                  {getIncidentIcon(incident.type)}
                </div>
                <div className="incident-info">
                  <h4>{incident.type} Emergency</h4>
                  <p className="incident-location">{incident.location}</p>
                  <div className="incident-meta">
                    <span 
                      className="priority-badge"
                      style={{ backgroundColor: getPriorityColor(incident.priority) }}
                    >
                      {incident.priority}
                    </span>
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(incident.status) }}
                    >
                      {incident.status}
                    </span>
                  </div>
                  <span className="incident-time">{incident.reportedAt}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Selected Incident Details */}
      {selectedIncident && (
        <div className="selected-incident-details">
          <div className="details-header">
            <h3>{selectedIncident.type} Emergency - #{selectedIncident.id}</h3>
            <button 
              className="close-btn"
              onClick={() => setSelectedIncident(null)}
            >
              ×
            </button>
          </div>
          <div className="details-content">
            <div className="detail-item">
              <strong>Location:</strong> {selectedIncident.location}
            </div>
            <div className="detail-item">
              <strong>Status:</strong> {selectedIncident.status}
            </div>
            <div className="detail-item">
              <strong>Priority:</strong> {selectedIncident.priority}
            </div>
            <div className="detail-item">
              <strong>Reported:</strong> {selectedIncident.reportedAt}
            </div>
            <div className="detail-item">
              <strong>Coordinates:</strong> {selectedIncident.coordinates.lat.toFixed(4)}, {selectedIncident.coordinates.lng.toFixed(4)}
            </div>
          </div>
          <div className="details-actions">
            <button className="action-btn">View Details</button>
            <button className="action-btn">Update Status</button>
            <button className="action-btn">Assign Team</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Map;
