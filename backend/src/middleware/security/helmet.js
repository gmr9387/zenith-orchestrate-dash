import helmet from 'helmet';
import { logger } from '../../utils/logger.js';

export const createSecurityHeaders = (options = {}) => {
  const {
    enableCSP = true,
    enableHSTS = true,
    enableXSS = true,
    enableFrameOptions = true,
    enableContentType = true,
    enableReferrerPolicy = true,
    enablePermissionsPolicy = true,
  } = options;

  const helmetConfig = {};

  // Content Security Policy
  if (enableCSP) {
    helmetConfig.contentSecurityPolicy = {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        connectSrc: ["'self'", "https:", "wss:"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'", "https:", "blob:"],
        frameSrc: ["'none'"],
        workerSrc: ["'self'", "blob:"],
        formAction: ["'self'"],
        baseUri: ["'self'"],
        upgradeInsecureRequests: [],
      },
      reportOnly: false,
    };
  }

  // HTTP Strict Transport Security
  if (enableHSTS) {
    helmetConfig.hsts = {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    };
  }

  // XSS Protection
  if (enableXSS) {
    helmetConfig.xssFilter = true;
  }

  // Frame Options
  if (enableFrameOptions) {
    helmetConfig.frameguard = {
      action: 'deny',
    };
  }

  // Content Type Options
  if (enableContentType) {
    helmetConfig.noSniff = true;
  }

  // Referrer Policy
  if (enableReferrerPolicy) {
    helmetConfig.referrerPolicy = {
      policy: 'strict-origin-when-cross-origin',
    };
  }

  // Permissions Policy
  if (enablePermissionsPolicy) {
    helmetConfig.permissionsPolicy = {
      features: {
        camera: [],
        microphone: [],
        geolocation: [],
        payment: [],
        usb: [],
        magnetometer: [],
        gyroscope: [],
        accelerometer: [],
        ambientLightSensor: [],
        autoplay: [],
        encryptedMedia: [],
        fullscreen: [],
        pictureInPicture: [],
        syncXhr: [],
        midi: [],
        publickeyCredentialsGet: [],
        screenWakeLock: [],
        webShare: [],
        xrSpatialTracking: [],
      },
    };
  }

  // Additional security headers
  helmetConfig.crossOriginEmbedderPolicy = false; // Allow external resources
  helmetConfig.crossOriginOpenerPolicy = { policy: 'same-origin-allow-popups' };
  helmetConfig.crossOriginResourcePolicy = { policy: 'cross-origin' };

  try {
    return helmet(helmetConfig);
  } catch (error) {
    logger.error('Error configuring security headers:', error);
    // Fallback to basic helmet
    return helmet();
  }
};

export const createCORSConfig = (options = {}) => {
  const {
    origin = process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials = true,
    methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders = [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-API-Key',
      'X-CSRF-Token',
    ],
    exposedHeaders = ['X-Total-Count', 'X-Page-Count'],
    maxAge = 86400, // 24 hours
  } = options;

  return {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      const allowedOrigins = Array.isArray(origin) ? origin : [origin];
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn('CORS blocked request from origin:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials,
    methods,
    allowedHeaders,
    exposedHeaders,
    maxAge,
    optionsSuccessStatus: 200, // Some legacy browsers choke on 204
  };
};