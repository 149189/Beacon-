import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Incidents.css';

const Incidents = () => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    type: 'all',
    search: ''
  });

  const [incidentTypes] = useState([
    'Fire', 'Medical', 'Traffic', 'Security', 'Natural Disaster', 'Other'
  ]);

  const [priorities] = useState(['High', 'Medium', 'Low']);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setIncidents([
        {
          id: 1,
          type: 'Fire',
          location: 'Downtown Mall',
          description: 'Smoke reported from basement level',
          status: 'Active',
          priority: 'High',
          reportedAt: '2024-01-15T10:30:00Z',
          coordinates: { lat: 40.7128, lng: -74.0060 },
          reporter: 'John Smith',
          assignedTo: 'Fire Dept. Unit 1'
        },
        {
          id: 2,
          type: 'Medical',
          location: 'Central Park',
          description: 'Person collapsed near fountain',
          status: 'Responding',
          priority: 'Medium',
          reportedAt: '2024-01-15T10:15:00Z',
          coordinates: { lat: 40.7829, lng: -73.9654 },
          reporter: 'Sarah Johnson',
          assignedTo: 'EMS Unit 3'
        },
        {
          id: 3,
          type: 'Traffic',
          location: 'Brooklyn Bridge',
          description: 'Multi-vehicle accident blocking traffic',
          status: 'Resolved',
          priority: 'Low',
          reportedAt: '2024-01-15T09:45:00Z',
          coordinates: { lat: 40.7061, lng: -73.9969 },
          reporter: 'Mike Davis',
          assignedTo: 'Traffic Unit 2'
        },
        {
          id: 4,
          type: 'Security',
          location: 'Times Square',
          description: 'Suspicious package reported',
          status: 'Active',
          priority: 'High',
          reportedAt: '2024-01-15T10:45:00Z',
          coordinates: { lat: 40.7580, lng: -73.9855 },
          reporter: 'Lisa Chen',
          assignedTo: 'Bomb Squad'
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredIncidents = incidents.filter(incident => {
    if (filters.status !== 'all' && incident.status !== filters.status) return false;
    if (filters.priority !== 'all' && incident.priority !== filters.priority) return false;
    if (filters.type !== 'all' && incident.type !== filters.type) return false;
    if (filters.search && !incident.location.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'priority-high';
      case 'Medium': return 'priority-medium';
      case 'Low': return 'priority-low';
      default: return 'priority-medium';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'status-active';
      case 'Responding': return 'status-responding';
      case 'Resolved': return 'status-resolved';
      default: return 'status-default';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <div className="incidents-loading">
        <div className="loading-spinner"></div>
        <p>Loading incidents...</p>
      </div>
    );
  }

  return (
    <div className="incidents-page">
      <div className="incidents-header">
        <div className="header-content">
          <h1>Incidents</h1>
          <p>Manage and monitor emergency response incidents</p>
        </div>
        <div className="header-actions">
          <button className="btn-primary">
            🚨 Report New Incident
          </button>
          <button className="btn-secondary">
            📊 Export Data
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filters-grid">
          <div className="filter-group">
            <label>Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="Active">Active</option>
              <option value="Responding">Responding</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Priority</label>
            <select
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
            >
              <option value="all">All Priorities</option>
              {priorities.map(priority => (
                <option key={priority} value={priority}>{priority}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Type</label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
            >
              <option value="all">All Types</option>
              {incidentTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Search</label>
            <input
              type="text"
              placeholder="Search by location..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Incidents List */}
      <div className="incidents-container">
        <div className="incidents-list">
          {filteredIncidents.map((incident) => (
            <div key={incident.id} className="incident-card">
              <div className="incident-header">
                <div className="incident-type">
                  <span className="type-icon">
                    {incident.type === 'Fire' ? '🔥' : 
                     incident.type === 'Medical' ? '🚑' : 
                     incident.type === 'Traffic' ? '🚗' : 
                     incident.type === 'Security' ? '🚨' : '⚠️'}
                  </span>
                  <h3>{incident.type} Emergency</h3>
                </div>
                <div className="incident-badges">
                  <span className={`priority-badge ${getPriorityColor(incident.priority)}`}>
                    {incident.priority}
                  </span>
                  <span className={`status-badge ${getStatusColor(incident.status)}`}>
                    {incident.status}
                  </span>
                </div>
              </div>

              <div className="incident-body">
                <div className="incident-location">
                  <strong>📍 Location:</strong> {incident.location}
                </div>
                <div className="incident-description">
                  <strong>Description:</strong> {incident.description}
                </div>
                <div className="incident-meta">
                  <div className="meta-item">
                    <strong>Reported:</strong> {formatDate(incident.reportedAt)}
                  </div>
                  <div className="meta-item">
                    <strong>Reporter:</strong> {incident.reporter}
                  </div>
                  <div className="meta-item">
                    <strong>Assigned:</strong> {incident.assignedTo}
                  </div>
                </div>
              </div>

              <div className="incident-actions">
                <Link to={`/incidents/${incident.id}`} className="btn-view">
                  View Details
                </Link>
                <button className="btn-edit">
                  Edit
                </button>
                <button className="btn-assign">
                  Reassign
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredIncidents.length === 0 && (
          <div className="no-incidents">
            <div className="no-incidents-icon">📭</div>
            <h3>No incidents found</h3>
            <p>Try adjusting your filters or search criteria</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Incidents;
