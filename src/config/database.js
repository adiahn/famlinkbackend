const mongoose = require('mongoose');
const logger = require('../utils/logger');

// Cache the connection to avoid creating multiple connections in serverless
let cachedConnection = null;

const connectDB = async () => {
  try {
    // If we already have a connection, return it
    if (cachedConnection) {
      return cachedConnection;
    }

    const mongoURI = process.env.NODE_ENV === 'production' 
      ? process.env.MONGODB_URI_PROD 
      : process.env.MONGODB_URI;

    if (!mongoURI) {
      throw new Error('MongoDB URI is not defined in environment variables');
    }

    const conn = await mongoose.connect(mongoURI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false, // Disable mongoose buffering
    });

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