const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// Load environment variables
require('dotenv').config();

// Import modules
const logger = require('./utils/logger');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const familyRoutes = require('./routes/families');
const searchRoutes = require('./routes/search');

const app = express();

console.log('🚀 Setting up FamTree API for Vercel deployment...');

// Connect to MongoDB Atlas (for serverless, this will be called on each request)
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