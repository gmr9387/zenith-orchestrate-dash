import express from 'express';
import { body, validationResult } from 'express-validator';
import { 
  sendSMS, 
  sendVerificationCode, 
  verifySMSCode, 
  isSMSConfigured, 
  getSMSStatus 
} from '../utils/sms.js';
import { logger } from '../utils/logger.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   GET /api/sms/status
 * @desc    Get SMS service status and configuration
 * @access  Public
 */
router.get('/status', async (req, res) => {
  try {
    const status = getSMSStatus();
    
    res.json({
      success: true,
      data: status,
      message: 'SMS service status retrieved successfully'
    });
  } catch (error) {
    logger.error('Error getting SMS status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get SMS service status'
    });
  }
});

/**
 * @route   POST /api/sms/send
 * @desc    Send SMS message
 * @access  Private (requires authentication)
 */
router.post('/send', [
  authenticateToken,
  body('phoneNumber')
    .isMobilePhone()
    .withMessage('Valid phone number is required'),
  body('message')
    .isLength({ min: 1, max: 1600 })
    .withMessage('Message must be between 1 and 1600 characters')
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { phoneNumber, message } = req.body;
    
    // Check if SMS is configured
    if (!isSMSConfigured() && process.env.NODE_ENV === 'production') {
      return res.status(503).json({
        success: false,
        error: 'SMS service is not configured'
      });
    }

    const result = await sendSMS(phoneNumber, message);
    
    if (result.success) {
      res.json({
        success: true,
        data: {
          messageId: result.messageId,
          provider: result.provider,
          status: result.status
        },
        message: 'SMS sent successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to send SMS'
      });
    }
    
  } catch (error) {
    logger.error('Error sending SMS:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route   POST /api/sms/send-verification
 * @desc    Send verification code via SMS
 * @access  Public
 */
router.post('/send-verification', [
  body('phoneNumber')
    .isMobilePhone()
    .withMessage('Valid phone number is required')
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { phoneNumber } = req.body;
    
    // Check if SMS is configured
    if (!isSMSConfigured() && process.env.NODE_ENV === 'production') {
      return res.status(503).json({
        success: false,
        error: 'SMS service is not configured'
      });
    }

    const result = await sendVerificationCode(phoneNumber);
    
    if (result.success) {
      res.json({
        success: true,
        data: {
          messageId: result.messageId,
          expiresIn: result.expiresIn
        },
        message: 'Verification code sent successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to send verification code'
      });
    }
    
  } catch (error) {
    logger.error('Error sending verification code:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route   POST /api/sms/verify
 * @desc    Verify SMS code
 * @access  Public
 */
router.post('/verify', [
  body('phoneNumber')
    .isMobilePhone()
    .withMessage('Valid phone number is required'),
  body('code')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('Verification code must be 6 digits')
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { phoneNumber, code } = req.body;
    
    const result = await verifySMSCode(phoneNumber, code);
    
    if (result.success && result.verified) {
      res.json({
        success: true,
        data: {
          verified: true,
          provider: result.provider
        },
        message: 'Verification successful'
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error || 'Verification failed'
      });
    }
    
  } catch (error) {
    logger.error('Error verifying SMS code:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route   POST /api/sms/bulk-send
 * @desc    Send SMS to multiple recipients
 * @access  Private (requires authentication)
 */
router.post('/bulk-send', [
  authenticateToken,
  body('recipients')
    .isArray({ min: 1, max: 100 })
    .withMessage('Recipients must be an array with 1-100 phone numbers'),
  body('recipients.*')
    .isMobilePhone()
    .withMessage('All recipients must have valid phone numbers'),
  body('message')
    .isLength({ min: 1, max: 1600 })
    .withMessage('Message must be between 1 and 1600 characters')
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { recipients, message } = req.body;
    
    // Check if SMS is configured
    if (!isSMSConfigured() && process.env.NODE_ENV === 'production') {
      return res.status(503).json({
        success: false,
        error: 'SMS service is not configured'
      });
    }

    const results = [];
    const errors = [];

    // Send SMS to each recipient
    for (const phoneNumber of recipients) {
      try {
        const result = await sendSMS(phoneNumber, message);
        results.push({
          phoneNumber,
          success: result.success,
          messageId: result.messageId,
          provider: result.provider
        });
      } catch (error) {
        errors.push({
          phoneNumber,
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = errors.length;

    res.json({
      success: true,
      data: {
        total: recipients.length,
        successful: successCount,
        failed: failureCount,
        results,
        errors
      },
      message: `Bulk SMS completed: ${successCount} successful, ${failureCount} failed`
    });
    
  } catch (error) {
    logger.error('Error sending bulk SMS:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route   GET /api/sms/health
 * @desc    Health check for SMS service
 * @access  Public
 */
router.get('/health', async (req, res) => {
  try {
    const status = getSMSStatus();
    const health = {
      service: 'sms',
      status: status.configured ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      configuration: status
    };

    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    logger.error('SMS health check failed:', error);
    res.status(503).json({
      success: false,
      error: 'SMS service unhealthy'
    });
  }
});

export default router;