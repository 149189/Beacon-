const mysql = require('mysql2/promise');
const winston = require('winston');

class DatabaseManager {
  constructor() {
    this.connection = null;
    this.pool = null;
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.simple(),
      transports: [new winston.transports.Console()]
    });
  }

  async connect() {
    try {
      // Create connection pool
      this.pool = mysql.createPool({
        host: process.env.MYSQL_HOST || 'localhost',
        user: process.env.MYSQL_USER || 'root',
        password: process.env.MYSQL_PASSWORD || '',
        database: process.env.MYSQL_DATABASE || 'beacon_db',
        port: parseInt(process.env.MYSQL_PORT) || 3306,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        acquireTimeout: 60000,
        timeout: 60000,
        reconnect: true
      });

      // Test connection
      this.connection = await this.pool.getConnection();
      await this.connection.ping();
      this.connection.release();
      
      this.logger.info('Database connection pool established');
      
      // Initialize tables if they don't exist
      await this.initializeTables();
      
    } catch (error) {
      this.logger.error('Failed to connect to database:', error);
      throw error;
    }
  }

  async initializeTables() {
    try {
      // Create user_locations table for storing live location data
      const createUserLocationsTable = `
        CREATE TABLE IF NOT EXISTS user_locations (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          latitude DECIMAL(10, 7) NOT NULL,
          longitude DECIMAL(10, 7) NOT NULL,
          accuracy FLOAT DEFAULT 0,
          altitude FLOAT NULL,
          speed FLOAT NULL,
          heading FLOAT NULL,
          provider VARCHAR(20) DEFAULT 'gps',
          battery_level INT NULL,
          device_info JSON NULL,
          network_info JSON NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_user_id (user_id),
          INDEX idx_created_at (created_at),
          INDEX idx_location (latitude, longitude)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `;

      // Create location_alerts table for storing location-based alerts
      const createLocationAlertsTable = `
        CREATE TABLE IF NOT EXISTS location_alerts (
          id VARCHAR(36) PRIMARY KEY,
          user_id INT NOT NULL,
          alert_type VARCHAR(20) DEFAULT 'panic_button',
          status VARCHAR(20) DEFAULT 'active',
          priority INT DEFAULT 4,
          latitude DECIMAL(10, 7) NOT NULL,
          longitude DECIMAL(10, 7) NOT NULL,
          accuracy FLOAT DEFAULT 0,
          address TEXT NULL,
          description TEXT NULL,
          is_silent BOOLEAN DEFAULT FALSE,
          auto_call_emergency BOOLEAN DEFAULT FALSE,
          assigned_operator INT NULL,
          operator_notes TEXT NULL,
          device_info JSON NULL,
          network_info JSON NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          acknowledged_at TIMESTAMP NULL,
          resolved_at TIMESTAMP NULL,
          INDEX idx_user_id (user_id),
          INDEX idx_status (status),
          INDEX idx_created_at (created_at),
          INDEX idx_priority (priority),
          INDEX idx_location (latitude, longitude)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `;

      // Create location_history table for storing location tracking history
      const createLocationHistoryTable = `
        CREATE TABLE IF NOT EXISTS location_history (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          alert_id VARCHAR(36) NULL,
          latitude DECIMAL(10, 7) NOT NULL,
          longitude DECIMAL(10, 7) NOT NULL,
          accuracy FLOAT DEFAULT 0,
          altitude FLOAT NULL,
          speed FLOAT NULL,
          heading FLOAT NULL,
          provider VARCHAR(20) DEFAULT 'gps',
          battery_level INT NULL,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_user_id (user_id),
          INDEX idx_alert_id (alert_id),
          INDEX idx_timestamp (timestamp),
          INDEX idx_location (latitude, longitude)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `;

      // Execute table creation queries
      await this.pool.execute(createUserLocationsTable);
      await this.pool.execute(createLocationAlertsTable);
      await this.pool.execute(createLocationHistoryTable);
      
      this.logger.info('Database tables initialized successfully');
      
    } catch (error) {
      this.logger.error('Failed to initialize database tables:', error);
      throw error;
    }
  }

  async getConnection() {
    if (!this.pool) {
      throw new Error('Database not connected');
    }
    return await this.pool.getConnection();
  }

  async execute(query, params = []) {
    try {
      const [rows] = await this.pool.execute(query, params);
      return rows;
    } catch (error) {
      this.logger.error('Database query execution failed:', error);
      throw error;
    }
  }

  async query(query, params = []) {
    try {
      const [rows] = await this.pool.query(query, params);
      return rows;
    } catch (error) {
      this.logger.error('Database query failed:', error);
      throw error;
    }
  }

  async transaction(callback) {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async healthCheck() {
    try {
      const connection = await this.pool.getConnection();
      await connection.ping();
      connection.release();
      return true;
    } catch (error) {
      this.logger.error('Database health check failed:', error);
      return false;
    }
  }

  async disconnect() {
    try {
      if (this.pool) {
        await this.pool.end();
        this.logger.info('Database connection pool closed');
      }
    } catch (error) {
      this.logger.error('Error closing database connection:', error);
    }
  }

  // Helper method to escape values for safe SQL queries
  escape(value) {
    if (typeof value === 'string') {
      return value.replace(/'/g, "''");
    }
    return value;
  }

  // Helper method to build WHERE clauses safely
  buildWhereClause(conditions) {
    const clauses = [];
    const values = [];
    
    for (const [key, value] of Object.entries(conditions)) {
      if (value !== undefined && value !== null) {
        clauses.push(`${key} = ?`);
        values.push(value);
      }
    }
    
    return {
      clause: clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '',
      values
    };
  }
}

module.exports = DatabaseManager;
