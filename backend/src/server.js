import express from 'express';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import middleware and utilities
import { errorHandler } from './middleware/errorHandler.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { logger } from './utils/logger.js';

// Load environment variables
dotenv.config();

// ES Module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// In-memory storage for development (replace with database later)
const tutorials = [
  {
    id: 'tutorial_1',
    title: 'Getting Started with Zilliance',
    description: 'Learn the basics of our platform',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tutorial_2',
    title: 'Advanced Features',
    description: 'Master advanced platform capabilities',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Basic security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

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

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
    services: {
      database: 'development_mode',
      redis: 'development_mode',
    },
    message: 'Backend running in development mode without external databases',
  });
});

// Simple test endpoint
app.get('/api/v1/test', (req, res) => {
  res.json({
    success: true,
    message: 'Backend is working!',
    timestamp: new Date().toISOString(),
  });
});

// Mock auth endpoint for testing
app.post('/api/v1/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (email && password) {
    res.json({
      success: true,
      message: 'Login successful (mock)',
      user: {
        id: 'mock_user_123',
        email: email,
        role: 'user',
        firstName: 'Mock',
        lastName: 'User',
      },
      token: 'mock_jwt_token_' + Date.now(),
    });
  } else {
    res.status(400).json({
      success: false,
      message: 'Email and password required',
    });
  }
});

// Tutorial endpoints
app.get('/api/v1/tutorials', (req, res) => {
  res.json({
    success: true,
    data: tutorials,
    total: tutorials.length,
  });
});

app.post('/api/v1/tutorials', (req, res) => {
  const { title, description, type } = req.body;
  
  if (!title) {
    return res.status(400).json({
      success: false,
      message: 'Title is required',
    });
  }
  
  const newTutorial = {
    id: `tutorial_${Date.now()}`,
    title,
    description: description || 'A new tutorial',
    type: type || 'manual',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  tutorials.push(newTutorial);
  
  logger.info(`Tutorial created: ${title}`);
  
  res.status(201).json({
    success: true,
    message: 'Tutorial created successfully',
    data: newTutorial,
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Zilliance Backend Server running on port ${PORT}`);
  logger.info(`🌍 Environment: ${NODE_ENV}`);
  logger.info(`📊 Health check: http://localhost:${PORT}/health`);
  logger.info(`🔗 API Base: http://localhost:${PORT}/api/v1`);
  logger.info(`⚠️  Running in development mode without external databases`);
});

export default app;