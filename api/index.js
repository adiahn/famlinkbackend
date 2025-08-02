// Safe module imports with error handling
let express, cors, helmet, compression, morgan, rateLimit;
let logger, connectDB, errorHandler, notFound;
let authRoutes, userRoutes, familyRoutes, searchRoutes;

try {
  // Load environment variables
  require('dotenv').config();
  
  // Import Express and middleware
  express = require('express');
  cors = require('cors');
  helmet = require('helmet');
  compression = require('compression');
  morgan = require('morgan');
  rateLimit = require('express-rate-limit');
  
  // Import custom modules
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
  console.error('Module import error:', error.message);
  // Fallback response for import errors
  module.exports = (req, res) => {
    res.status(500).json({
      success: false,
      error: {
        code: 'MODULE_IMPORT_ERROR',
        message: 'Server configuration error',
        details: error.message
      }
    });
  };
  return;
}

const app = express();

console.log('🚀 Setting up FamTree API for Vercel deployment...');

// Database connection status
let dbConnected = false;
let dbConnectionPromise = null;

// Initialize database connection
const initializeDB = async () => {
  if (dbConnectionPromise) return dbConnectionPromise;
  
  dbConnectionPromise = connectDB()
    .then(() => {
      console.log('✅ MongoDB Atlas connected successfully!');
      dbConnected = true;
      return true;
    })
    .catch(err => {
      console.log('⚠️  MongoDB connection failed:', err.message);
      dbConnected = false;
      throw err;
    });
  
  return dbConnectionPromise;
};

// Middleware to ensure database connection on each request
const ensureDBConnection = async (req, res, next) => {
  try {
    if (!dbConnected) {
      await initializeDB();
    }
    next();
  } catch (error) {
    console.error('Database connection error in middleware:', error.message);
    res.status(503).json({
      success: false,
      error: {
        code: 'DATABASE_UNAVAILABLE',
        message: 'Database connection failed',
        details: error.message
      }
    });
  }
};

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'https://your-frontend-domain.vercel.app'],
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
    // Try to connect to database if not connected
    if (!dbConnected) {
      await initializeDB();
    }
    
    res.status(200).json({
      success: true,
      message: 'FamTree API is running on Vercel',
      timestamp: new Date().toISOString(),
      environment: 'production',
      database: dbConnected ? 'MongoDB Atlas Connected' : 'Database not connected',
      version: '1.0.0',
      env: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: process.env.VERCEL,
        MONGODB_URI: process.env.MONGODB_URI ? 'Set' : 'Not set',
        JWT_SECRET: process.env.JWT_SECRET ? 'Set' : 'Not set'
      }
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'FamTree API is running but database is unavailable',
      timestamp: new Date().toISOString(),
      environment: 'production',
      database: 'Connection failed',
      error: error.message
    });
  }
});

// Test endpoint
app.get('/test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Serverless function is working!',
    timestamp: new Date().toISOString(),
    database: dbConnected ? 'MongoDB Atlas' : 'Not connected'
  });
});

// API info endpoint
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'FamTree API',
    version: '1.0.0',
    deployment: 'Vercel Serverless',
    database: dbConnected ? 'MongoDB Atlas' : 'Not connected',
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

// Apply database connection middleware to API routes
app.use('/api/auth', ensureDBConnection, authRoutes);
app.use('/api/users', ensureDBConnection, userRoutes);
app.use('/api/families', ensureDBConnection, familyRoutes);
app.use('/api/search', ensureDBConnection, searchRoutes);

// 404 handler
app.use(notFound);

// Error handling middleware
app.use(errorHandler);

console.log('📋 Vercel serverless function configured successfully');

module.exports = app; 