import { logger } from '../../utils/logger.js';

class AuditLogger {
  constructor(redisClient) {
    this.redisClient = redisClient;
    this.auditPrefix = 'audit:';
  }

  // Log security events with structured data
  logSecurityEvent(event, details = {}) {
    const auditEntry = {
      timestamp: new Date().toISOString(),
      event,
      details,
      severity: this.getEventSeverity(event),
      sessionId: details.sessionId,
      correlationId: details.correlationId,
    };

    // Log to structured logger
    logger.info('SECURITY_AUDIT', auditEntry);

    // Store in Redis for compliance (if available)
    this.storeAuditEntry(auditEntry);

    return auditEntry;
  }

  // Log authentication events
  logAuthEvent(event, user, details = {}) {
    return this.logSecurityEvent(event, {
      ...details,
      userId: user?.id,
      email: user?.email,
      role: user?.role,
      ipAddress: details.ipAddress,
      userAgent: details.userAgent,
      success: details.success,
      failureReason: details.failureReason,
    });
  }

  // Log authorization events
  logAuthorizationEvent(event, user, resource, details = {}) {
    return this.logSecurityEvent(event, {
      ...details,
      userId: user?.id,
      email: user?.email,
      role: user?.role,
      resource,
      action: details.action,
      granted: details.granted,
      reason: details.reason,
    });
  }

  // Log data access events
  logDataAccessEvent(event, user, dataType, details = {}) {
    return this.logSecurityEvent(event, {
      ...details,
      userId: user?.id,
      email: user?.email,
      role: user?.role,
      dataType,
      recordId: details.recordId,
      operation: details.operation,
      fields: details.fields,
      ipAddress: details.ipAddress,
    });
  }

  // Log system configuration changes
  logConfigChangeEvent(event, user, config, details = {}) {
    return this.logSecurityEvent(event, {
      ...details,
      userId: user?.id,
      email: user?.email,
      role: user?.role,
      configKey: config.key,
      oldValue: config.oldValue,
      newValue: config.newValue,
      reason: details.reason,
    });
  }

  // Store audit entry in Redis for compliance
  async storeAuditEntry(auditEntry) {
    if (!this.redisClient) return;

    try {
      const key = `${this.auditPrefix}${Date.now()}:${auditEntry.event}`;
      const ttl = 365 * 24 * 60 * 60; // 1 year retention
      
      await this.redisClient.setEx(key, ttl, JSON.stringify(auditEntry));
    } catch (error) {
      logger.error('Failed to store audit entry in Redis', { error: error.message });
    }
  }

  // Get event severity for alerting
  getEventSeverity(event) {
    const severityMap = {
      // Critical security events
      'user.login.failed': 'high',
      'user.login.success': 'low',
      'user.logout': 'low',
      'user.password.change': 'medium',
      'user.password.reset': 'medium',
      'user.role.change': 'high',
      'user.permission.grant': 'high',
      'user.permission.revoke': 'high',
      'user.account.lock': 'high',
      'user.account.unlock': 'medium',
      
      // Data access events
      'data.read': 'low',
      'data.create': 'medium',
      'data.update': 'medium',
      'data.delete': 'high',
      'data.export': 'medium',
      'data.import': 'medium',
      
      // System events
      'system.config.change': 'high',
      'system.backup': 'low',
      'system.restore': 'high',
      'system.maintenance': 'low',
      
      // API events
      'api.rate_limit.exceeded': 'medium',
      'api.authentication.failed': 'medium',
      'api.authorization.failed': 'high',
      'api.validation.failed': 'low',
      
      // Default
      'default': 'low',
    };

    return severityMap[event] || severityMap.default;
  }

  // Generate correlation ID for request tracing
  generateCorrelationId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Extract relevant details from request
  extractRequestDetails(req) {
    return {
      ipAddress: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('User-Agent'),
      method: req.method,
      url: req.originalUrl,
      headers: this.sanitizeHeaders(req.headers),
      body: this.sanitizeBody(req.body),
      query: req.query,
      params: req.params,
    };
  }

  // Sanitize headers to remove sensitive information
  sanitizeHeaders(headers) {
    const sanitized = { ...headers };
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-csrf-token'];
    
    sensitiveHeaders.forEach(header => {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  // Sanitize request body to remove sensitive information
  sanitizeBody(body) {
    if (!body) return body;
    
    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'credential'];
    
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }
}

// Create audit logger instance
let auditLoggerInstance = null;

export const createAuditLogger = (redisClient) => {
  if (!auditLoggerInstance) {
    auditLoggerInstance = new AuditLogger(redisClient);
  }
  return auditLoggerInstance;
};

export const getAuditLogger = () => auditLoggerInstance;

// Middleware to add correlation ID and audit context
export const auditMiddleware = (req, res, next) => {
  const auditLogger = getAuditLogger();
  if (!auditLogger) return next();

  // Generate correlation ID for request tracing
  req.correlationId = auditLogger.generateCorrelationId();
  res.setHeader('X-Correlation-ID', req.correlationId);

  // Add audit context to request
  req.auditContext = {
    correlationId: req.correlationId,
    timestamp: new Date().toISOString(),
    requestDetails: auditLogger.extractRequestDetails(req),
  };

  // Log request start
  auditLogger.logSecurityEvent('request.start', {
    correlationId: req.correlationId,
    ...req.auditContext.requestDetails,
  });

  next();
};

// Middleware to log request completion
export const auditResponseMiddleware = (req, res, next) => {
  const auditLogger = getAuditLogger();
  if (!auditLogger) return next();

  // Log response completion
  res.on('finish', () => {
    auditLogger.logSecurityEvent('request.complete', {
      correlationId: req.correlationId,
      statusCode: res.statusCode,
      responseTime: Date.now() - new Date(req.auditContext.timestamp).getTime(),
      ...req.auditContext.requestDetails,
    });
  });

  next();
};