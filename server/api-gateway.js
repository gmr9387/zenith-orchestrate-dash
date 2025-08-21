import express from 'express';
import { nanoid } from 'nanoid';
import sqlite3 from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { z } from 'zod';

class ApiGateway {
  constructor(db, config = {}) {
    this.db = db;
    this.config = {
      cacheTimeout: config.cacheTimeout || 300, // 5 minutes
      maxRequestsPerMinute: config.maxRequestsPerMinute || 100,
      maxRequestsPerHour: config.maxRequestsPerHour || 1000,
      ...config
    };

    this.router = express.Router();
    this.setupDatabase();
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupDatabase() {
    // API endpoints table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS api_endpoints (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        path TEXT NOT NULL UNIQUE,
        method TEXT NOT NULL,
        targetUrl TEXT NOT NULL,
        headers TEXT, -- JSON object
        timeout INTEGER DEFAULT 30000,
        rateLimit INTEGER DEFAULT 100,
        isActive INTEGER NOT NULL DEFAULT 1,
        createdBy TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE CASCADE
      );
      
      CREATE TABLE IF NOT EXISTS api_keys (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        name TEXT NOT NULL,
        keyHash TEXT NOT NULL UNIQUE,
        permissions TEXT NOT NULL, -- JSON array
        rateLimit INTEGER DEFAULT 100,
        isActive INTEGER NOT NULL DEFAULT 1,
        lastUsed TEXT,
        expiresAt TEXT,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      );
      
      CREATE TABLE IF NOT EXISTS api_requests (
        id TEXT PRIMARY KEY,
        endpointId TEXT,
        apiKeyId TEXT,
        userId TEXT,
        method TEXT NOT NULL,
        path TEXT NOT NULL,
        statusCode INTEGER,
        responseTime INTEGER,
        ip TEXT,
        userAgent TEXT,
        requestBody TEXT,
        responseBody TEXT,
        error TEXT,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (endpointId) REFERENCES api_endpoints(id) ON DELETE SET NULL,
        FOREIGN KEY (apiKeyId) REFERENCES api_keys(id) ON DELETE SET NULL,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL
      );
      
      CREATE INDEX IF NOT EXISTS idx_api_requests_created_at ON api_requests(createdAt);
      CREATE INDEX IF NOT EXISTS idx_api_requests_endpoint_id ON api_requests(endpointId);
      CREATE INDEX IF NOT EXISTS idx_api_requests_api_key_id ON api_requests(apiKeyId);
    `);

    // Defensive: ensure api_keys.rateLimit exists (older DBs may not have it)
    try {
      const info = this.db.prepare("PRAGMA table_info('api_keys')").all();
      const hasRateLimit = info.some((c) => c.name === 'rateLimit');
      if (!hasRateLimit) {
        this.db.exec("ALTER TABLE api_keys ADD COLUMN rateLimit INTEGER DEFAULT 100");
      }
    } catch (e) {
      // ignore if pragma/alter fails
    }

    // Prepared statements
    this.insertEndpoint = this.db.prepare(`
      INSERT INTO api_endpoints (id, name, description, path, method, targetUrl, headers, timeout, rateLimit, createdBy, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    this.getEndpoint = this.db.prepare('SELECT * FROM api_endpoints WHERE path = ? AND method = ? AND isActive = 1');
    this.listEndpoints = this.db.prepare('SELECT * FROM api_endpoints WHERE isActive = 1 ORDER BY createdAt DESC');
    this.updateEndpoint = this.db.prepare(`
      UPDATE api_endpoints SET name = ?, description = ?, targetUrl = ?, headers = ?, timeout = ?, rateLimit = ?, updatedAt = ?
      WHERE id = ?
    `);
    this.deleteEndpoint = this.db.prepare('UPDATE api_endpoints SET isActive = 0, updatedAt = ? WHERE id = ?');

    this.insertApiKey = this.db.prepare(`
      INSERT INTO api_keys (id, userId, name, keyHash, permissions, rateLimit, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    this.getApiKey = this.db.prepare('SELECT * FROM api_keys WHERE keyHash = ? AND isActive = 1');
    this.updateApiKeyUsage = this.db.prepare('UPDATE api_keys SET lastUsed = ? WHERE id = ?');

    this.insertRequest = this.db.prepare(`
      INSERT INTO api_requests (id, endpointId, apiKeyId, userId, method, path, statusCode, responseTime, ip, userAgent, requestBody, responseBody, error, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
  }

  setupMiddleware() {
    // API key authentication
    this.router.use(async (req, res, next) => {
      const apiKey = req.headers['x-api-key'] || req.query.api_key;
      
      if (apiKey) {
        try {
          const keyData = this.getApiKey.get(apiKey);
          if (keyData) {
            req.apiKey = keyData;
            req.user = { id: keyData.userId }; // For compatibility
            this.updateApiKeyUsage.run(new Date().toISOString(), keyData.id);
          }
        } catch (error) {
          console.error('API key validation error:', error);
        }
      }
      
      next();
    });

    // Rate limiting
    this.router.use((req, res, next) => {
      const key = req.apiKey?.id || req.ip;
      const limit = req.apiKey?.rateLimit || this.config.maxRequestsPerMinute;
      
      // Simple in-memory rate limiting (in production, use Redis)
      if (!this.rateLimitMap) this.rateLimitMap = new Map();
      
      const now = Date.now();
      const window = Math.floor(now / 60000); // 1 minute window
      const keyWindow = `${key}:${window}`;
      
      const current = this.rateLimitMap.get(keyWindow) || 0;
      if (current >= limit) {
        return res.status(429).json({
          error: {
            code: 'rate_limited',
            message: 'Rate limit exceeded',
            retryAfter: 60
          }
        });
      }
      
      this.rateLimitMap.set(keyWindow, current + 1);
      next();
    });
  }

  setupRoutes() {
    // Create API endpoint
    this.router.post('/endpoints', this.authenticateUser, (req, res) => {
      const schema = z.object({
        name: z.string().min(1).max(100),
        description: z.string().optional(),
        path: z.string().min(1).max(200),
        method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
        targetUrl: z.string().url(),
        headers: z.record(z.string()).optional(),
        timeout: z.number().int().min(1000).max(300000).optional(),
        rateLimit: z.number().int().min(1).max(10000).optional()
      });

      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: {
            code: 'invalid_request',
            message: parsed.error.message
          }
        });
      }

      const { name, description, path, method, targetUrl, headers, timeout, rateLimit } = parsed.data;
      const id = nanoid();
      const now = new Date().toISOString();

      try {
        this.insertEndpoint.run(
          id, name, description || '', path, method, targetUrl,
          headers ? JSON.stringify(headers) : null,
          timeout || 30000, rateLimit || 100,
          req.user.id, now, now
        );

        res.status(201).json({
          id,
          name,
          path,
          method,
          targetUrl,
          status: 'created'
        });
      } catch (error) {
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
          return res.status(409).json({
            error: {
              code: 'endpoint_exists',
              message: 'An endpoint with this path and method already exists'
            }
          });
        }
        
        res.status(500).json({
          error: {
            code: 'creation_failed',
            message: 'Failed to create endpoint'
          }
        });
      }
    });

