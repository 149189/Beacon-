import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = () => {
    logout();
    setShowProfileMenu(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <h1 className="navbar-title">🚨 Beacon</h1>
        <span className="navbar-subtitle">Your Signal for Safety</span>
      </div>

      <div className="navbar-actions">
        {/* Notifications */}
        <div className="notification-center">
          <button
            className="notification-btn"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            🔔
            <span className="notification-badge">3</span>
          </button>
          
          {showNotifications && (
            <div className="notification-dropdown">
              <div className="notification-header">
                <h3>Notifications</h3>
                <button className="mark-all-read">Mark all read</button>
              </div>
              <div className="notification-list">
                <div className="notification-item unread">
                  <div className="notification-icon">🚨</div>
                  <div className="notification-content">
                    <p className="notification-title">New incident reported</p>
                    <p className="notification-time">2 minutes ago</p>
                  </div>
                </div>
                <div className="notification-item unread">
                  <div className="notification-icon">📍</div>
                  <div className="notification-content">
                    <p className="notification-title">Location update available</p>
                    <p className="notification-time">5 minutes ago</p>
                  </div>
                </div>
                <div className="notification-item">
                  <div className="notification-icon">✅</div>
                  <div className="notification-content">
                    <p className="notification-title">System maintenance completed</p>
                    <p className="notification-time">1 hour ago</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="user-profile">
          <button
            className="profile-btn"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            <div className="profile-avatar">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <span className="profile-name">{user?.name || 'User'}</span>
            <span className="profile-role">{user?.role || 'Operator'}</span>
          </button>

          {showProfileMenu && (
            <div className="profile-dropdown">
              <div className="profile-info">
                <div className="profile-avatar large">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <div className="profile-details">
                  <p className="profile-name">{user?.name || 'User'}</p>
                  <p className="profile-email">{user?.email || 'user@example.com'}</p>
                  <p className="profile-role">{user?.role || 'Operator'}</p>
                </div>
              </div>
              <div className="profile-actions">
                <button className="profile-action-btn">
                  👤 Profile Settings
                </button>
                <button className="profile-action-btn">
                  🔧 Preferences
                </button>
                <button className="profile-action-btn">
                  📚 Help & Support
                </button>
                <button className="profile-action-btn logout" onClick={handleLogout}>
                  🚪 Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
