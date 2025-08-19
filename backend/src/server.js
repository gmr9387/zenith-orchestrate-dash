import express from 'express';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import RedisStore from 'connect-redis';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import middleware and utilities
import { errorHandler } from './middleware/errorHandler.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { logger } from './utils/logger.js';
import { connectDB } from './database/connection.js';
import { connectRedis } from './database/redis.js';
import { createSecurityHeaders, createCORSConfig } from './middleware/security/helmet.js';
import { createIPRateLimiter, createAccountRateLimiter } from './middleware/security/rateLimiter.js';

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import tutorialRoutes from './routes/tutorials.js';
import storageRoutes from './routes/storage.js';
import analyticsRoutes from './routes/analytics.js';
import webhookRoutes from './routes/webhooks.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__dirname);

const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Connect to databases
await connectDB();
const redisClient = await connectRedis();

// Expose Redis client to routes via app.locals
app.locals.redisClient = redisClient;

// Security middleware
app.use(createSecurityHeaders({
  enableCSP: NODE_ENV === 'production',
  enableHSTS: NODE_ENV === 'production',
}));

// CORS configuration
app.use(cors(createCORSConfig({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-API-Key'],
}));

// Global rate limiting
const globalLimiter = createIPRateLimiter(redisClient, {
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
});

app.use('/api/', globalLimiter);

// Session configuration with Redis (if needed for future features)
if (redisClient) {
  app.use(session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.AUTH_SESSION_SECRET || 'fallback-secret',
    name: 'zilliance.sid',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.AUTH_COOKIE_SECURE === 'true',
      httpOnly: true,
      maxAge: parseInt(process.env.SESSION_TIMEOUT) || 24 * 60 * 60 * 1000,
      domain: process.env.AUTH_COOKIE_DOMAIN || 'localhost',
      sameSite: 'lax',
    },
  }));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  }));
}

// Static files (for development)
if (NODE_ENV === 'development') {
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
}

// Health check endpoint with detailed status
app.get('/health', async (req, res) => {
  try {
    const dbStatus = await import('./database/connection.js').then(m => m.getDBStatus());
    const redisStatus = redisClient ? await import('./database/redis.js').then(m => m.redisHealthCheck(redisClient)) : { status: 'not_configured' };
    
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: dbStatus,
        redis: redisStatus,
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024),
      },
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

// API routes with account-level rate limiting for authenticated endpoints
app.use(`/api/${process.env.API_VERSION || 'v1'}/auth`, authRoutes);
app.use(`/api/${process.env.API_VERSION || 'v1'}/users`, createAccountRateLimiter(redisClient), userRoutes);
app.use(`/api/${process.env.API_VERSION || 'v1'}/tutorials`, createAccountRateLimiter(redisClient), tutorialRoutes);
app.use(`/api/${process.env.API_VERSION || 'v1'}/storage`, createAccountRateLimiter(redisClient), storageRoutes);
app.use(`/api/${process.env.API_VERSION || 'v1'}/analytics`, createAccountRateLimiter(redisClient), analyticsRoutes);
app.use(`/api/${process.env.API_VERSION || 'v1'}/webhooks`, webhookRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handling middleware
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received, shutting down gracefully`);
  
  try {
    if (redisClient) {
      await redisClient.quit();
      logger.info('Redis connection closed');
    }
    
    await import('./database/connection.js').then(m => m.disconnectDB());
    logger.info('MongoDB connection closed');
    
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Zilliance Backend Server running on port ${PORT}`);
  logger.info(`🌍 Environment: ${NODE_ENV}`);
  logger.info(`📊 Health check: http://localhost:${PORT}/health`);
  logger.info(`🔗 API Base: http://localhost:${PORT}/api/${process.env.API_VERSION || 'v1'}`);
  logger.info(`🔒 Security: ${NODE_ENV === 'production' ? 'Production' : 'Development'} mode`);
});

export default app;