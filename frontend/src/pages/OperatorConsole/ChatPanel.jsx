import React, { useState, useEffect, useRef } from 'react';
import wsManager from '../../utils/ws';
import './ChatPanel.css';

const ChatPanel = ({ incident, onClose }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (!incident) return;

        // Connect to WebSocket if not already connected
        if (!isConnected) {
            wsManager.connect().then(() => {
                setIsConnected(true);
                wsManager.joinIncident(incident.id);
            }).catch(console.error);
        }

        // Join incident group
        wsManager.joinIncident(incident.id);

        // Listen for chat messages
        const handleChatMessage = (data) => {
            if (data.incident_id === incident.id) {
                setMessages(prev => [...prev, data.message]);
            }
        };

        wsManager.on('chatMessage', handleChatMessage);

        // Load existing chat messages
        loadChatMessages();

        return () => {
            wsManager.off('chatMessage', handleChatMessage);
        };
    }, [incident, isConnected]);

    const loadChatMessages = async () => {
        try {
            const response = await fetch(`/api/operator/incidents/${incident.id}/`);
            const data = await response.json();
            setMessages(data.chat_messages || []);
        } catch (error) {
            console.error('Error loading chat messages:', error);
        }
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !isConnected) return;

        wsManager.sendChatMessage(incident.id, newMessage.trim());
        setNewMessage('');
    };

    const formatTimestamp = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString();
    };

    if (!incident) {
        return null;
    }

    return (
        <div className="chat-panel">
            <div className="chat-header">
                <div className="chat-incident-info">
                    <h4>Chat - #{incident.id.slice(0, 8)}</h4>
                    <span className="incident-user">{incident.user}</span>
                </div>
                <button className="close-button" onClick={onClose}>
                    ×
                </button>
            </div>

            <div className="chat-messages">
                {messages.length === 0 ? (
                    <div className="no-messages">
                        <p>No messages yet. Start the conversation!</p>
                    </div>
                ) : (
                    messages.map((message) => (
                        <div
                            key={message.id}
                            className={`message ${message.sender === 'operator' ? 'operator' : 'user'}`}
                        >
                            <div className="message-content">
                                <div className="message-text">{message.message_text}</div>
                                <div className="message-time">
                                    {formatTimestamp(message.timestamp)}
                                </div>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            <form className="chat-input-form" onSubmit={handleSendMessage}>
                <div className="chat-input-container">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        disabled={!isConnected}
                        className="chat-input"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim() || !isConnected}
                        className="send-button"
                    >
                        Send
                    </button>
                </div>
                {!isConnected && (
                    <div className="connection-status">
                        <span className="status-indicator disconnected">🔴</span>
                        Connecting...
                    </div>
                )}
            </form>
        </div>
    );
};

export default ChatPanel;
