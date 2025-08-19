import { logger } from '../utils/logger.js';

export const notFoundHandler = (req, res) => {
  logger.warn(`Route not found: ${req.method} ${req.originalUrl}`);
  
  res.status(404).json({
    success: false,
    error: {
      message: 'Route not found',
      statusCode: 404,
      path: req.originalUrl,
      method: req.method,
    },
  });
};