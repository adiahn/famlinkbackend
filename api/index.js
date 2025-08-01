const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// Load environment variables
require('dotenv').config();

// Import modules safely
let logger, connectDB, errorHandler, notFound;
let authRoutes, userRoutes, familyRoutes, searchRoutes;

try {
  logger = require('../src/utils/logger');
  connectDB = require('../src/config/database');
  errorHandler = require('../src/middleware/errorHandler');
  notFound = require('../src/middleware/notFound');
  
  // Import routes
  authRoutes = require('../src/routes/auth');
  userRoutes = require('../src/routes/users');
  familyRoutes = require('../src/routes/families');
  searchRoutes = require('../src/routes/search');
} catch (error) {
  console.log('⚠️  Some modules not available:', error.message);
  // Create fallback modules
  logger = {
    info: console.log,
    error: console.error,
    warn: console.warn
  };
  errorHandler = (err, req, res, next) => {
    res.status(500).json({ error: 'Internal server error' });
  };
  notFound = (req, res) => {
    res.status(404).json({ error: 'Not found' });
  };
  authRoutes = express.Router();
  userRoutes = express.Router();
  familyRoutes = express.Router();
  searchRoutes = express.Router();
}

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
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
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'FamTree API is running (Vercel Serverless)',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    database: 'MongoDB Atlas',
    version: '1.0.0'
  });
});

// Test endpoint
app.get('/test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Serverless function is working!',
    timestamp: new Date().toISOString(),
    database: 'MongoDB Atlas'
  });
});

// API info endpoint
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'FamTree API',
    version: '1.0.0',
    database: 'MongoDB Atlas',
    deployment: 'Vercel Serverless',
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

// Database connection middleware for serverless
app.use(async (req, res, next) => {
  if (connectDB) {
    try {
      await connectDB();
    } catch (error) {
      logger.error('Failed to connect to database:', error);
      return res.status(503).json({
        success: false,
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Database service is temporarily unavailable'
        }
      });
    }
  }
  next();
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/families', familyRoutes);
app.use('/api/search', searchRoutes);

// 404 handler
app.use(notFound);

// Error handling middleware
app.use(errorHandler);

// Export the Express app for Vercel
module.exports = app; 