    // List API endpoints
    this.router.get('/endpoints', this.authenticateUser, (req, res) => {
      const endpoints = this.listEndpoints.all();
      const processed = endpoints.map(endpoint => ({
        ...endpoint,
        headers: endpoint.headers ? JSON.parse(endpoint.headers) : null
      }));
      res.json(processed);
    });

    // Update API endpoint
    this.router.put('/endpoints/:id', this.authenticateUser, (req, res) => {
      const schema = z.object({
        name: z.string().min(1).max(100).optional(),
        description: z.string().optional(),
        targetUrl: z.string().url().optional(),
        headers: z.record(z.string()).optional(),
        timeout: z.number().int().min(1000).max(300000).optional(),
        rateLimit: z.number().int().min(1).max(10000).optional()
      });

      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: {
            code: 'invalid_request',
            message: parsed.error.message
          }
        });
      }

      const { name, description, targetUrl, headers, timeout, rateLimit } = parsed.data;
      const now = new Date().toISOString();

      try {
        this.updateEndpoint.run(
          name, description || '', targetUrl, headers ? JSON.stringify(headers) : null,
          timeout || 30000, rateLimit || 100, now, req.params.id
        );

        res.json({ status: 'updated' });
      } catch (error) {
        res.status(500).json({
          error: {
            code: 'update_failed',
            message: 'Failed to update endpoint'
          }
        });
      }
    });

    // Delete API endpoint
    this.router.delete('/endpoints/:id', this.authenticateUser, (req, res) => {
      try {
        this.deleteEndpoint.run(new Date().toISOString(), req.params.id);
        res.json({ status: 'deleted' });
      } catch (error) {
        res.status(500).json({
          error: {
            code: 'delete_failed',
            message: 'Failed to delete endpoint'
          }
        });
      }
    });

    // Generate API key
    this.router.post('/keys', this.authenticateUser, (req, res) => {
      const schema = z.object({
        name: z.string().min(1).max(100),
        permissions: z.array(z.string()).optional(),
        rateLimit: z.number().int().min(1).max(10000).optional()
      });

      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: {
            code: 'invalid_request',
            message: parsed.error.message
          }
        });
      }

      const { name, permissions, rateLimit } = parsed.data;
      const id = nanoid();
      const apiKey = `zk_${nanoid(32)}`;
      const now = new Date().toISOString();

      try {
        this.insertApiKey.run(
          id, req.user.id, name, apiKey,
          permissions ? JSON.stringify(permissions) : JSON.stringify(['read']),
          rateLimit || 100, now
        );

        res.status(201).json({
          id,
          name,
          apiKey, // Only shown once
          permissions: permissions || ['read'],
          rateLimit: rateLimit || 100
        });
      } catch (error) {
        res.status(500).json({
          error: {
            code: 'creation_failed',
            message: 'Failed to create API key'
          }
        });
      }
    });

    // List API keys
    this.router.get('/keys', this.authenticateUser, (req, res) => {
      const keys = this.db.prepare('SELECT id, name, permissions, rateLimit, lastUsed, createdAt FROM api_keys WHERE userId = ? AND isActive = 1').all(req.user.id);
      const processed = keys.map(key => ({
        ...key,
        permissions: key.permissions ? JSON.parse(key.permissions) : []
      }));
      res.json(processed);
    });

    // API analytics
    this.router.get('/analytics', this.authenticateUser, (req, res) => {
      const { days = 7 } = req.query;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));

      const analytics = this.db.prepare(`
        SELECT 
          COUNT(*) as totalRequests,
          COUNT(CASE WHEN statusCode >= 200 AND statusCode < 300 THEN 1 END) as successfulRequests,
          COUNT(CASE WHEN statusCode >= 400 THEN 1 END) as failedRequests,
          AVG(responseTime) as avgResponseTime,
          COUNT(DISTINCT endpointId) as uniqueEndpoints,
          COUNT(DISTINCT apiKeyId) as uniqueApiKeys
        FROM api_requests 
        WHERE createdAt >= ?
      `).get(startDate.toISOString());

      const topEndpoints = this.db.prepare(`
        SELECT 
          e.name,
          e.path,
          COUNT(r.id) as requestCount,
          AVG(r.responseTime) as avgResponseTime
        FROM api_endpoints e
        LEFT JOIN api_requests r ON e.id = r.endpointId
        WHERE r.createdAt >= ?
        GROUP BY e.id
        ORDER BY requestCount DESC
        LIMIT 10
      `).all(startDate.toISOString());

      res.json({
        period: `${days} days`,
        summary: analytics,
        topEndpoints
      });
    });

    // Dynamic route handler for all API endpoints
    this.router.use(async (req, res, next) => {
      // Skip if this request matched a defined route
      // Since we are in a use() after declared routes, treat as catch-all
      try {
        const endpoint = this.getEndpoint.get(req.path, req.method);
        if (!endpoint) return next();

        const startTime = Date.now();
        let responseBody = '';
        let statusCode = 500;
        let error = null;

        try {
          const headers = endpoint.headers ? JSON.parse(endpoint.headers) : {};
          const requestHeaders = {
            'Content-Type': req.headers['content-type'] || 'application/json',
            ...headers
          };

          const response = await fetch(endpoint.targetUrl, {
            method: req.method,
            headers: requestHeaders,
            body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
            signal: AbortSignal.timeout(endpoint.timeout || 30000)
          });

          statusCode = response.status;
          responseBody = await response.text();

          for (const [key, value] of response.headers) {
            res.setHeader(key, value);
          }

          res.status(statusCode).send(responseBody);
        } catch (err) {
          error = err.message;
          res.status(500).json({
            error: { code: 'gateway_error', message: 'Failed to proxy request' }
          });
        } finally {
          const responseTime = Date.now() - startTime;
          this.insertRequest.run(
            nanoid(), endpoint.id, req.apiKey?.id || null, req.user?.id || null,
            req.method, req.path, statusCode, responseTime, req.ip,
            req.headers['user-agent']?.substring(0, 100),
            req.method !== 'GET' ? JSON.stringify(req.body) : null,
            responseBody.substring(0, 1000), error, new Date().toISOString()
          );
        }
      } catch (e) {
        return next(e);
      }
    });
  }

  authenticateUser(req, res, next) {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'unauthorized',
          message: 'Authentication required'
        }
      });
    }
    next();
  }

  getRouter() {
    return this.router;
  }
}

export default ApiGateway;