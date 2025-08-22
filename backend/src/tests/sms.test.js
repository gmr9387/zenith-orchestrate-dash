import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../server.js';
import { 
  sendSMS, 
  sendVerificationCode, 
  verifySMSCode, 
  isSMSConfigured, 
  getSMSStatus 
} from '../utils/sms.js';

// Mock Redis client
jest.mock('../database/redis.js', () => ({
  redisClient: {
    setex: jest.fn(),
    get: jest.fn(),
    del: jest.fn()
  }
}));

// Mock Twilio
jest.mock('twilio', () => {
  return jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn()
    }
  }));
});

describe('SMS Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = 'test';
  });

  describe('SMS Utility Functions', () => {
    test('should send SMS in development mode', async () => {
      const result = await sendSMS('+1234567890', 'Test message');
      
      expect(result.success).toBe(true);
      expect(result.provider).toBe('development');
      expect(result.messageId).toMatch(/^dev_\d+$/);
    });

    test('should generate and send verification code', async () => {
      const { redisClient } = await import('../database/redis.js');
      redisClient.setex.mockResolvedValue('OK');
      
      const result = await sendVerificationCode('+1234567890');
      
      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
      expect(result.expiresIn).toBe(300);
      expect(redisClient.setex).toHaveBeenCalledWith(
        'sms_verification:+1234567890',
        300,
        expect.stringMatching(/^\d{6}$/)
      );
    });

    test('should verify SMS code successfully', async () => {
      const { redisClient } = await import('../database/redis.js');
      redisClient.get.mockResolvedValue('123456');
      redisClient.del.mockResolvedValue(1);
      
      const result = await verifySMSCode('+1234567890', '123456');
      
      expect(result.success).toBe(true);
      expect(result.verified).toBe(true);
      expect(redisClient.get).toHaveBeenCalledWith('sms_verification:+1234567890');
      expect(redisClient.del).toHaveBeenCalledWith('sms_verification:+1234567890');
    });

    test('should reject invalid verification code', async () => {
      const { redisClient } = await import('../database/redis.js');
      redisClient.get.mockResolvedValue('123456');
      
      const result = await verifySMSCode('+1234567890', '654321');
      
      expect(result.success).toBe(false);
      expect(result.verified).toBe(false);
      expect(result.error).toBe('Invalid verification code');
    });

    test('should handle expired verification code', async () => {
      const { redisClient } = await import('../database/redis.js');
      redisClient.get.mockResolvedValue(null);
      
      const result = await verifySMSCode('+1234567890', '123456');
      
      expect(result.success).toBe(false);
      expect(result.verified).toBe(false);
      expect(result.error).toBe('Verification code expired or not found');
    });

    test('should check SMS configuration status', () => {
      const status = getSMSStatus();
      
      expect(status).toHaveProperty('configured');
      expect(status).toHaveProperty('provider');
      expect(status).toHaveProperty('environment');
      expect(status).toHaveProperty('phoneNumber');
    });
  });

  describe('SMS API Endpoints', () => {
    test('GET /api/v1/sms/status should return SMS service status', async () => {
      const response = await request(app)
        .get('/api/v1/sms/status')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('configured');
      expect(response.body.data).toHaveProperty('provider');
    });

    test('POST /api/v1/sms/send-verification should send verification code', async () => {
      const { redisClient } = await import('../database/redis.js');
      redisClient.setex.mockResolvedValue('OK');

      const response = await request(app)
        .post('/api/v1/sms/send-verification')
        .send({ phoneNumber: '+1234567890' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('messageId');
      expect(response.body.data).toHaveProperty('expiresIn');
    });

    test('POST /api/v1/sms/send-verification should validate phone number', async () => {
      const response = await request(app)
        .post('/api/v1/sms/send-verification')
        .send({ phoneNumber: 'invalid-phone' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    test('POST /api/v1/sms/verify should verify code successfully', async () => {
      const { redisClient } = await import('../database/redis.js');
      redisClient.get.mockResolvedValue('123456');
      redisClient.del.mockResolvedValue(1);

      const response = await request(app)
        .post('/api/v1/sms/verify')
        .send({ 
          phoneNumber: '+1234567890', 
          code: '123456' 
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.verified).toBe(true);
    });

    test('POST /api/v1/sms/verify should reject invalid code', async () => {
      const { redisClient } = await import('../database/redis.js');
      redisClient.get.mockResolvedValue('123456');

      const response = await request(app)
        .post('/api/v1/sms/verify')
        .send({ 
          phoneNumber: '+1234567890', 
          code: '654321' 
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Verification failed');
    });

    test('POST /api/v1/sms/verify should validate code format', async () => {
      const response = await request(app)
        .post('/api/v1/sms/verify')
        .send({ 
          phoneNumber: '+1234567890', 
          code: '123' 
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    test('GET /api/v1/sms/health should return health status', async () => {
      const response = await request(app)
        .get('/api/v1/sms/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('service', 'sms');
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data).toHaveProperty('timestamp');
    });
  });

  describe('SMS Error Handling', () => {
    test('should handle Redis connection errors gracefully', async () => {
      const { redisClient } = await import('../database/redis.js');
      redisClient.setex.mockRejectedValue(new Error('Redis connection failed'));

      const result = await sendVerificationCode('+1234567890');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to send verification code');
    });

    test('should handle Twilio API errors', async () => {
      process.env.NODE_ENV = 'production';
      process.env.TWILIO_ACCOUNT_SID = 'test_sid';
      process.env.TWILIO_AUTH_TOKEN = 'test_token';
      process.env.TWILIO_PHONE_NUMBER = '+1234567890';

      const twilio = await import('twilio');
      const mockTwilioClient = twilio.default();
      mockTwilioClient.messages.create.mockRejectedValue(new Error('Twilio API error'));

      const result = await sendSMS('+1234567890', 'Test message');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Twilio API error');
    });
  });

  describe('SMS Security', () => {
    test('should rate limit SMS sending', async () => {
      // This would be tested with actual rate limiting middleware
      const response = await request(app)
        .post('/api/v1/sms/send-verification')
        .send({ phoneNumber: '+1234567890' });

      expect(response.status).toBeLessThan(500);
    });

    test('should validate phone number format', async () => {
      const invalidNumbers = [
        '123',
        'abc',
        '+123',
        '12345678901234567890'
      ];

      for (const phoneNumber of invalidNumbers) {
        const response = await request(app)
          .post('/api/v1/sms/send-verification')
          .send({ phoneNumber });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      }
    });

    test('should validate message length', async () => {
      const longMessage = 'A'.repeat(1601);
      
      const response = await request(app)
        .post('/api/v1/sms/send')
        .set('Authorization', 'Bearer mock_token')
        .send({ 
          phoneNumber: '+1234567890', 
          message: longMessage 
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});