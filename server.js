/**
 * Server Entry Point
 * Starts the Express server and handles graceful shutdown
 */

import { createServer } from 'http';
import { Settings } from 'luxon';
import app from './src/app.js';
import { logger } from './src/utils/logger.js';
import { prisma } from './src/config/database.js';
import { validateEnv } from './src/config/environment.js';

// Configure Luxon's default timezone for the application
Settings.defaultZone = process.env.TZ || 'Asia/Kolkata';

// Validate environment variables
validateEnv();

// Create HTTP server
const server = createServer(app);

// Get port from environment
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Start server
 */
const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info('✅ Database connected successfully');

    // Start listening
    server.listen(PORT, () => {
      logger.info(`🚀 Server is running in ${NODE_ENV} mode on port ${PORT}`);
      logger.info(`📍 API URL: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    logger.error('❌ Unable to start server:', error);
    process.exit(1);
  }
};

/**
 * Graceful shutdown
 */
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} signal received: closing HTTP server`);
  
  server.close(async () => {
    logger.info('HTTP server closed');
    
    // Close database connections
    await prisma.$disconnect();
    logger.info('Database connection closed');
    
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

// Listen for termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Application specific logging, throwing an error, or other logic here
  gracefulShutdown('UNHANDLED_REJECTION');
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Start the server
startServer();
