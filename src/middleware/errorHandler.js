const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message,
        details: { field: err.path, value: err.value }
      }
    };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    const message = `Duplicate field value: ${field} = ${value}`;
    error = {
      success: false,
      error: {
        code: 'CONFLICT',
        message,
        details: { field, value }
      }
    };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = 'Validation Error';
    const details = Object.values(err.errors).map(val => ({
      field: val.path,
      message: val.message
    }));
    error = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message,
        details
      }
    };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = {
      success: false,
      error: {
        code: 'AUTHENTICATION_ERROR',
        message
      }
    };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = {
      success: false,
      error: {
        code: 'AUTHENTICATION_ERROR',
        message
      }
    };
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    const message = 'File too large';
    error = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message,
        details: { field: 'file', message: 'File size exceeds limit' }
      }
    };
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    const message = 'Unexpected file field';
    error = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message,
        details: { field: 'file', message: 'Unexpected file field' }
      }
    };
  }

  // Default error
  if (!error.success) {
    error = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: process.env.NODE_ENV === 'production' 
          ? 'Internal server error' 
          : err.message
      }
    };
  }

  res.status(error.statusCode || 500).json(error);
};

module.exports = errorHandler; 