import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalIncidents: 24,
    activeIncidents: 8,
    resolvedToday: 12,
    responseTime: '4.2'
  });

  const [recentIncidents, setRecentIncidents] = useState([
    {
      id: 1,
      type: 'Fire',
      location: 'Downtown Mall',
      status: 'Active',
      priority: 'High',
      reportedAt: '2 minutes ago',
      coordinates: { lat: 40.7128, lng: -74.0060 }
    },
    {
      id: 2,
      type: 'Medical',
      location: 'Central Park',
      status: 'Responding',
      priority: 'Medium',
      reportedAt: '15 minutes ago',
      coordinates: { lat: 40.7829, lng: -73.9654 }
    },
    {
      id: 3,
      type: 'Traffic',
      location: 'Brooklyn Bridge',
      status: 'Resolved',
      priority: 'Low',
      reportedAt: '1 hour ago',
      coordinates: { lat: 40.7061, lng: -73.9969 }
    }
  ]);

  const [systemStatus, setSystemStatus] = useState({
    backend: 'Online',
    database: 'Online',
    notifications: 'Online',
    websocket: 'Online'
  });

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      // Update stats randomly for demo
      setStats(prev => ({
        ...prev,
        totalIncidents: prev.totalIncidents + Math.floor(Math.random() * 2),
        responseTime: (Math.random() * 2 + 3).toFixed(1)
      }));
    }, 30000);

    return () => clearInterval(interval);
  }, []);

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

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Real-time overview of emergency response operations</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🚨</div>
          <div className="stat-content">
            <h3>Total Incidents</h3>
            <p className="stat-number">{stats.totalIncidents}</p>
            <span className="stat-change positive">+2 today</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🔥</div>
          <div className="stat-content">
            <h3>Active Incidents</h3>
            <p className="stat-number">{stats.activeIncidents}</p>
            <span className="stat-change">Requires attention</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>Resolved Today</h3>
            <p className="stat-number">{stats.resolvedToday}</p>
            <span className="stat-change positive">+5 from yesterday</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⏱️</div>
          <div className="stat-content">
            <h3>Avg Response Time</h3>
            <p className="stat-number">{stats.responseTime}m</p>
            <span className="stat-change positive">-0.8m improvement</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-grid">
        {/* Recent Incidents */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>Recent Incidents</h3>
            <Link to="/incidents" className="view-all-btn">View All</Link>
          </div>
          <div className="incidents-list">
            {recentIncidents.map((incident) => (
              <div key={incident.id} className="incident-item">
                <div className="incident-icon">
                  {incident.type === 'Fire' ? '🔥' : 
                   incident.type === 'Medical' ? '🚑' : '🚗'}
                </div>
                <div className="incident-details">
                  <div className="incident-header">
                    <h4>{incident.type} Emergency</h4>
                    <span className={`priority-badge ${getPriorityColor(incident.priority)}`}>
                      {incident.priority}
                    </span>
                  </div>
                  <p className="incident-location">{incident.location}</p>
                  <div className="incident-meta">
                    <span className={`status-badge ${getStatusColor(incident.status)}`}>
                      {incident.status}
                    </span>
                    <span className="incident-time">{incident.reportedAt}</span>
                  </div>
                </div>
                <Link to={`/incidents/${incident.id}`} className="view-incident-btn">
                  View →
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* System Status */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>System Status</h3>
            <span className="status-indicator online"></span>
          </div>
          <div className="system-status-list">
            {Object.entries(systemStatus).map(([service, status]) => (
              <div key={service} className="system-status-item">
                <span className="service-name">{service}</span>
                <span className={`service-status ${status.toLowerCase()}`}>
                  {status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>Quick Actions</h3>
          </div>
          <div className="quick-actions">
            <button className="action-btn primary">
              🚨 Report Incident
            </button>
            <button className="action-btn">
              📍 Update Location
            </button>
            <button className="action-btn">
              📊 View Analytics
            </button>
            <button className="action-btn">
              ⚙️ System Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
