const mongoose = require('mongoose');
const logger = require('../utils/logger');

// Cache the connection to avoid creating multiple connections in serverless
let cachedConnection = null;

const connectDB = async () => {
  try {
    // If we already have a connection, return it
    if (cachedConnection && mongoose.connection.readyState === 1) {
      return cachedConnection;
    }

    const mongoURI = process.env.NODE_ENV === 'production' 
      ? process.env.MONGODB_URI_PROD 
      : process.env.MONGODB_URI;

    if (!mongoURI) {
      throw new Error('MongoDB URI is not defined in environment variables');
    }

    // Close existing connection if it exists but is not ready
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    // Add connection timeout with shorter duration for serverless
    const connectionPromise = mongoose.connect(mongoURI, {
      maxPoolSize: 5, // Reduced for serverless
      serverSelectionTimeoutMS: 3000, // Shorter timeout
      socketTimeoutMS: 10000, // Shorter timeout
      bufferCommands: false, // Disable mongoose buffering
    });

    // Add timeout to prevent hanging (shorter for serverless)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Database connection timeout'));
      }, 5000); // 5 second timeout for serverless
    });

    const conn = await Promise.race([connectionPromise, timeoutPromise]);

    // Cache the connection
    cachedConnection = conn;

    logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
      cachedConnection = null; // Clear cache on error
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
      cachedConnection = null; // Clear cache on disconnect
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

    return conn;

  } catch (error) {
    logger.error('Database connection failed:', error.message);
    cachedConnection = null; // Clear cache on error
    throw error; // Don't exit process in serverless environment
  }
};

module.exports = connectDB; 