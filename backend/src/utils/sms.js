import { logger } from './logger.js';
import twilio from 'twilio';
import { redisClient } from '../database/redis.js';

// Initialize Twilio client
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN 
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;
const SMS_VERIFICATION_EXPIRY = parseInt(process.env.SMS_VERIFICATION_EXPIRY) || 300; // 5 minutes default

/**
 * Send SMS using Twilio or fallback to development mode
 * @param {string} phoneNumber - Recipient phone number
 * @param {string} message - SMS message content
 * @returns {Promise<Object>} - SMS sending result
 */
export const sendSMS = async (phoneNumber, message) => {
  try {
    logger.info(`Attempting to send SMS to ${phoneNumber}: ${message}`);
    
    // Development mode - just log the SMS
    if (process.env.NODE_ENV === 'development' && !twilioClient) {
      logger.info(`[DEV] SMS would be sent to ${phoneNumber}: ${message}`);
      return { 
        success: true, 
        messageId: `dev_${Date.now()}`,
        provider: 'development'
      };
    }
    
    // Production mode with Twilio
    if (twilioClient && TWILIO_PHONE_NUMBER) {
      const result = await twilioClient.messages.create({
        body: message,
        from: TWILIO_PHONE_NUMBER,
        to: phoneNumber
      });
      
      logger.info(`SMS sent successfully via Twilio`, { 
        messageId: result.sid, 
        phoneNumber,
        status: result.status 
      });
      
      return { 
        success: true, 
        messageId: result.sid,
        provider: 'twilio',
        status: result.status
      };
    }
    
    // Fallback for missing Twilio configuration
    logger.warn('Twilio not configured, falling back to development mode');
    return { 
      success: true, 
      messageId: `fallback_${Date.now()}`,
      provider: 'fallback'
    };
    
  } catch (error) {
    logger.error('SMS sending failed:', error);
    
    // Return error details for debugging
    return {
      success: false,
      error: error.message,
      code: error.code,
      provider: twilioClient ? 'twilio' : 'fallback'
    };
  }
};

/**
 * Generate and send verification code via SMS
 * @param {string} phoneNumber - Recipient phone number
 * @returns {Promise<Object>} - Verification code sending result
 */
export const sendVerificationCode = async (phoneNumber) => {
  try {
    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store verification code in Redis with expiry
    const redisKey = `sms_verification:${phoneNumber}`;
    await redisClient.setex(redisKey, SMS_VERIFICATION_EXPIRY, verificationCode);
    
    // Create SMS message
    const message = `Your Zilliance verification code is: ${verificationCode}. Valid for ${SMS_VERIFICATION_EXPIRY / 60} minutes.`;
    
    // Send SMS
    const smsResult = await sendSMS(phoneNumber, message);
    
    if (smsResult.success) {
      logger.info(`Verification code sent successfully to ${phoneNumber}`);
      return {
        success: true,
        messageId: smsResult.messageId,
        expiresIn: SMS_VERIFICATION_EXPIRY
      };
    } else {
      // Clean up stored code if SMS failed
      await redisClient.del(redisKey);
      throw new Error(`SMS sending failed: ${smsResult.error}`);
    }
    
  } catch (error) {
    logger.error('Verification code sending failed:', error);
    throw new Error('Failed to send verification code');
  }
};

/**
 * Verify SMS code against stored code in Redis
 * @param {string} phoneNumber - Phone number to verify
 * @param {string} code - Verification code to check
 * @returns {Promise<Object>} - Verification result
 */
export const verifySMSCode = async (phoneNumber, code) => {
  try {
    logger.info(`Verifying SMS code for ${phoneNumber}: ${code}`);
    
    // Development mode - accept any code
    if (process.env.NODE_ENV === 'development' && !twilioClient) {
      logger.info(`[DEV] SMS verification accepted for ${phoneNumber}: ${code}`);
      return { 
        success: true, 
        verified: true,
        provider: 'development'
      };
    }
    
    // Production mode - verify against stored code
    const redisKey = `sms_verification:${phoneNumber}`;
    const storedCode = await redisClient.get(redisKey);
    
    if (!storedCode) {
      logger.warn(`No verification code found for ${phoneNumber}`);
      return { 
        success: false, 
        verified: false,
        error: 'Verification code expired or not found'
      };
    }
    
    if (storedCode === code) {
      // Code is valid - remove it from Redis
      await redisClient.del(redisKey);
      
      logger.info(`SMS verification successful for ${phoneNumber}`);
      return { 
        success: true, 
        verified: true,
        provider: 'twilio'
      };
    } else {
      logger.warn(`Invalid verification code for ${phoneNumber}`);
      return { 
        success: false, 
        verified: false,
        error: 'Invalid verification code'
      };
    }
    
  } catch (error) {
    logger.error('SMS verification failed:', error);
    return {
      success: false,
      verified: false,
      error: error.message
    };
  }
};

/**
 * Check if SMS service is properly configured
 * @returns {boolean} - Configuration status
 */
export const isSMSConfigured = () => {
  return !!(twilioClient && TWILIO_PHONE_NUMBER);
};

/**
 * Get SMS service status and configuration info
 * @returns {Object} - Service status information
 */
export const getSMSStatus = () => {
  return {
    configured: isSMSConfigured(),
    provider: twilioClient ? 'twilio' : 'development',
    environment: process.env.NODE_ENV,
    phoneNumber: TWILIO_PHONE_NUMBER ? 'configured' : 'not configured'
  };
};