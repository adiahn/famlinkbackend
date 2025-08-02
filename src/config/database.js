const mongoose = require('mongoose');
const logger = require('../utils/logger');

// Cache the connection to avoid creating multiple connections
let cachedConnection = null;

const connectDB = async () => {
  try {
    // Debug: Log the MongoDB URI check
    console.log('🔍 Database Debug:');
    console.log('  NODE_ENV:', process.env.NODE_ENV);
    console.log('  MONGODB_URI:', process.env.MONGODB_URI ? 'Present' : 'Missing');
    console.log('  MONGODB_URI_PROD:', process.env.MONGODB_URI_PROD ? 'Present' : 'Missing');

    // If we already have a connection, return it
    if (cachedConnection && mongoose.connection.readyState === 1) {
      return cachedConnection;
    }

    const mongoURI = process.env.NODE_ENV === 'production' 
      ? process.env.MONGODB_URI_PROD 
      : process.env.MONGODB_URI;

    console.log('  Using URI:', mongoURI ? 'Present' : 'Missing');

    if (!mongoURI) {
      console.log('  ❌ No MongoDB URI found in environment variables');
      console.log('  Available env vars:', Object.keys(process.env).filter(key => key.includes('MONGODB')));
      throw new Error('MongoDB URI is not defined in environment variables');
    }

    // Close existing connection if it exists but is not ready
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    // Render-optimized connection options (traditional server)
    const connectionOptions = {
      maxPoolSize: 10, // Higher pool size for traditional server
      serverSelectionTimeoutMS: 30000, // Longer timeout for Render
      socketTimeoutMS: 45000, // Longer timeout
      bufferCommands: true, // Enable mongoose buffering
      connectTimeoutMS: 30000, // Connection timeout
      heartbeatFrequencyMS: 10000, // Heartbeat frequency
    };

    // Connect to MongoDB
    const conn = await mongoose.connect(mongoURI, connectionOptions);

    // Cache the connection
    cachedConnection = conn;

    logger.info(`✅ MongoDB Atlas connected successfully: ${conn.connection.host}`);

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
    throw error;
  }
};

module.exports = connectDB; 