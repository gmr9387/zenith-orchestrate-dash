import { body, param, query, validationResult } from 'express-validator';
import { logger } from '../../utils/logger.js';
import { getAuditLogger } from './audit.js';

// Common validation patterns
const VALIDATION_PATTERNS = {
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  url: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  phone: /^\+?[1-9]\d{1,14}$/,
  date: /^\d{4}-\d{2}-\d{2}$/,
  time: /^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/,
  ipv4: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
  ipv6: /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/,
};

// Sanitization functions
const sanitizers = {
  // Remove HTML tags and dangerous characters
  stripHtml: (value) => {
    if (typeof value !== 'string') return value;
    return value.replace(/<[^>]*>/g, '').replace(/[<>]/g, '');
  },

  // Escape special characters
  escapeHtml: (value) => {
    if (typeof value !== 'string') return value;
    const htmlEscapes = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;',
    };
    return value.replace(/[&<>"'/]/g, (match) => htmlEscapes[match]);
  },

  // Normalize email addresses
  normalizeEmail: (value) => {
    if (typeof value !== 'string') return value;
    return value.toLowerCase().trim();
  },

  // Truncate long strings
  truncate: (value, maxLength = 1000) => {
    if (typeof value !== 'string') return value;
    return value.length > maxLength ? value.substring(0, maxLength) : value;
  },

  // Remove null bytes and control characters
  removeControlChars: (value) => {
    if (typeof value !== 'string') return value;
    return value.replace(/[\x00-\x1F\x7F]/g, '');
  },

  // Validate and sanitize file names
  sanitizeFileName: (value) => {
    if (typeof value !== 'string') return value;
    return value.replace(/[^a-zA-Z0-9._-]/g, '_');
  },
};

// XSS Protection middleware
export const xssProtection = (req, res, next) => {
  try {
    // Sanitize request body
    if (req.body) {
      req.body = sanitizeObject(req.body);
    }

    // Sanitize query parameters
    if (req.query) {
      req.query = sanitizeObject(req.query);
    }

    // Sanitize URL parameters
    if (req.params) {
      req.params = sanitizeObject(req.params);
    }

    next();
  } catch (error) {
    logger.error('XSS protection failed:', error);
    next(error);
  }
};

// Recursively sanitize objects
function sanitizeObject(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return sanitizeValue(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeValue);
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    sanitized[key] = sanitizeValue(value);
  }

  return sanitized;
}

// Sanitize individual values
function sanitizeValue(value) {
  if (typeof value === 'string') {
    return sanitizers.stripHtml(sanitizers.removeControlChars(value));
  }
  return value;
}

// SQL Injection Protection
export const sqlInjectionProtection = (req, res, next) => {
  const sqlPatterns = [
    /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute|script)\b)/i,
    /(\b(and|or)\s+\d+\s*=\s*\d+)/i,
    /(\b(and|or)\s+['"]?\w+['"]?\s*=\s*['"]?\w+['"]?)/i,
    /(--|\/\*|\*\/|xp_|sp_)/i,
  ];

  const checkValue = (value) => {
    if (typeof value === 'string') {
      return sqlPatterns.some(pattern => pattern.test(value));
    }
    return false;
  };

  const checkObject = (obj) => {
    if (typeof obj !== 'object' || obj === null) {
      return checkValue(obj);
    }

    if (Array.isArray(obj)) {
      return obj.some(checkValue);
    }

    return Object.values(obj).some(checkValue);
  };

  try {
    const hasSqlInjection = checkObject(req.body) || checkObject(req.query) || checkObject(req.params);

    if (hasSqlInjection) {
      const auditLogger = getAuditLogger();
      if (auditLogger) {
        auditLogger.logSecurityEvent('security.sql_injection_attempt', {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          url: req.originalUrl,
          method: req.method,
        });
      }

      logger.warn('SQL injection attempt detected', {
        ip: req.ip,
        url: req.originalUrl,
        userAgent: req.get('User-Agent'),
      });

      return res.status(400).json({
        error: 'Invalid input detected',
        message: 'Request contains potentially malicious content',
      });
    }

    next();
  } catch (error) {
    logger.error('SQL injection protection failed:', error);
    next(error);
  }
};

// NoSQL Injection Protection
export const noSqlInjectionProtection = (req, res, next) => {
  const noSqlPatterns = [
    /\$where/i,
    /\$ne/i,
    /\$gt/i,
    /\$lt/i,
    /\$regex/i,
    /\$in/i,
    /\$nin/i,
    /\$exists/i,
    /\$type/i,
  ];

  const checkValue = (value) => {
    if (typeof value === 'string') {
      return noSqlPatterns.some(pattern => pattern.test(value));
    }
    return false;
  };

  const checkObject = (obj) => {
    if (typeof obj !== 'object' || obj === null) {
      return checkValue(obj);
    }

    if (Array.isArray(obj)) {
      return obj.some(checkValue);
    }

    return Object.values(obj).some(checkValue);
  };

  try {
    const hasNoSqlInjection = checkObject(req.body) || checkObject(req.query) || checkObject(req.params);

    if (hasNoSqlInjection) {
      const auditLogger = getAuditLogger();
      if (auditLogger) {
        auditLogger.logSecurityEvent('security.nosql_injection_attempt', {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          url: req.originalUrl,
          method: req.method,
        });
      }

      logger.warn('NoSQL injection attempt detected', {
        ip: req.ip,
        url: req.originalUrl,
        userAgent: req.get('User-Agent'),
      });

      return res.status(400).json({
        error: 'Invalid input detected',
        message: 'Request contains potentially malicious content',
      });
    }

    next();
  } catch (error) {
    logger.error('NoSQL injection protection failed:', error);
    next(error);
  }
};

