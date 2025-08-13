const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import custom modules
const logger = require('./utils/logger');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const familyRoutes = require('./routes/families');
const notificationRoutes = require('./routes/notifications');
const searchRoutes = require('./routes/search');

const app = express();

console.log('🚀 Starting FamTree API for Render deployment...');

// Debug: Log environment variables (without sensitive data)
console.log('🔍 Environment Debug:');
console.log('  NODE_ENV:', process.env.NODE_ENV);
console.log('  PORT:', process.env.PORT);
console.log('  MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'NOT SET');
console.log('  JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'NOT SET');
console.log('  CORS_ORIGIN:', process.env.CORS_ORIGIN);
console.log('  RENDER:', process.env.RENDER);

// Security middleware
app.use(helmet());

// CORS configuration for Render
const corsOptions = {
  origin: process.env.CORS_ORIGIN?.split(',') || [
    'http://localhost:3000', 
    'https://famlink.vercel.app',
    'https://famlink-frontend.vercel.app'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP, please try again later.'
    }
  }
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'FamTree API is running on Render',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: 'MongoDB Atlas',
      version: '1.0.0',
      deployment: 'Render',
      env: {
        NODE_ENV: process.env.NODE_ENV,
        RENDER: process.env.RENDER,
        MONGODB_URI: process.env.MONGODB_URI ? 'Set' : 'Not set',
        JWT_SECRET: process.env.JWT_SECRET ? 'Set' : 'Not set',
        PORT: process.env.PORT
      }
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'FamTree API is running but database is unavailable',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: 'Connection failed',
      error: error.message
    });
  }
});

// Test endpoint
app.get('/test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Render server is working!',
    timestamp: new Date().toISOString(),
    deployment: 'Render',
    database: 'MongoDB Atlas'
  });
});

// API info endpoint
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'FamTree API',
    version: '1.0.0',
    deployment: 'Render',
    database: 'MongoDB Atlas',
    endpoints: {
      health: 'GET /health',
      test: 'GET /test',
      api: 'GET /api',
      auth: 'POST /api/auth/register, POST /api/auth/signin',
      users: 'GET /api/users/profile, PUT /api/users/profile',
      families: 'POST /api/families, GET /api/families/my-family',
      search: 'GET /api/search/users, GET /api/search/family-members'
    }
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/families', familyRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/search', searchRoutes);

// 404 handler
app.use(notFound);

// Error handling middleware
app.use(errorHandler);

// Connect to database and start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    logger.info('✅ MongoDB Atlas connected successfully!');

    // Get port from environment or use 5000
    const PORT = process.env.PORT || 5000;

    // Start server
    app.listen(PORT, () => {
      logger.info(`🚀 FamTree API server running on port ${PORT}`);
      logger.info(`📊 Health check: http://localhost:${PORT}/health`);
      logger.info(`🔗 API info: http://localhost:${PORT}/api`);
    });

  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start the server
startServer();

module.exports = app; 