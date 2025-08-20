const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const winston = require('winston');
const cron = require('node-cron');

// Load environment variables
dotenv.config({ path: './config.env' });

// Import modules
const DatabaseManager = require('./src/database/databaseManager');
const LocationService = require('./src/services/locationService');
const AlertService = require('./src/services/alertService');
const WebSocketManager = require('./src/websocket/websocketManager');

// Initialize logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'location-server' },
  transports: [
    new winston.transports.File({ filename: process.env.LOG_FILE || 'location_server.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

class LocationServer {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = socketIo(this.server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });
    
    this.port = process.env.PORT || 3001;
    this.databaseManager = null;
    this.locationService = null;
    this.alertService = null;
    this.websocketManager = null;
    
    this.initializeMiddleware();
    this.initializeRoutes();
  }

  async initialize() {
    try {
      logger.info('Initializing Location Server...');
      
      // Initialize database connection
      this.databaseManager = new DatabaseManager();
      await this.databaseManager.connect();
      logger.info('Database connection established');
      
      // Initialize services
      this.locationService = new LocationService(this.databaseManager);
      this.alertService = new AlertService(this.databaseManager);
      
      // Initialize WebSocket manager
      this.websocketManager = new WebSocketManager(
        this.io, 
        this.locationService, 
        this.alertService
      );
      
      // Start scheduled tasks
      this.startScheduledTasks();
      
      logger.info('Location Server initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Location Server:', error);
      process.exit(1);
    }
  }

  initializeMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    
    // Request logging middleware
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      next();
    });
  }

  initializeRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        service: 'beacon-location-server'
      });
    });

    // Location update endpoint (for mobile app)
    this.app.post('/api/location/update', async (req, res) => {
      try {
        const { userId, latitude, longitude, accuracy, timestamp } = req.body;
        
        if (!userId || !latitude || !longitude) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        const locationData = await this.locationService.updateUserLocation({
          userId,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          accuracy: parseFloat(accuracy) || 0,
          timestamp: timestamp || new Date()
        });

        res.json({ success: true, location: locationData });
      } catch (error) {
        logger.error('Error updating location:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Panic alert endpoint
    this.app.post('/api/alert/panic', async (req, res) => {
      try {
        const { userId, latitude, longitude, accuracy, alertType, description } = req.body;
        
        if (!userId || !latitude || !longitude) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        const alert = await this.alertService.createPanicAlert({
          userId,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          accuracy: parseFloat(accuracy) || 0,
          alertType: alertType || 'panic_button',
          description: description || ''
        });

        // Notify admin panel via WebSocket
        this.websocketManager.notifyAdminPanel(alert);

        res.json({ success: true, alertId: alert.id });
      } catch (error) {
        logger.error('Error creating panic alert:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Get user location history
    this.app.get('/api/location/history/:userId', async (req, res) => {
      try {
        const { userId } = req.params;
        const { limit = 50 } = req.query;
        
        const history = await this.locationService.getLocationHistory(userId, parseInt(limit));
        res.json({ success: true, history });
      } catch (error) {
        logger.error('Error fetching location history:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Get active alerts
    this.app.get('/api/alerts/active', async (req, res) => {
      try {
        const alerts = await this.alertService.getActiveAlerts();
        res.json({ success: true, alerts });
      } catch (error) {
        logger.error('Error fetching active alerts:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });
  }

  startScheduledTasks() {
    // Clean up old location data every hour
    cron.schedule('0 * * * *', async () => {
      try {
        await this.locationService.cleanupOldLocations();
        logger.info('Location cleanup completed');
      } catch (error) {
        logger.error('Location cleanup failed:', error);
      }
    });

    // Health check every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
      try {
        await this.databaseManager.healthCheck();
        logger.info('Health check completed');
      } catch (error) {
        logger.error('Health check failed:', error);
      }
    });
  }

  async start() {
    try {
      await this.initialize();
      
      this.server.listen(this.port, () => {
        logger.info(`Location Server running on port ${this.port}`);
        logger.info(`Environment: ${process.env.NODE_ENV}`);
      });

      // Graceful shutdown
      process.on('SIGTERM', () => this.shutdown());
      process.on('SIGINT', () => this.shutdown());
      
    } catch (error) {
      logger.error('Failed to start Location Server:', error);
      process.exit(1);
    }
  }

  async shutdown() {
    logger.info('Shutting down Location Server...');
    
    try {
      if (this.databaseManager) {
        await this.databaseManager.disconnect();
      }
      
      this.server.close(() => {
        logger.info('Location Server stopped');
        process.exit(0);
      });
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  }
}

// Start the server
const server = new LocationServer();
server.start().catch(error => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});
