const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const connectDB = require('./config/database');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const familyRoutes = require('./routes/families');
const searchRoutes = require('./routes/search');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB only if not in serverless environment
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  // Try to connect to MongoDB, but don't block server startup
  connectDB().catch(err => {
    logger.warn('⚠️  MongoDB connection failed during startup:', err.message);
    logger.info('🚀 Server will start without database connection');
    logger.info('📝 Database will be connected on first request');
  });
}

// Middleware to ensure database connection in serverless
app.use(async (req, res, next) => {
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL) {
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
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
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
    message: 'FamTree API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: process.env.NODE_ENV === 'production' ? 'connected' : 'local'
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

// Only start the server if not in serverless environment
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  const server = app.listen(PORT, () => {
    logger.info(`🚀 FamTree API server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
    logger.info(`📊 Health check available at: http://localhost:${PORT}/health`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    server.close(() => {
      logger.info('Process terminated');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    server.close(() => {
      logger.info('Process terminated');
      process.exit(0);
    });
  });
}

module.exports = app; 