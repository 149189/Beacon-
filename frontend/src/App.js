import React, { useState, useEffect } from 'react';
import './App.css';
import IncidentList from './pages/OperatorConsole/IncidentList';
import MapView from './pages/OperatorConsole/MapView';
import ChatPanel from './pages/OperatorConsole/ChatPanel';

function App() {
  const [incidents, setIncidents] = useState([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    // Test connection to Django backend
    fetch('/api/health/')
      .then(response => response.json())
      .then(data => {
        setIsConnected(true);
      })
      .catch(error => {
        setIsConnected(false);
      });
  }, []);

  const handleIncidentSelect = (incident) => {
    setSelectedIncidentId(incident.id);
    setShowChat(true);
  };

  const handleCloseChat = () => {
    setShowChat(false);
    setSelectedIncidentId(null);
  };

  const selectedIncident = incidents.find(incident => incident.id === selectedIncidentId);

  return (
    <div className="App">
      <header className="App-header">
        <h1>🚨 Beacon Operator Console</h1>
        <div className="status-container">
          <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? '🟢' : '🔴'}
          </div>
          <p className="status-text">
            {isConnected ? 'Connected to Backend' : 'Disconnected from Backend'}
          </p>
        </div>
      </header>
      
      <main className="operator-console">
        <div className="console-layout">
          <div className="incident-panel">
            <IncidentList 
              onIncidentSelect={handleIncidentSelect}
              selectedIncidentId={selectedIncidentId}
            />
          </div>
          <div className="map-panel">
            <MapView 
              incidents={incidents}
              selectedIncidentId={selectedIncidentId}
              onIncidentSelect={handleIncidentSelect}
            />
          </div>
          {showChat && selectedIncident && (
            <div className="chat-panel-container">
              <ChatPanel 
                incident={selectedIncident}
                onClose={handleCloseChat}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
