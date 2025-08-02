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

// Connect to MongoDB Atlas
let dbConnected = false;
connectDB()
  .then(() => {
    console.log('✅ MongoDB Atlas connected successfully!');
    dbConnected = true;
  })
  .catch(err => {
    console.log('⚠️  MongoDB connection failed:', err.message);
    dbConnected = false;
  });

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
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'FamTree API is running on Vercel',
    timestamp: new Date().toISOString(),
    environment: 'production',
    database: dbConnected ? 'MongoDB Atlas Connected' : 'Database not connected',
    version: '1.0.0'
  });
});

// Test endpoint
app.get('/test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Serverless function is working with Database!',
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

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/families', familyRoutes);
app.use('/api/search', searchRoutes);

// 404 handler
app.use(notFound);

// Error handling middleware
app.use(errorHandler);

console.log('📋 Vercel serverless function configured successfully');

module.exports = app; 