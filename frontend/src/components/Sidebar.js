import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = () => {
  const location = useLocation();

  const menuItems = [
    {
      path: '/',
      icon: '📊',
      label: 'Dashboard',
      description: 'Overview and analytics'
    },
    {
      path: '/incidents',
      icon: '🚨',
      label: 'Incidents',
      description: 'Manage emergency incidents'
    },
    {
      path: '/map',
      icon: '🗺️',
      label: 'Map View',
      description: 'Geographic incident display'
    },
    {
      path: '/settings',
      icon: '⚙️',
      label: 'Settings',
      description: 'System configuration'
    }
  ];

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h3>Navigation</h3>
      </div>
      
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={`sidebar-nav-item ${isActive(item.path) ? 'active' : ''}`}
          >
            <div className="nav-item-icon">{item.icon}</div>
            <div className="nav-item-content">
              <span className="nav-item-label">{item.label}</span>
              <span className="nav-item-description">{item.description}</span>
            </div>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="system-status">
          <div className="status-indicator online"></div>
          <span className="status-text">System Online</span>
        </div>
        <div className="version-info">
          <span>v1.0.0</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
