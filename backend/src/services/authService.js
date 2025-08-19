import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { logger } from '../utils/logger.js';
import { ApiError } from '../middleware/errorHandler.js';

class AuthService {
  constructor(redisClient) {
    this.redisClient = redisClient;
    this.jwtSecret = process.env.JWT_SECRET;
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '15m';
    this.jwtRefreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
    this.jwtIssuer = process.env.JWT_ISSUER || 'zilliance-api';
    
    if (!this.jwtSecret) {
      throw new Error('JWT_SECRET environment variable is required');
    }
  }

  // Generate JWT access token
  generateAccessToken(user) {
    const payload = {
      id: user._id,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      type: 'access',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (parseInt(this.jwtExpiresIn) * 60),
    };

    return jwt.sign(payload, this.jwtSecret, {
      issuer: this.jwtIssuer,
      audience: 'zilliance-users',
    });
  }

  // Generate JWT refresh token
  generateRefreshToken(user) {
    const payload = {
      id: user._id,
      type: 'refresh',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (parseInt(this.jwtRefreshExpiresIn) * 24 * 60 * 60),
    };

    return jwt.sign(payload, this.jwtSecret, {
      issuer: this.jwtIssuer,
      audience: 'zilliance-users',
    });
  }

  // Verify JWT token
  verifyToken(token, type = 'access') {
    try {
      const decoded = jwt.verify(token, this.jwtSecret, {
        issuer: this.jwtIssuer,
        audience: 'zilliance-users',
      });

      if (decoded.type !== type) {
        throw new Error('Invalid token type');
      }

      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new ApiError(401, 'Token expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new ApiError(401, 'Invalid token');
      } else {
        throw new ApiError(401, 'Token verification failed');
      }
    }
  }

  // Store refresh token in Redis allowlist
  async storeRefreshToken(userId, refreshToken) {
    if (!this.redisClient) {
      logger.warn('Redis not available, skipping refresh token storage');
      return;
    }

    try {
      const key = `refresh_token:${userId}`;
      const ttl = parseInt(this.jwtRefreshExpiresIn) * 24 * 60 * 60; // Convert days to seconds
      
      await this.redisClient.setEx(key, ttl, refreshToken);
      logger.debug('Refresh token stored in Redis', { userId, ttl });
    } catch (error) {
      logger.error('Failed to store refresh token in Redis', { userId, error: error.message });
      throw new ApiError(500, 'Failed to store refresh token');
    }
  }

