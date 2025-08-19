import { createClient } from 'redis';
import { logger } from '../utils/logger.js';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || '';

export const connectRedis = async () => {
  try {
    const client = createClient({
      url: REDIS_URL,
      password: REDIS_PASSWORD || undefined,
      socket: {
        connectTimeout: 10000,
        lazyConnect: true,
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logger.error('Redis max reconnection attempts reached');
            return new Error('Redis max reconnection attempts reached');
          }
          return Math.min(retries * 100, 3000);
        },
      },
    });

    // Handle Redis events
    client.on('error', (err) => {
      logger.error('Redis Client Error:', err);
    });

    client.on('connect', () => {
      logger.info('Redis Client Connected');
    });

    client.on('ready', () => {
      logger.info('Redis Client Ready');
    });

    client.on('end', () => {
      logger.warn('Redis Client Disconnected');
    });

    client.on('reconnecting', () => {
      logger.info('Redis Client Reconnecting...');
    });

    // Connect to Redis
    await client.connect();
    
    // Test connection
    await client.ping();
    logger.info('✅ Redis Connected Successfully');

    return client;
  } catch (error) {
    logger.error('Error connecting to Redis:', error);
    // In development, we can continue without Redis
    if (process.env.NODE_ENV === 'development') {
      logger.warn('Continuing without Redis in development mode');
      return null;
    }
    throw error;
  }
};

export const createRedisClient = () => {
  return createClient({
    url: REDIS_URL,
    password: REDIS_PASSWORD || undefined,
  });
};

export const redisHealthCheck = async (client) => {
  try {
    if (!client) return { status: 'disconnected', error: 'No Redis client' };
    
    const result = await client.ping();
    return {
      status: 'connected',
      ping: result,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
};