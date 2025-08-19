import express from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { asyncHandler, ApiError, validationErrorHandler } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';
import { sendEmail } from '../utils/email.js';
import { sendSMS } from '../utils/sms.js';

const router = express.Router();

// Validation rules
const registerValidation = [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('role')
    .optional()
    .isIn(['user', 'admin', 'enterprise'])
    .withMessage('Invalid role specified'),
];

const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

const passwordResetValidation = [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),
];

const passwordUpdateValidation = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
];

// @route   POST /api/v1/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', registerValidation, asyncHandler(async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw validationErrorHandler(errors.array());
  }

  const { email, password, firstName, lastName, role = 'user' } = req.body;

  // Check if user already exists
  const existingUser = await User.findByEmail(email);
  if (existingUser) {
    throw new ApiError(409, 'User with this email already exists');
  }

  // Create new user
  const user = new User({
    email,
    password,
    firstName,
    lastName,
    role,
  });

  // Generate email verification token
  const verificationToken = user.generateEmailVerificationToken();
  await user.save();

  // Send verification email
  try {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}`;
    
    await sendEmail({
      to: user.email,
      subject: 'Welcome to Zilliance - Verify Your Email',
      template: 'email-verification',
      context: {
        firstName: user.firstName,
        verificationUrl,
        supportEmail: process.env.SUPPORT_EMAIL || 'support@zilliance.com',
      },
    });

    logger.info('Verification email sent successfully', { userId: user._id, email: user.email });
  } catch (error) {
    logger.error('Failed to send verification email:', error);
    // Don't fail registration if email fails
  }

  // Generate tokens
  const accessToken = user.generateAuthToken();
  const refreshToken = user.generateRefreshToken();

  // Store refresh token in Redis (in production)
  // await redisClient.setex(`refresh_token:${user._id}`, 7 * 24 * 60 * 60, refreshToken);

  res.status(201).json({
    success: true,
    message: 'User registered successfully. Please check your email to verify your account.',
    data: {
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: process.env.JWT_EXPIRES_IN || '15m',
      },
    },
  });
}));

// @route   POST /api/v1/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', loginValidation, asyncHandler(async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw validationErrorHandler(errors.array());
  }

  const { email, password } = req.body;

  // Find user and include password for comparison
  const user = await User.findByEmail(email).select('+password');
  
  if (!user) {
    throw new ApiError(401, 'Invalid credentials');
  }

  // Check if user is active
  if (!user.isActive) {
    throw new ApiError(401, 'Account is deactivated. Please contact support.');
  }

  // Check if user is locked
  if (user.isLocked) {
    throw new ApiError(423, 'Account is temporarily locked due to multiple failed login attempts. Please try again later.');
  }

  // Verify password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    // Increment failed login attempts
    await user.incLoginAttempts();
    
    logger.warn('Failed login attempt', {
      userId: user._id,
      email: user.email,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    throw new ApiError(401, 'Invalid credentials');
  }

  // Reset login attempts on successful login
  await user.resetLoginAttempts();

  // Generate tokens
  const accessToken = user.generateAuthToken();
  const refreshToken = user.generateRefreshToken();

  // Store refresh token in Redis (in production)
  // await redisClient.setex(`refresh_token:${user._id}`, 7 * 24 * 60 * 60, refreshToken);

  // Log successful login
  logger.info('User logged in successfully', {
    userId: user._id,
    email: user.email,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        permissions: user.permissions,
        isEmailVerified: user.isEmailVerified,
        profile: user.profile,
        preferences: user.preferences,
        subscription: user.subscription,
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: process.env.JWT_EXPIRES_IN || '15m',
      },
    },
  });
}));

// @route   POST /api/v1/auth/refresh
// @desc    Refresh access token
// @access  Public
router.post('/refresh', asyncHandler(async (req, res) => {
  const { refresh_token } = req.body;

  if (!refresh_token) {
    throw new ApiError(400, 'Refresh token is required');
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(refresh_token, process.env.JWT_SECRET, {
      issuer: process.env.JWT_ISSUER || 'zilliance-api',
    });

    if (decoded.type !== 'refresh') {
      throw new ApiError(400, 'Invalid token type');
    }

    // Find user
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive || user.isLocked) {
      throw new ApiError(401, 'User not found or inactive');
    }

    // Generate new tokens
    const accessToken = user.generateAuthToken();
    const newRefreshToken = user.generateRefreshToken();

    // Store new refresh token in Redis (in production)
    // await redisClient.setex(`refresh_token:${user._id}`, 7 * 24 * 60 * 60, newRefreshToken);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn: process.env.JWT_EXPIRES_IN || '15m',
      },
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new ApiError(401, 'Refresh token expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new ApiError(401, 'Invalid refresh token');
    } else {
      throw error;
    }
  }
}));

// @route   POST /api/v1/auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post('/forgot-password', passwordResetValidation, asyncHandler(async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw validationErrorHandler(errors.array());
  }

  const { email } = req.body;

  // Find user
  const user = await User.findByEmail(email);
  if (!user) {
    // Don't reveal if user exists or not for security
    return res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.',
    });
  }

  // Generate password reset token
  const resetToken = user.generatePasswordResetToken();
  await user.save();

  // Send password reset email
  try {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    
    await sendEmail({
      to: user.email,
      subject: 'Zilliance - Password Reset Request',
      template: 'password-reset',
      context: {
        firstName: user.firstName,
        resetUrl,
        expiryTime: '10 minutes',
        supportEmail: process.env.SUPPORT_EMAIL || 'support@zilliance.com',
      },
    });

    logger.info('Password reset email sent successfully', { userId: user._id, email: user.email });
  } catch (error) {
    logger.error('Failed to send password reset email:', error);
    throw new ApiError(500, 'Failed to send password reset email');
  }

  res.json({
    success: true,
    message: 'If an account with that email exists, a password reset link has been sent.',
  });
}));

// @route   POST /api/v1/auth/reset-password
// @desc    Reset password with token
// @access  Public
router.post('/reset-password', passwordUpdateValidation, asyncHandler(async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw validationErrorHandler(errors.array());
  }

  const { token, password } = req.body;

  // Hash the token to compare with stored hash
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  // Find user with valid reset token
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw new ApiError(400, 'Invalid or expired reset token');
  }

  // Update password and clear reset token
  user.password = password;
  user.clearPasswordResetToken();
  await user.save();

  // Send confirmation email
  try {
    await sendEmail({
      to: user.email,
      subject: 'Zilliance - Password Changed Successfully',
      template: 'password-changed',
      context: {
        firstName: user.firstName,
        supportEmail: process.env.SUPPORT_EMAIL || 'support@zilliance.com',
      },
    });
  } catch (error) {
    logger.error('Failed to send password change confirmation email:', error);
    // Don't fail the operation if email fails
  }

  logger.info('Password reset successfully', { userId: user._id, email: user.email });

  res.json({
    success: true,
    message: 'Password has been reset successfully',
  });
}));

// @route   POST /api/v1/auth/verify-email
// @desc    Verify email address
// @access  Public
router.post('/verify-email', asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    throw new ApiError(400, 'Verification token is required');
  }

  // Hash the token to compare with stored hash
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  // Find user with valid verification token
  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw new ApiError(400, 'Invalid or expired verification token');
  }

  // Mark email as verified and clear token
  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();

  logger.info('Email verified successfully', { userId: user._id, email: user.email });

  res.json({
    success: true,
    message: 'Email verified successfully',
  });
}));

// @route   POST /api/v1/auth/resend-verification
// @desc    Resend email verification
// @access  Public
router.post('/resend-verification', passwordResetValidation, asyncHandler(async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw validationErrorHandler(errors.array());
  }

  const { email } = req.body;

  // Find user
  const user = await User.findByEmail(email);
  if (!user) {
    // Don't reveal if user exists or not for security
    return res.json({
      success: true,
      message: 'If an account with that email exists, a verification link has been sent.',
    });
  }

  if (user.isEmailVerified) {
    throw new ApiError(400, 'Email is already verified');
  }

  // Generate new verification token
  const verificationToken = user.generateEmailVerificationToken();
  await user.save();

  // Send verification email
  try {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}`;
    
    await sendEmail({
      to: user.email,
      subject: 'Zilliance - Verify Your Email',
      template: 'email-verification',
      context: {
        firstName: user.firstName,
        verificationUrl,
        supportEmail: process.env.SUPPORT_EMAIL || 'support@zilliance.com',
      },
    });

    logger.info('Verification email resent successfully', { userId: user._id, email: user.email });
  } catch (error) {
    logger.error('Failed to resend verification email:', error);
    throw new ApiError(500, 'Failed to send verification email');
  }

  res.json({
    success: true,
    message: 'If an account with that email exists, a verification link has been sent.',
  });
}));

