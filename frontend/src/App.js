import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [message, setMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Test connection to Django backend
    fetch('/api/health/')
      .then(response => response.json())
      .then(data => {
        setMessage(data.message);
        setIsConnected(true);
      })
      .catch(error => {
        setMessage('Backend connection failed');
        setIsConnected(false);
      });
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>🚀 Beacon Application</h1>
        <div className="status-container">
          <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? '🟢' : '🔴'}
          </div>
          <p className="status-text">
            {isConnected ? 'Connected to Backend' : 'Disconnected from Backend'}
          </p>
        </div>
        <div className="message-container">
          <h2>Backend Response:</h2>
          <p className="message">{message}</p>
        </div>
        <div className="tech-stack">
          <h3>Tech Stack:</h3>
          <div className="tech-items">
            <span className="tech-item">React.js</span>
            <span className="tech-item">Django</span>
            <span className="tech-item">MySQL</span>
            <span className="tech-item">Docker</span>
          </div>
        </div>
      </header>
    </div>
  );
}

export default App;
