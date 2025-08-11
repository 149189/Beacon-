import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './IncidentDetail.css';

const IncidentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updates, setUpdates] = useState([]);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setIncident({
        id: parseInt(id),
        type: 'Fire',
        location: 'Downtown Mall',
        description: 'Smoke reported from basement level. Multiple witnesses report seeing smoke coming from the building. Fire department has been dispatched.',
        status: 'Active',
        priority: 'High',
        reportedAt: '2024-01-15T10:30:00Z',
        coordinates: { lat: 40.7128, lng: -74.0060 },
        reporter: 'John Smith',
        reporterPhone: '+1-555-0123',
        assignedTo: 'Fire Dept. Unit 1',
        assignedPhone: '+1-555-0100',
        estimatedResponse: '5 minutes',
        affectedArea: 'Basement and ground floor',
        casualties: '0 reported',
        propertyDamage: 'Unknown at this time'
      });

      setUpdates([
        {
          id: 1,
          timestamp: '2024-01-15T10:30:00Z',
          message: 'Incident reported by John Smith',
          type: 'report'
        },
        {
          id: 2,
          timestamp: '2024-01-15T10:32:00Z',
          message: 'Fire Department Unit 1 dispatched',
          type: 'dispatch'
        },
        {
          id: 3,
          timestamp: '2024-01-15T10:35:00Z',
          message: 'First responders arriving on scene',
          type: 'update'
        }
      ]);

      setLoading(false);
    }, 1000);
  }, [id]);

  const handleStatusChange = (newStatus) => {
    setIncident(prev => ({ ...prev, status: newStatus }));
    setUpdates(prev => [
      ...prev,
      {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        message: `Status changed to ${newStatus}`,
        type: 'status_change'
      }
    ]);
  };

  const handleAddUpdate = (message) => {
    setUpdates(prev => [
      ...prev,
      {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        message,
        type: 'update'
      }
    ]);
  };

  if (loading) {
    return (
      <div className="incident-detail-loading">
        <div className="loading-spinner"></div>
        <p>Loading incident details...</p>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="incident-not-found">
        <h2>Incident not found</h2>
        <button onClick={() => navigate('/incidents')}>Back to Incidents</button>
      </div>
    );
  }

  return (
    <div className="incident-detail-page">
      <div className="incident-detail-header">
        <button className="back-btn" onClick={() => navigate('/incidents')}>
          ← Back to Incidents
        </button>
        <div className="header-content">
          <h1>{incident.type} Emergency - #{incident.id}</h1>
          <div className="incident-badges">
            <span className={`priority-badge ${incident.priority.toLowerCase()}`}>
              {incident.priority} Priority
            </span>
            <span className={`status-badge ${incident.status.toLowerCase()}`}>
              {incident.status}
            </span>
          </div>
        </div>
      </div>

      <div className="incident-detail-grid">
        {/* Main Incident Info */}
        <div className="incident-main-info">
          <div className="info-card">
            <h3>Incident Details</h3>
            <div className="info-grid">
              <div className="info-item">
                <label>Type:</label>
                <span>{incident.type}</span>
              </div>
              <div className="info-item">
                <label>Location:</label>
                <span>{incident.location}</span>
              </div>
              <div className="info-item">
                <label>Description:</label>
                <span>{incident.description}</span>
              </div>
              <div className="info-item">
                <label>Reported:</label>
                <span>{new Date(incident.reportedAt).toLocaleString()}</span>
              </div>
              <div className="info-item">
                <label>Estimated Response:</label>
                <span>{incident.estimatedResponse}</span>
              </div>
            </div>
          </div>

          <div className="info-card">
            <h3>Response Team</h3>
            <div className="response-team">
              <div className="team-member">
                <strong>Assigned Unit:</strong> {incident.assignedTo}
              </div>
              <div className="team-member">
                <strong>Contact:</strong> {incident.assignedPhone}
              </div>
              <div className="team-member">
                <strong>Reporter:</strong> {incident.reporter}
              </div>
              <div className="team-member">
                <strong>Reporter Contact:</strong> {incident.reporterPhone}
              </div>
            </div>
          </div>
        </div>

        {/* Incident Updates */}
        <div className="incident-updates">
          <div className="updates-card">
            <div className="updates-header">
              <h3>Incident Updates</h3>
              <button className="add-update-btn">+ Add Update</button>
            </div>
            <div className="updates-timeline">
              {updates.map((update) => (
                <div key={update.id} className={`timeline-item ${update.type}`}>
                  <div className="timeline-marker"></div>
                  <div className="timeline-content">
                    <p>{update.message}</p>
                    <span className="timeline-time">
                      {new Date(update.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actions Panel */}
        <div className="incident-actions-panel">
          <div className="actions-card">
            <h3>Quick Actions</h3>
            <div className="action-buttons">
              <button 
                className={`action-btn ${incident.status === 'Active' ? 'active' : ''}`}
                onClick={() => handleStatusChange('Active')}
              >
                🚨 Mark Active
              </button>
              <button 
                className={`action-btn ${incident.status === 'Responding' ? 'active' : ''}`}
                onClick={() => handleStatusChange('Responding')}
              >
                🚑 Mark Responding
              </button>
              <button 
                className={`action-btn ${incident.status === 'Resolved' ? 'active' : ''}`}
                onClick={() => handleStatusChange('Resolved')}
              >
                ✅ Mark Resolved
              </button>
            </div>
          </div>

          <div className="actions-card">
            <h3>Additional Actions</h3>
            <div className="action-buttons">
              <button className="action-btn">
                📍 View on Map
              </button>
              <button className="action-btn">
                📞 Call Team
              </button>
              <button className="action-btn">
                📋 Generate Report
              </button>
              <button className="action-btn">
                🔄 Reassign
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncidentDetail;
