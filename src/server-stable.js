const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

// Load environment variables
require('dotenv').config();

// Import logger safely
let logger;
try {
  logger = require('./utils/logger');
} catch (error) {
  logger = {
    info: console.log,
    error: console.error,
    warn: console.warn
  };
}

const app = express();
const PORT = process.env.PORT || 5000;

console.log('🚀 Starting FamTree API server (Stable Mode)...');

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

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
    message: 'FamTree API is running (Stable Mode)',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: 'Not connected (Stable Mode)',
    version: '1.0.0'
  });
});

// Test endpoint
app.get('/test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is working!',
    timestamp: new Date().toISOString(),
    mode: 'Stable Mode'
  });
});

// API info endpoint
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'FamTree API',
    version: '1.0.0',
    mode: 'Stable Mode',
    database: 'Not connected',
    endpoints: {
      health: 'GET /health',
      test: 'GET /test',
      api: 'GET /api'
    }
  });
});

// Simple auth endpoints (without database)
app.post('/api/auth/register', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Registration endpoint reached (database not connected)',
    timestamp: new Date().toISOString(),
    data: req.body
  });
});

app.post('/api/auth/signin', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Signin endpoint reached (database not connected)',
    timestamp: new Date().toISOString(),
    data: req.body
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found',
      method: req.method,
      url: req.url
    }
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Something went wrong',
      timestamp: new Date().toISOString()
    }
  });
});

console.log('📋 Server configured, starting...');

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 FamTree API server (Stable Mode) running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/test`);
  console.log(`📚 API info: http://localhost:${PORT}/api`);
  console.log(`🔗 Mode: Stable (No Database Dependencies)`);
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