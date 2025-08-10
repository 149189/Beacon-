import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './IncidentList.css';

const IncidentList = ({ onIncidentSelect, selectedIncidentId }) => {
    const [incidents, setIncidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Mock data for development
    const mockIncidents = [
        {
            id: '1',
            user: 'John Doe',
            status: 'active',
            latitude: 40.7128,
            longitude: -74.0060,
            created_at: '2024-01-15T10:30:00Z',
            description: 'Emergency situation in downtown area'
        },
        {
            id: '2',
            user: 'Jane Smith',
            status: 'acknowledged',
            latitude: 40.7589,
            longitude: -73.9851,
            created_at: '2024-01-15T09:15:00Z',
            description: 'Medical emergency at Times Square'
        },
        {
            id: '3',
            user: 'Mike Johnson',
            status: 'active',
            latitude: 40.7505,
            longitude: -73.9934,
            created_at: '2024-01-15T11:00:00Z',
            description: 'Fire alarm triggered in office building'
        },
        {
            id: '4',
            user: 'Sarah Wilson',
            status: 'closed',
            latitude: 40.7484,
            longitude: -73.9857,
            created_at: '2024-01-15T08:45:00Z',
            description: 'Traffic accident on 5th Avenue'
        }
    ];

    // Fetch active incidents from API
    const fetchActiveIncidents = async () => {
        try {
            setLoading(true);
            // For now, use mock data instead of API call
            // const response = await axios.get('/api/operator/incidents/active/');
            // setIncidents(response.data);
            setIncidents(mockIncidents);
            setError(null);
        } catch (err) {
            console.error('Error fetching incidents:', err);
            // Fallback to mock data on error
            setIncidents(mockIncidents);
            setError(null);
        } finally {
            setLoading(false);
        }
    };

    // Handle incident acknowledgment
    const handleAcknowledge = async (incidentId) => {
        try {
            // For now, just update local state
            // await axios.patch(`/api/operator/incidents/${incidentId}/acknowledge/`);

            // Update local state
            setIncidents(prev =>
                prev.map(incident =>
                    incident.id === incidentId
                        ? { ...incident, status: 'acknowledged' }
                        : incident
                )
            );
        } catch (err) {
            console.error('Error acknowledging incident:', err);
            alert('Failed to acknowledge incident');
        }
    };

    // Format timestamp for display
    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;

        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;

        return date.toLocaleDateString();
    };

    // Get status badge color
    const getStatusColor = (status) => {
        switch (status) {
            case 'active':
                return '#ff4757';
            case 'acknowledged':
                return '#ffa502';
            case 'closed':
                return '#2ed573';
            default:
                return '#747d8c';
        }
    };

    // Initial load
    useEffect(() => {
        fetchActiveIncidents();

        // Refresh every 30 seconds
        const interval = setInterval(fetchActiveIncidents, 30000);

        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="incident-list">
                <div className="incident-list-header">
                    <h3>Active Incidents</h3>
                    <button onClick={fetchActiveIncidents} disabled>Loading...</button>
                </div>
                <div className="incident-list-content">
                    <div className="loading">Loading incidents...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="incident-list">
                <div className="incident-list-header">
                    <h3>Active Incidents</h3>
                    <button onClick={fetchActiveIncidents}>Retry</button>
                </div>
                <div className="incident-list-content">
                    <div className="error">{error}</div>
                </div>
            </div>
        );
    }

    return (
        <div className="incident-list">
            <div className="incident-list-header">
                <h3>Active Incidents ({incidents.length})</h3>
                <button onClick={fetchActiveIncidents}>Refresh</button>
            </div>

            <div className="incident-list-content">
                {incidents.length === 0 ? (
                    <div className="no-incidents">
                        <p>No active incidents</p>
                    </div>
                ) : (
                    incidents.map(incident => (
                        <div
                            key={incident.id}
                            className={`incident-item ${selectedIncidentId === incident.id ? 'selected' : ''}`}
                            onClick={() => onIncidentSelect(incident)}
                        >
                            <div className="incident-header">
                                <div className="incident-id">#{incident.id.slice(0, 8)}</div>
                                <div
                                    className="status-badge"
                                    style={{ backgroundColor: getStatusColor(incident.status) }}
                                >
                                    {incident.status}
                                </div>
                            </div>

                            <div className="incident-user">{incident.user}</div>

                            <div className="incident-location">
                                📍 {incident.latitude.toFixed(4)}, {incident.longitude.toFixed(4)}
                            </div>

                            <div className="incident-time">
                                {formatTimestamp(incident.created_at)}
                            </div>

                            {incident.status === 'active' && (
                                <button
                                    className="ack-button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleAcknowledge(incident.id);
                                    }}
                                >
                                    Acknowledge
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default IncidentList;
