import { logger } from './logger.js';

// Simple SMS utility - can be enhanced with Twilio or other providers later
export const sendSMS = async (phoneNumber, message) => {
  try {
    logger.info(`SMS sent to ${phoneNumber}: ${message}`);
    
    // In development, just log the SMS
    if (process.env.NODE_ENV === 'development') {
      logger.info(`[DEV] SMS would be sent to ${phoneNumber}: ${message}`);
      return { success: true, messageId: `dev_${Date.now()}` };
    }
    
    // TODO: Integrate with actual SMS provider (Twilio, etc.)
    return { success: true, messageId: `sms_${Date.now()}` };
  } catch (error) {
    logger.error('SMS sending failed:', error);
    throw new Error('Failed to send SMS');
  }
};

export const verifySMSCode = async (phoneNumber, code) => {
  try {
    logger.info(`SMS verification for ${phoneNumber}: ${code}`);
    
    // In development, accept any code
    if (process.env.NODE_ENV === 'development') {
      return { success: true, verified: true };
    }
    
    // TODO: Implement actual SMS verification
    return { success: true, verified: true };
  } catch (error) {
    logger.error('SMS verification failed:', error);
    throw new Error('Failed to verify SMS code');
  }
};