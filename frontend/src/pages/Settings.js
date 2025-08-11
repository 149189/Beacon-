import React, { useState } from 'react';
import './Settings.css';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    general: {
      systemName: 'Beacon Emergency Response System',
      timezone: 'America/New_York',
      language: 'English',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12-hour'
    },
    notifications: {
      emailNotifications: true,
      pushNotifications: true,
      smsNotifications: false,
      notificationSound: true,
      quietHours: false,
      quietStart: '22:00',
      quietEnd: '07:00'
    },
    display: {
      theme: 'light',
      fontSize: 'medium',
      showAnimations: true,
      autoRefresh: true,
      refreshInterval: 30
    },
    security: {
      requireTwoFactor: false,
      sessionTimeout: 60,
      passwordExpiry: 90,
      failedLoginAttempts: 5,
      lockoutDuration: 15
    }
  });

  const handleSettingChange = (category, setting, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: value
      }
    }));
  };

  const handleSave = (category) => {
    // Simulate saving settings
    console.log(`Saving ${category} settings:`, settings[category]);
    // Here you would typically make an API call to save the settings
  };

  const renderGeneralSettings = () => (
    <div className="settings-section">
      <h3>General Settings</h3>
      <div className="setting-group">
        <label>System Name</label>
        <input
          type="text"
          value={settings.general.systemName}
          onChange={(e) => handleSettingChange('general', 'systemName', e.target.value)}
        />
      </div>
      <div className="setting-group">
        <label>Timezone</label>
        <select
          value={settings.general.timezone}
          onChange={(e) => handleSettingChange('general', 'timezone', e.target.value)}
        >
          <option value="America/New_York">Eastern Time (ET)</option>
          <option value="America/Chicago">Central Time (CT)</option>
          <option value="America/Denver">Mountain Time (MT)</option>
          <option value="America/Los_Angeles">Pacific Time (PT)</option>
        </select>
      </div>
      <div className="setting-group">
        <label>Language</label>
        <select
          value={settings.general.language}
          onChange={(e) => handleSettingChange('general', 'language', e.target.value)}
        >
          <option value="English">English</option>
          <option value="Spanish">Spanish</option>
          <option value="French">French</option>
        </select>
      </div>
      <button 
        className="save-btn"
        onClick={() => handleSave('general')}
      >
        Save General Settings
      </button>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="settings-section">
      <h3>Notification Preferences</h3>
      <div className="setting-group">
        <label>
          <input
            type="checkbox"
            checked={settings.notifications.emailNotifications}
            onChange={(e) => handleSettingChange('notifications', 'emailNotifications', e.target.checked)}
          />
          Email Notifications
        </label>
      </div>
      <div className="setting-group">
        <label>
          <input
            type="checkbox"
            checked={settings.notifications.pushNotifications}
            onChange={(e) => handleSettingChange('notifications', 'pushNotifications', e.target.checked)}
          />
          Push Notifications
        </label>
      </div>
      <div className="setting-group">
        <label>
          <input
            type="checkbox"
            checked={settings.notifications.smsNotifications}
            onChange={(e) => handleSettingChange('notifications', 'smsNotifications', e.target.checked)}
          />
          SMS Notifications
        </label>
      </div>
      <div className="setting-group">
        <label>
          <input
            type="checkbox"
            checked={settings.notifications.notificationSound}
            onChange={(e) => handleSettingChange('notifications', 'notificationSound', e.target.checked)}
          />
          Notification Sound
        </label>
      </div>
      <div className="setting-group">
        <label>
          <input
            type="checkbox"
            checked={settings.notifications.quietHours}
            onChange={(e) => handleSettingChange('notifications', 'quietHours', e.target.checked)}
          />
          Enable Quiet Hours
        </label>
      </div>
      {settings.notifications.quietHours && (
        <div className="quiet-hours-settings">
          <div className="setting-group">
            <label>Quiet Hours Start</label>
            <input
              type="time"
              value={settings.notifications.quietStart}
              onChange={(e) => handleSettingChange('notifications', 'quietStart', e.target.value)}
            />
          </div>
          <div className="setting-group">
            <label>Quiet Hours End</label>
            <input
              type="time"
              value={settings.notifications.quietEnd}
              onChange={(e) => handleSettingChange('notifications', 'quietEnd', e.target.value)}
            />
          </div>
        </div>
      )}
      <button 
        className="save-btn"
        onClick={() => handleSave('notifications')}
      >
        Save Notification Settings
      </button>
    </div>
  );

  const renderDisplaySettings = () => (
    <div className="settings-section">
      <h3>Display & Interface</h3>
      <div className="setting-group">
        <label>Theme</label>
        <select
          value={settings.display.theme}
          onChange={(e) => handleSettingChange('display', 'theme', e.target.value)}
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="auto">Auto (System)</option>
        </select>
      </div>
      <div className="setting-group">
        <label>Font Size</label>
        <select
          value={settings.display.fontSize}
          onChange={(e) => handleSettingChange('display', 'fontSize', e.target.value)}
        >
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
        </select>
      </div>
      <div className="setting-group">
        <label>
          <input
            type="checkbox"
            checked={settings.display.showAnimations}
            onChange={(e) => handleSettingChange('display', 'showAnimations', e.target.checked)}
          />
          Show Animations
        </label>
      </div>
      <div className="setting-group">
        <label>
          <input
            type="checkbox"
            checked={settings.display.autoRefresh}
            onChange={(e) => handleSettingChange('display', 'autoRefresh', e.target.checked)}
          />
          Auto-refresh Data
        </label>
      </div>
      {settings.display.autoRefresh && (
        <div className="setting-group">
          <label>Refresh Interval (seconds)</label>
          <input
            type="number"
            min="10"
            max="300"
            value={settings.display.refreshInterval}
            onChange={(e) => handleSettingChange('display', 'refreshInterval', parseInt(e.target.value))}
          />
        </div>
      )}
      <button 
        className="save-btn"
        onClick={() => handleSave('display')}
      >
        Save Display Settings
      </button>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="settings-section">
      <h3>Security & Privacy</h3>
      <div className="setting-group">
        <label>
          <input
            type="checkbox"
            checked={settings.security.requireTwoFactor}
            onChange={(e) => handleSettingChange('security', 'requireTwoFactor', e.target.checked)}
          />
          Require Two-Factor Authentication
        </label>
      </div>
      <div className="setting-group">
        <label>Session Timeout (minutes)</label>
        <input
          type="number"
          min="15"
          max="480"
          value={settings.security.sessionTimeout}
          onChange={(e) => handleSettingChange('security', 'sessionTimeout', parseInt(e.target.value))}
        />
      </div>
      <div className="setting-group">
        <label>Password Expiry (days)</label>
        <input
          type="number"
          min="30"
          max="365"
          value={settings.security.passwordExpiry}
          onChange={(e) => handleSettingChange('security', 'passwordExpiry', parseInt(e.target.value))}
        />
      </div>
      <div className="setting-group">
        <label>Failed Login Attempts Before Lockout</label>
        <input
          type="number"
          min="3"
          max="10"
          value={settings.security.failedLoginAttempts}
          onChange={(e) => handleSettingChange('security', 'failedLoginAttempts', parseInt(e.target.value))}
        />
      </div>
      <div className="setting-group">
        <label>Lockout Duration (minutes)</label>
        <input
          type="number"
          min="5"
          max="60"
          value={settings.security.lockoutDuration}
          onChange={(e) => handleSettingChange('security', 'lockoutDuration', parseInt(e.target.value))}
        />
      </div>
      <button 
        className="save-btn"
        onClick={() => handleSave('security')}
      >
        Save Security Settings
      </button>
    </div>
  );

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>Settings</h1>
        <p>Configure your Beacon system preferences</p>
      </div>

      <div className="settings-container">
        {/* Settings Navigation */}
        <div className="settings-nav">
          <button
            className={`nav-tab ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            ⚙️ General
          </button>
          <button
            className={`nav-tab ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            🔔 Notifications
          </button>
          <button
            className={`nav-tab ${activeTab === 'display' ? 'active' : ''}`}
            onClick={() => setActiveTab('display')}
          >
            🎨 Display
          </button>
          <button
            className={`nav-tab ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            🔒 Security
          </button>
        </div>

        {/* Settings Content */}
        <div className="settings-content">
          {activeTab === 'general' && renderGeneralSettings()}
          {activeTab === 'notifications' && renderNotificationSettings()}
          {activeTab === 'display' && renderDisplaySettings()}
          {activeTab === 'security' && renderSecuritySettings()}
        </div>
      </div>
    </div>
  );
};

export default Settings;