  // Verify refresh token is in allowlist
  async verifyRefreshToken(userId, refreshToken) {
    if (!this.redisClient) {
      logger.warn('Redis not available, skipping refresh token verification');
      return true;
    }

    try {
      const key = `refresh_token:${userId}`;
      const storedToken = await this.redisClient.get(key);
      
      if (!storedToken) {
        logger.warn('Refresh token not found in Redis', { userId });
        return false;
      }

      if (storedToken !== refreshToken) {
        logger.warn('Refresh token mismatch in Redis', { userId });
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Failed to verify refresh token in Redis', { userId, error: error.message });
      return false;
    }
  }

  // Rotate refresh token (invalidate old, store new)
  async rotateRefreshToken(userId, oldRefreshToken, newRefreshToken) {
    if (!this.redisClient) {
      logger.warn('Redis not available, skipping refresh token rotation');
      return;
    }

    try {
      const key = `refresh_token:${userId}`;
      
      // Verify old token first
      const isValid = await this.verifyRefreshToken(userId, oldRefreshToken);
      if (!isValid) {
        throw new ApiError(401, 'Invalid refresh token');
      }

      // Store new token
      await this.storeRefreshToken(userId, newRefreshToken);
      
      logger.info('Refresh token rotated successfully', { userId });
    } catch (error) {
      logger.error('Failed to rotate refresh token', { userId, error: error.message });
      throw error;
    }
  }

  // Revoke refresh token
  async revokeRefreshToken(userId) {
    if (!this.redisClient) {
      logger.warn('Redis not available, skipping refresh token revocation');
      return;
    }

    try {
      const key = `refresh_token:${userId}`;
      await this.redisClient.del(key);
      logger.info('Refresh token revoked successfully', { userId });
    } catch (error) {
      logger.error('Failed to revoke refresh token', { userId, error: error.message });
      // Don't throw error for revocation failure
    }
  }

  // Revoke all refresh tokens for a user (password change, etc.)
  async revokeAllRefreshTokens(userId) {
    if (!this.redisClient) {
      logger.warn('Redis not available, skipping refresh token revocation');
      return;
    }

    try {
      const pattern = `refresh_token:${userId}`;
      const keys = await this.redisClient.keys(pattern);
      
      if (keys.length > 0) {
        await this.redisClient.del(keys);
        logger.info('All refresh tokens revoked successfully', { userId, count: keys.length });
      }
    } catch (error) {
      logger.error('Failed to revoke all refresh tokens', { userId, error: error.message });
      // Don't throw error for revocation failure
    }
  }

  // Hash password with configurable salt rounds
  async hashPassword(password, saltRounds = 12) {
    try {
      const salt = await bcrypt.genSalt(saltRounds);
      return await bcrypt.hash(password, salt);
    } catch (error) {
      logger.error('Password hashing failed', { error: error.message });
      throw new ApiError(500, 'Password processing failed');
    }
  }

  // Compare password with hash
  async comparePassword(password, hash) {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      logger.error('Password comparison failed', { error: error.message });
      throw new ApiError(500, 'Password verification failed');
    }
  }

  // Generate secure random token
  generateSecureToken(length = 32) {
    try {
      return crypto.randomBytes(length).toString('hex');
    } catch (error) {
      logger.error('Token generation failed', { error: error.message });
      throw new ApiError(500, 'Token generation failed');
    }
  }

  // Hash token for storage (email verification, password reset)
  hashToken(token) {
    try {
      return crypto.createHash('sha256').update(token).digest('hex');
    } catch (error) {
      logger.error('Token hashing failed', { error: error.message });
      throw new ApiError(500, 'Token processing failed');
    }
  }

  // Validate password strength
  validatePasswordStrength(password) {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[@$!%*?&]/.test(password),
    };

    const score = Object.values(checks).filter(Boolean).length;
    const feedback = [];

    if (!checks.length) feedback.push('At least 8 characters');
    if (!checks.uppercase) feedback.push('One uppercase letter');
    if (!checks.lowercase) feedback.push('One lowercase letter');
    if (!checks.number) feedback.push('One number');
    if (!checks.special) feedback.push('One special character (@$!%*?&)');

    return {
      isValid: score >= 4,
      score,
      feedback,
      checks,
    };
  }

  // Get user permissions
  getUserPermissions(user) {
    if (!user || !user.permissions) {
      return [];
    }
    return user.permissions;
  }

  // Check if user has specific permission
  hasPermission(user, permission) {
    if (!user) return false;
    
    // Admin users have all permissions
    if (user.role === 'admin') return true;
    
    const permissions = this.getUserPermissions(user);
    return permissions.includes(permission);
  }

  // Check if user has any of the given permissions
  hasAnyPermission(user, permissions) {
    if (!user) return false;
    
    // Admin users have all permissions
    if (user.role === 'admin') return true;
    
    const userPermissions = this.getUserPermissions(user);
    return permissions.some(permission => userPermissions.includes(permission));
  }

  // Check if user has all of the given permissions
  hasAllPermissions(user, permissions) {
    if (!user) return false;
    
    // Admin users have all permissions
    if (user.role === 'admin') return true;
    
    const userPermissions = this.getUserPermissions(user);
    return permissions.every(permission => userPermissions.includes(permission));
  }
}

export default AuthService;