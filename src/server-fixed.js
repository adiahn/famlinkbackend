const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// Load environment variables safely
try {
  require('dotenv').config();
} catch (error) {
  console.log('⚠️  dotenv not loaded, using defaults');
}

// Import modules safely
let logger;
try {
  logger = require('./utils/logger');
} catch (error) {
  console.log('⚠️  Logger not available, using console');
  logger = {
    info: console.log,
    error: console.error,
    warn: console.warn
  };
}

let connectDB, errorHandler, notFound;
try {
  connectDB = require('./config/database');
  errorHandler = require('./middleware/errorHandler');
  notFound = require('./middleware/notFound');
} catch (error) {
  console.log('⚠️  Some modules not available, using basic setup');
  errorHandler = (err, req, res, next) => {
    res.status(500).json({ error: 'Internal server error' });
  };
  notFound = (req, res) => {
    res.status(404).json({ error: 'Not found' });
  };
}

// Import routes safely
let authRoutes, userRoutes, familyRoutes, searchRoutes;
try {
  authRoutes = require('./routes/auth');
  userRoutes = require('./routes/users');
  familyRoutes = require('./routes/families');
  searchRoutes = require('./routes/search');
} catch (error) {
  console.log('⚠️  Routes not available, using basic endpoints');
  authRoutes = express.Router();
  userRoutes = express.Router();
  familyRoutes = express.Router();
  searchRoutes = express.Router();
}

const app = express();
const PORT = process.env.PORT || 5000;

console.log('🚀 Starting FamTree API server...');

// Try to connect to MongoDB, but don't block startup
if (connectDB && (process.env.NODE_ENV !== 'production' || !process.env.VERCEL)) {
  console.log('📊 Attempting database connection...');
  connectDB().catch(err => {
    console.log('⚠️  MongoDB connection failed:', err.message);
    console.log('🚀 Server will start without database connection');
  });
}

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
    message: 'FamTree API is running (Fixed Mode)',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: 'checking...'
  });
});

// Test endpoint
app.get('/test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is working!',
    timestamp: new Date().toISOString()
  });
});

// API routes (only if available)
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/families', familyRoutes);
app.use('/api/search', searchRoutes);

// 404 handler
app.use(notFound);

// Error handling middleware
app.use(errorHandler);

console.log('📋 Server configured, starting...');

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 FamTree API server (Fixed Mode) running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/test`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

module.exports = app; 