# 📱 SMS Integration Documentation

## Overview

Zilliance includes a comprehensive SMS integration system powered by Twilio, providing enterprise-grade messaging capabilities for verification, notifications, and bulk messaging.

## Features

- ✅ **SMS Verification**: 6-digit verification codes with Redis-based storage
- ✅ **Bulk Messaging**: Send SMS to multiple recipients simultaneously
- ✅ **Error Handling**: Graceful fallbacks and comprehensive error reporting
- ✅ **Security**: Rate limiting, validation, and audit logging
- ✅ **Development Mode**: Local testing without Twilio costs
- ✅ **Health Monitoring**: Service status and configuration checks

## Quick Start

### 1. Environment Configuration

Add these variables to your `.env` file:

```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890
SMS_VERIFICATION_EXPIRY=300

# Redis Configuration (for verification codes)
REDIS_URL=redis://localhost:6379
```

### 2. Get Twilio Credentials

1. Sign up at [Twilio Console](https://console.twilio.com/)
2. Get your Account SID and Auth Token
3. Purchase a phone number for sending SMS
4. Add credentials to your environment

### 3. Test the Integration

```bash
# Check SMS service status
curl http://localhost:3001/api/v1/sms/status

# Send verification code
curl -X POST http://localhost:3001/api/v1/sms/send-verification \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+1234567890"}'

# Verify code
curl -X POST http://localhost:3001/api/v1/sms/verify \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+1234567890", "code": "123456"}'
```

## API Reference

### SMS Service Status

**GET** `/api/v1/sms/status`

Returns the current SMS service configuration and status.

```json
{
  "success": true,
  "data": {
    "configured": true,
    "provider": "twilio",
    "environment": "production",
    "phoneNumber": "configured"
  }
}
```

### Send Verification Code

**POST** `/api/v1/sms/send-verification`

Sends a 6-digit verification code to the specified phone number.

**Request:**
```json
{
  "phoneNumber": "+1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "messageId": "SM1234567890abcdef",
    "expiresIn": 300
  },
  "message": "Verification code sent successfully"
}
```

### Verify Code

**POST** `/api/v1/sms/verify`

Verifies the 6-digit code sent to the phone number.

**Request:**
```json
{
  "phoneNumber": "+1234567890",
  "code": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "verified": true,
    "provider": "twilio"
  },
  "message": "Verification successful"
}
```

### Send SMS (Authenticated)

**POST** `/api/v1/sms/send`

Sends a custom SMS message (requires authentication).

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Request:**
```json
{
  "phoneNumber": "+1234567890",
  "message": "Your custom message here"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "messageId": "SM1234567890abcdef",
    "provider": "twilio",
    "status": "queued"
  },
  "message": "SMS sent successfully"
}
```

### Bulk SMS (Authenticated)

**POST** `/api/v1/sms/bulk-send`

Sends SMS to multiple recipients simultaneously.

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Request:**
```json
{
  "recipients": ["+1234567890", "+0987654321"],
  "message": "Bulk message to all recipients"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 2,
    "successful": 2,
    "failed": 0,
    "results": [
      {
        "phoneNumber": "+1234567890",
        "success": true,
        "messageId": "SM1234567890abcdef",
        "provider": "twilio"
      }
    ],
    "errors": []
  },
  "message": "Bulk SMS completed: 2 successful, 0 failed"
}
```

### Health Check

**GET** `/api/v1/sms/health`

Returns the health status of the SMS service.

```json
{
  "success": true,
  "data": {
    "service": "sms",
    "status": "healthy",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "configuration": {
      "configured": true,
      "provider": "twilio",
      "environment": "production"
    }
  }
}
```

## Development Mode

When `NODE_ENV=development` and Twilio is not configured, the system operates in development mode:

- SMS messages are logged instead of sent
- Verification codes are accepted without validation
- No Twilio costs incurred during development

### Development Testing

```javascript
// SMS will be logged, not sent
const result = await sendSMS('+1234567890', 'Test message');
// Result: { success: true, messageId: 'dev_1234567890', provider: 'development' }

// Any code will be accepted
const verified = await verifySMSCode('+1234567890', '123456');
// Result: { success: true, verified: true, provider: 'development' }
```

## Error Handling

### Common Error Responses

**Invalid Phone Number:**
```json
{
  "success": false,
  "errors": [
    {
      "type": "field",
      "value": "invalid-phone",
      "msg": "Valid phone number is required",
      "path": "phoneNumber",
      "location": "body"
    }
  ]
}
```

**Invalid Verification Code:**
```json
{
  "success": false,
  "error": "Verification failed"
}
```

**SMS Service Not Configured:**
```json
{
  "success": false,
  "error": "SMS service is not configured"
}
```

**Twilio API Error:**
```json
{
  "success": false,
  "error": "Twilio API error",
  "code": "21211"
}
```

### Error Codes

| Code | Description | Action |
|------|-------------|--------|
| 21211 | Invalid phone number | Check phone number format |
| 21214 | Invalid phone number | Verify country code |
| 21608 | Message too long | Shorten message to 1600 chars |
| 21610 | Invalid message body | Check message content |
| 21612 | Invalid from number | Verify Twilio phone number |

## Security Features

### Rate Limiting

- SMS sending is rate-limited to prevent abuse
- Verification code requests are limited per phone number
- Bulk SMS has additional rate limiting

### Validation

- Phone numbers validated using `express-validator`
- Message length limited to 1600 characters
- Verification codes must be exactly 6 digits

### Audit Logging

All SMS activities are logged with:
- Phone numbers (masked in production)
- Message IDs
- Success/failure status
- Timestamps
- User context (when authenticated)

## Production Deployment

### 1. Environment Setup

```env
NODE_ENV=production
TWILIO_ACCOUNT_SID=your_production_sid
TWILIO_AUTH_TOKEN=your_production_token
TWILIO_PHONE_NUMBER=+1234567890
SMS_VERIFICATION_EXPIRY=300
REDIS_URL=redis://your-redis-server:6379
```

### 2. Monitoring

Monitor these metrics:
- SMS delivery success rate
- Verification code usage
- API response times
- Error rates by type

### 3. Scaling Considerations

- Redis cluster for high availability
- Multiple Twilio phone numbers for load distribution
- Queue system for bulk SMS processing
- CDN for global SMS delivery optimization

## Troubleshooting

### SMS Not Sending

1. **Check Twilio Configuration:**
   ```bash
   curl http://localhost:3001/api/v1/sms/status
   ```

2. **Verify Phone Number:**
   - Must include country code (+1 for US)
   - No spaces or special characters

3. **Check Twilio Console:**
   - Verify account has sufficient credits
   - Check phone number is active
   - Review error logs

### Verification Codes Not Working

1. **Check Redis Connection:**
   ```bash
   redis-cli ping
   ```

2. **Verify Code Expiry:**
   - Default: 5 minutes (300 seconds)
   - Check `SMS_VERIFICATION_EXPIRY` setting

3. **Check Code Format:**
   - Must be exactly 6 digits
   - No spaces or special characters

### Performance Issues

1. **Redis Performance:**
   - Monitor Redis memory usage
   - Check connection pool settings
   - Consider Redis clustering

2. **Twilio Rate Limits:**
   - Standard accounts: 1 SMS/second
   - Premium accounts: Higher limits
   - Implement queuing for bulk SMS

## Testing

### Run SMS Tests

```bash
# Run all SMS tests
npm test -- sms.test.js

# Run specific test suite
npm test -- --testNamePattern="SMS Integration Tests"
```

### Manual Testing

```bash
# Start the server
npm run dev

# Test SMS endpoints
curl http://localhost:3001/api/v1/sms/status
curl -X POST http://localhost:3001/api/v1/sms/send-verification \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+1234567890"}'
```

## Support

For SMS integration support:

1. Check the [Twilio Documentation](https://www.twilio.com/docs)
2. Review server logs for detailed error messages
3. Test with development mode first
4. Contact support with error codes and logs

---

**Last Updated:** January 15, 2024  
**Version:** 1.0.0  
**Status:** ✅ Production Ready