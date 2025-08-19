import { logger } from '../utils/logger.js';

// Custom error class for API errors
export class ApiError extends Error {
  constructor(statusCode, message, isOperational = true, stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

// Error handler middleware
export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    body: req.body,
    params: req.params,
    query: req.query,
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = new ApiError(404, message);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `Duplicate field value: ${field}`;
    error = new ApiError(400, message);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = new ApiError(400, message);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = new ApiError(401, message);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = new ApiError(401, message);
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    const message = 'File too large';
    error = new ApiError(400, message);
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    const message = 'Unexpected file field';
    error = new ApiError(400, message);
  }

  // Rate limit errors
  if (err.status === 429) {
    const message = 'Too many requests';
    error = new ApiError(429, message);
  }

  // Default error
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      statusCode,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
  });
};

// Async error wrapper
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Not found handler
export const notFoundHandler = (req, res, next) => {
  const error = new ApiError(404, `Route ${req.originalUrl} not found`);
  next(error);
};

// Validation error handler
export const validationErrorHandler = (errors) => {
  const message = errors.map(error => error.msg).join(', ');
  return new ApiError(400, message);
};

// Authentication error handler
export const authErrorHandler = (message = 'Authentication required') => {
  return new ApiError(401, message);
};

// Authorization error handler
export const authorizationErrorHandler = (message = 'Insufficient permissions') => {
  return new ApiError(403, message);
};

// Resource not found error handler
export const notFoundErrorHandler = (resource = 'Resource') => {
  return new ApiError(404, `${resource} not found`);
};

// Conflict error handler
export const conflictErrorHandler = (message = 'Resource conflict') => {
  return new ApiError(409, message);
};

// Too many requests error handler
export const rateLimitErrorHandler = (message = 'Too many requests') => {
  return new ApiError(429, message);
};

// Internal server error handler
export const internalErrorHandler = (message = 'Internal server error') => {
  return new ApiError(500, message);
};