// @route   POST /api/v1/auth/logout
// @desc    Logout user (invalidate refresh token)
// @access  Private
router.post('/logout', authenticateToken, asyncHandler(async (req, res) => {
  // In production, you would invalidate the refresh token in Redis
  // await redisClient.del(`refresh_token:${req.user._id}`);

  logger.info('User logged out', {
    userId: req.user._id,
    email: req.user.email,
    ip: req.ip,
  });

  res.json({
    success: true,
    message: 'Logged out successfully',
  });
}));

// @route   GET /api/v1/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', authenticateToken, asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      user: {
        id: req.user._id,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        role: req.user.role,
        permissions: req.user.permissions,
        isEmailVerified: req.user.isEmailVerified,
        profile: req.user.profile,
        preferences: req.user.preferences,
        subscription: req.user.subscription,
        usage: req.user.usage,
        createdAt: req.user.createdAt,
        updatedAt: req.user.updatedAt,
      },
    },
  });
}));

// @route   POST /api/v1/auth/change-password
// @desc    Change user password
// @access  Private
router.post('/change-password', authenticateToken, [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
], asyncHandler(async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw validationErrorHandler(errors.array());
  }

  const { currentPassword, newPassword } = req.body;

  // Get user with password for comparison
  const user = await User.findById(req.user._id).select('+password');

  // Verify current password
  const isCurrentPasswordValid = await user.comparePassword(currentPassword);
  if (!isCurrentPasswordValid) {
    throw new ApiError(400, 'Current password is incorrect');
  }

  // Update password
  user.password = newPassword;
  await user.save();

  // Send confirmation email
  try {
    await sendEmail({
      to: user.email,
      subject: 'Zilliance - Password Changed Successfully',
      template: 'password-changed',
      context: {
        firstName: user.firstName,
        supportEmail: process.env.SUPPORT_EMAIL || 'support@zilliance.com',
      },
    });
  } catch (error) {
    logger.error('Failed to send password change confirmation email:', error);
    // Don't fail the operation if email fails
  }

  logger.info('Password changed successfully', { userId: user._id, email: user.email });

  res.json({
    success: true,
    message: 'Password changed successfully',
  });
}));

// @route   POST /api/v1/auth/2fa/enable
// @desc    Enable two-factor authentication
// @access  Private
router.post('/2fa/enable', authenticateToken, asyncHandler(async (req, res) => {
  // This would integrate with a 2FA service like Google Authenticator
  // For now, we'll return a placeholder response
  
  res.json({
    success: true,
    message: 'Two-factor authentication setup initiated',
    data: {
      // QR code and setup instructions would go here
      setupRequired: true,
    },
  });
}));

export default router;