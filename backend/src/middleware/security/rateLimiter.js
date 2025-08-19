import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { logger } from '../../utils/logger.js';

// Per-IP rate limiter for general API endpoints
export const createIPRateLimiter = (redisClient, options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // limit each IP to 100 requests per windowMs
    message = 'Too many requests from this IP, please try again later.',
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
  } = options;

  const store = redisClient ? new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
    prefix: 'rate_limit:ip:',
  }) : undefined;

  return rateLimit({
    windowMs,
    max,
    message: {
      error: 'Rate limit exceeded',
      message,
      retryAfter: Math.ceil(windowMs / 1000 / 60),
    },
    standardHeaders: true,
    legacyHeaders: false,
    store,
    skipSuccessfulRequests,
    skipFailedRequests,
    handler: (req, res) => {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: req.originalUrl,
      });
      res.status(429).json({
        error: 'Rate limit exceeded',
        message,
        retryAfter: Math.ceil(windowMs / 1000 / 60),
      });
    },
  });
};

// Per-account rate limiter for authenticated endpoints
export const createAccountRateLimiter = (redisClient, options = {}) => {
  const {
    windowMs = 15 * 60 * 1000,
    max = 200,
    message = 'Too many requests for this account, please try again later.',
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
  } = options;

  const store = redisClient ? new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
    prefix: 'rate_limit:account:',
  }) : undefined;

  return rateLimit({
    windowMs,
    max,
    message: {
      error: 'Account rate limit exceeded',
      message,
      retryAfter: Math.ceil(windowMs / 1000 / 60),
    },
    standardHeaders: true,
    legacyHeaders: false,
    store,
    skipSuccessfulRequests,
    skipFailedRequests,
    keyGenerator: (req) => {
      // Use user ID if authenticated, fallback to IP
      return req.user?.id || req.ip;
    },
    handler: (req, res) => {
      logger.warn('Account rate limit exceeded', {
        userId: req.user?.id,
        ip: req.ip,
        endpoint: req.originalUrl,
      });
      res.status(429).json({
        error: 'Account rate limit exceeded',
        message,
        retryAfter: Math.ceil(windowMs / 1000 / 60),
      });
    },
  });
};

// Strict rate limiter for auth endpoints
export const createAuthRateLimiter = (redisClient) => {
  const store = redisClient ? new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
    prefix: 'rate_limit:auth:',
  }) : undefined;

  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per 15 minutes for auth
    message: {
      error: 'Too many authentication attempts',
      message: 'Too many failed attempts. Please try again later.',
      retryAfter: 15,
    },
    standardHeaders: true,
    legacyHeaders: false,
    store,
    skipSuccessfulRequests: true, // Only count failed attempts
    skipFailedRequests: false,
    keyGenerator: (req) => {
      // Use email for login/register, IP for other auth endpoints
      const email = req.body?.email;
      return email ? `auth:${email}` : req.ip;
    },
    handler: (req, res) => {
      logger.warn('Auth rate limit exceeded', {
        email: req.body?.email,
        ip: req.ip,
        endpoint: req.originalUrl,
      });
      res.status(429).json({
        error: 'Too many authentication attempts',
        message: 'Too many failed attempts. Please try again later.',
        retryAfter: 15,
      });
    },
  });
};

// Brute force protection for password attempts
export const createPasswordRateLimiter = (redisClient) => {
  const store = redisClient ? new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
    prefix: 'rate_limit:password:',
  }) : undefined;

  return rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 password attempts per hour
    message: {
      error: 'Too many password attempts',
      message: 'Too many password attempts. Please try again later.',
      retryAfter: 60,
    },
    standardHeaders: true,
    legacyHeaders: false,
    store,
    skipSuccessfulRequests: true,
    skipFailedRequests: false,
    keyGenerator: (req) => {
      const email = req.body?.email;
      return email ? `password:${email}` : req.ip;
    },
    handler: (req, res) => {
      logger.warn('Password rate limit exceeded', {
        email: req.body?.email,
        ip: req.ip,
        endpoint: req.originalUrl,
      });
      res.status(429).json({
        error: 'Too many password attempts',
        message: 'Too many password attempts. Please try again later.',
        retryAfter: 60,
      });
    },
  });
};