// Content Type Validation
export const validateContentType = (allowedTypes = ['application/json']) => {
  return (req, res, next) => {
    const contentType = req.get('Content-Type');
    
    if (!contentType) {
      return res.status(400).json({
        error: 'Content-Type header required',
        message: 'Please specify the content type',
      });
    }

    const isValidType = allowedTypes.some(type => 
      contentType.includes(type) || contentType.includes('multipart/form-data')
    );

    if (!isValidType) {
      return res.status(415).json({
        error: 'Unsupported media type',
        message: `Content-Type must be one of: ${allowedTypes.join(', ')}`,
      });
    }

    next();
  };
};

// File Upload Validation
export const validateFileUpload = (options = {}) => {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
    maxFiles = 5,
  } = options;

  return (req, res, next) => {
    if (!req.files || Object.keys(req.files).length === 0) {
      return next();
    }

    const files = Array.isArray(req.files) ? req.files : Object.values(req.files);

    if (files.length > maxFiles) {
      return res.status(400).json({
        error: 'Too many files',
        message: `Maximum ${maxFiles} files allowed`,
      });
    }

    for (const file of files) {
      // Check file size
      if (file.size > maxSize) {
        return res.status(400).json({
          error: 'File too large',
          message: `File ${file.name} exceeds maximum size of ${maxSize / (1024 * 1024)}MB`,
        });
      }

      // Check file type
      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({
          error: 'Invalid file type',
          message: `File type ${file.mimetype} not allowed`,
        });
      }

      // Sanitize filename
      file.name = sanitizers.sanitizeFileName(file.name);
    }

    next();
  };
};

// Rate Limiting Headers
export const addRateLimitHeaders = (req, res, next) => {
  res.setHeader('X-RateLimit-Limit', process.env.RATE_LIMIT_MAX_REQUESTS || 100);
  res.setHeader('X-RateLimit-Remaining', res.getHeader('X-RateLimit-Remaining') || 'unknown');
  res.setHeader('X-RateLimit-Reset', res.getHeader('X-RateLimit-Reset') || 'unknown');
  next();
};

// Security Headers
export const addSecurityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
};

// Validation error handler
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const auditLogger = getAuditLogger();
    if (auditLogger) {
      auditLogger.logSecurityEvent('validation.failed', {
        ipAddress: req.ip,
        url: req.originalUrl,
        method: req.method,
        errors: errors.array(),
      });
    }

    return res.status(400).json({
      error: 'Validation failed',
      message: 'Please check your input',
      details: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value,
      })),
    });
  }

  next();
};

// Common validation chains
export const commonValidations = {
  // User registration
  register: [
    body('email')
      .isEmail()
      .withMessage('Please enter a valid email address')
      .normalizeEmail()
      .customSanitizer(sanitizers.normalizeEmail),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(VALIDATION_PATTERNS.password)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    body('firstName')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('First name must be between 2 and 50 characters')
      .customSanitizer(sanitizers.stripHtml),
    body('lastName')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Last name must be between 2 and 50 characters')
      .customSanitizer(sanitizers.stripHtml),
    body('role')
      .optional()
      .isIn(['user', 'admin', 'enterprise'])
      .withMessage('Invalid role specified'),
  ],

  // User login
  login: [
    body('email')
      .isEmail()
      .withMessage('Please enter a valid email address')
      .normalizeEmail()
      .customSanitizer(sanitizers.normalizeEmail),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
  ],

  // Password reset
  passwordReset: [
    body('email')
      .isEmail()
      .withMessage('Please enter a valid email address')
      .normalizeEmail()
      .customSanitizer(sanitizers.normalizeEmail),
  ],

  // Password update
  passwordUpdate: [
    body('token')
      .notEmpty()
      .withMessage('Reset token is required')
      .customSanitizer(sanitizers.removeControlChars),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(VALIDATION_PATTERNS.password)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  ],

  // UUID parameter validation
  uuidParam: [
    param('id')
      .isUUID()
      .withMessage('Invalid ID format'),
  ],

  // Pagination query validation
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
  ],
};

export default {
  xssProtection,
  sqlInjectionProtection,
  noSqlInjectionProtection,
  validateContentType,
  validateFileUpload,
  addRateLimitHeaders,
  addSecurityHeaders,
  handleValidationErrors,
  commonValidations,
  sanitizers,
};