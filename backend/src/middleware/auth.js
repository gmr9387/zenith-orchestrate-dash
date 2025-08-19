import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { ApiError, authErrorHandler, authorizationErrorHandler } from './errorHandler.js';
import { logger } from '../utils/logger.js';

// Verify JWT token middleware
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return next(authErrorHandler('Access token required'));
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: process.env.JWT_ISSUER || 'zilliance-api',
    });

    // Check if token is a refresh token
    if (decoded.type === 'refresh') {
      return next(authErrorHandler('Invalid token type'));
    }

    // Find user
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return next(authErrorHandler('User not found'));
    }

    // Check if user is active
    if (!user.isActive) {
      return next(authErrorHandler('User account is deactivated'));
    }

    // Check if user is locked
    if (user.isLocked) {
      return next(authErrorHandler('User account is temporarily locked'));
    }

    // Add user to request object
    req.user = user;
    req.token = decoded;

    // Log successful authentication
    logger.info('User authenticated successfully', {
      userId: user._id,
      email: user.email,
      role: user.role,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(authErrorHandler('Token expired'));
    } else if (error.name === 'JsonWebTokenError') {
      return next(authErrorHandler('Invalid token'));
    } else {
      logger.error('Authentication error:', error);
      return next(authErrorHandler('Authentication failed'));
    }
  }
};

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET, {
        issuer: process.env.JWT_ISSUER || 'zilliance-api',
      });

      if (decoded.type !== 'refresh') {
        const user = await User.findById(decoded.id).select('-password');
        if (user && user.isActive && !user.isLocked) {
          req.user = user;
          req.token = decoded;
        }
      }
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

// Role-based access control middleware
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(authErrorHandler('Authentication required'));
    }

    if (!roles.includes(req.user.role)) {
      return next(authorizationErrorHandler(`Role ${req.user.role} is not authorized`));
    }

    next();
  };
};

// Permission-based access control middleware
export const requirePermission = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(authErrorHandler('Authentication required'));
    }

    if (!req.user.hasAllPermissions(permissions)) {
      return next(authorizationErrorHandler('Insufficient permissions'));
    }

    next();
  };
};

// Any permission middleware (user must have at least one of the specified permissions)
export const requireAnyPermission = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(authErrorHandler('Authentication required'));
    }

    if (!req.user.hasAnyPermission(permissions)) {
      return next(authorizationErrorHandler('Insufficient permissions'));
    }

    next();
  };
};

// Resource ownership middleware
export const requireOwnership = (resourceModel, resourceIdParam = 'id') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return next(authErrorHandler('Authentication required'));
      }

      const resourceId = req.params[resourceIdParam];
      const resource = await resourceModel.findById(resourceId);

      if (!resource) {
        return next(new ApiError(404, 'Resource not found'));
      }

      // Check if user owns the resource or is admin
      if (resource.authorId && resource.authorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return next(authorizationErrorHandler('Access denied: Resource ownership required'));
      }

      req.resource = resource;
      next();
    } catch (error) {
      logger.error('Ownership check error:', error);
      return next(new ApiError(500, 'Ownership verification failed'));
    }
  };
};

// Subscription plan middleware
export const requireSubscriptionPlan = (...plans) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(authErrorHandler('Authentication required'));
    }

    const userPlan = req.user.subscription?.plan || 'free';
    
    if (!plans.includes(userPlan)) {
      return next(authorizationErrorHandler(`Subscription plan ${userPlan} is not authorized for this feature`));
    }

    // Check if subscription is active
    if (req.user.subscription?.status !== 'active') {
      return next(authorizationErrorHandler('Active subscription required'));
    }

    next();
  };
};

// Rate limiting per user middleware
export const userRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const userRequests = new Map();

  return (req, res, next) => {
    if (!req.user) {
      return next(authErrorHandler('Authentication required'));
    }

    const userId = req.user._id.toString();
    const now = Date.now();
    const userData = userRequests.get(userId) || { count: 0, resetTime: now + windowMs };

    // Reset counter if window has passed
    if (now > userData.resetTime) {
      userData.count = 0;
      userData.resetTime = now + windowMs;
    }

    // Check if user has exceeded limit
    if (userData.count >= maxRequests) {
      return next(new ApiError(429, 'Rate limit exceeded for user'));
    }

    // Increment counter
    userData.count++;
    userRequests.set(userId, userData);

    // Add rate limit headers
    res.set({
      'X-RateLimit-Limit': maxRequests,
      'X-RateLimit-Remaining': maxRequests - userData.count,
      'X-RateLimit-Reset': userData.resetTime,
    });

    next();
  };
};

// API key authentication middleware (for external integrations)
export const authenticateApiKey = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;

    if (!apiKey) {
      return next(authErrorHandler('API key required'));
    }

    // In a real implementation, you would validate against stored API keys
    // For now, we'll use a simple environment variable check
    if (apiKey !== process.env.API_KEY) {
      return next(authErrorHandler('Invalid API key'));
    }

    // Create a minimal user object for API key requests
    req.user = {
      _id: 'api-key-user',
      email: 'api@zilliance.com',
      role: 'api',
      permissions: ['read:tutorials', 'write:tutorials'],
      isActive: true,
    };

    next();
  } catch (error) {
    logger.error('API key authentication error:', error);
    return next(authErrorHandler('API key authentication failed'));
  }
};

// Session validation middleware
export const validateSession = async (req, res, next) => {
  try {
    if (!req.session || !req.session.userId) {
      return next(authErrorHandler('Valid session required'));
    }

    const user = await User.findById(req.session.userId).select('-password');
    
    if (!user || !user.isActive || user.isLocked) {
      // Clear invalid session
      req.session.destroy();
      return next(authErrorHandler('Invalid session'));
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error('Session validation error:', error);
    return next(authErrorHandler('Session validation failed'));
  }
};

// Two-factor authentication middleware
export const require2FA = async (req, res, next) => {
  try {
    if (!req.user) {
      return next(authErrorHandler('Authentication required'));
    }

    // Check if 2FA is enabled for the user
    if (req.user.twoFactorEnabled && !req.session.twoFactorVerified) {
      return next(authErrorHandler('Two-factor authentication required'));
    }

    next();
  } catch (error) {
    logger.error('2FA check error:', error);
    return next(authErrorHandler('Two-factor authentication check failed'));
  }
};

// Audit logging middleware
export const auditLog = (action) => {
  return (req, res, next) => {
    const auditData = {
      action,
      userId: req.user?._id,
      userEmail: req.user?.email,
      userRole: req.user?.role,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      method: req.method,
      url: req.originalUrl,
      params: req.params,
      query: req.query,
      body: req.body,
      timestamp: new Date(),
    };

    // Log audit event
    logger.info('Audit log', auditData);

    // Store audit data in request for potential database logging
    req.auditData = auditData;

    next();
  };
};