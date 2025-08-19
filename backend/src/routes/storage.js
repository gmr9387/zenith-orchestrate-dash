import express from 'express';
import multer from 'multer';
import path from 'path';
import { body, query, validationResult } from 'express-validator';
import storageService from '../services/storage.js';
import { authenticateToken, requirePermission } from '../middleware/auth.js';
import { asyncHandler, ApiError, validationErrorHandler } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 100 * 1024 * 1024, // 100MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'image/*,video/*,audio/*,application/pdf,text/*').split(',');
    const isAllowed = allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        return file.mimetype.startsWith(type.slice(0, -2));
      }
      return file.mimetype === type;
    });

    if (isAllowed) {
      cb(null, true);
    } else {
      cb(new ApiError(400, `File type ${file.mimetype} is not allowed`));
    }
  },
});

// Validation rules
const fileUploadValidation = [
  body('folder')
    .optional()
    .isString()
    .withMessage('Folder must be a string')
    .trim(),
  body('publicRead')
    .optional()
    .isBoolean()
    .withMessage('publicRead must be a boolean'),
  body('processImage')
    .optional()
    .isBoolean()
    .withMessage('processImage must be a boolean'),
  body('processVideo')
    .optional()
    .isBoolean()
    .withMessage('processVideo must be a boolean'),
];

const presignedUrlValidation = [
  body('key')
    .isString()
    .withMessage('File key is required')
    .trim(),
  body('operation')
    .isIn(['getObject', 'putObject'])
    .withMessage('Operation must be getObject or putObject'),
  body('expiresIn')
    .optional()
    .isInt({ min: 60, max: 86400 })
    .withMessage('Expires in must be between 60 and 86400 seconds'),
];

// @route   POST /api/v1/storage/upload
// @desc    Upload file to storage
// @access  Private
router.post('/upload', 
  authenticateToken, 
  requirePermission('write:tutorials'),
  upload.single('file'),
  fileUploadValidation,
  asyncHandler(async (req, res) => {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw validationErrorHandler(errors.array());
    }

    if (!req.file) {
      throw new ApiError(400, 'No file provided');
    }

    const { folder = '', publicRead = false, processImage = false, processVideo = false } = req.body;
    
    // Generate unique filename
    const uniqueFilename = storageService.generateUniqueFilename(req.file.originalname);
    const key = folder ? `${folder}/${uniqueFilename}` : uniqueFilename;

    // Upload file to storage
    const result = await storageService.uploadFile(req.file, key, {
      contentType: req.file.mimetype,
      metadata: {
        originalName: req.file.originalname,
        uploadedBy: req.user._id.toString(),
        uploadedAt: new Date().toISOString(),
        size: req.file.size,
      },
      publicRead,
      processImage,
      processVideo,
    });

    // Update user storage usage
    // await updateUserStorageUsage(req.user._id, result.data.size);

    logger.info('File uploaded successfully', {
      userId: req.user._id,
      email: req.user.email,
      key,
      size: req.file.size,
      contentType: req.file.mimetype,
    });

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        ...result.data,
        originalName: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype,
      },
    });
  })
);

// @route   POST /api/v1/storage/presigned-url
// @desc    Generate presigned URL for file upload/download
// @access  Private
router.post('/presigned-url',
  authenticateToken,
  requirePermission('write:tutorials'),
  presignedUrlValidation,
  asyncHandler(async (req, res) => {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw validationErrorHandler(errors.array());
    }

    const { key, operation, expiresIn = 3600 } = req.body;

    // Generate presigned URL
    const presignedUrl = await storageService.generatePresignedUrl(key, operation, expiresIn);

    logger.info('Presigned URL generated', {
      userId: req.user._id,
      email: req.user.email,
      key,
      operation,
      expiresIn,
    });

    res.json({
      success: true,
      message: 'Presigned URL generated successfully',
      data: {
        url: presignedUrl,
        key,
        operation,
        expiresIn,
        expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
      },
    });
  })
);

// @route   GET /api/v1/storage/files
// @desc    List files in storage
// @access  Private
router.get('/files',
  authenticateToken,
  requirePermission('read:tutorials'),
  [
    query('prefix')
      .optional()
      .isString()
      .withMessage('Prefix must be a string'),
    query('maxKeys')
      .optional()
      .isInt({ min: 1, max: 1000 })
      .withMessage('MaxKeys must be between 1 and 1000'),
  ],
  asyncHandler(async (req, res) => {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw validationErrorHandler(errors.array());
    }

    const { prefix = '', maxKeys = 100 } = req.query;

    // List files
    const result = await storageService.listFiles(prefix, maxKeys);

    logger.info('Files listed successfully', {
      userId: req.user._id,
      email: req.user.email,
      prefix,
      maxKeys,
      fileCount: result.data.files.length,
    });

    res.json(result);
  })
);

// @route   GET /api/v1/storage/files/:key
// @desc    Get file metadata
// @access  Private
router.get('/files/:key',
  authenticateToken,
  requirePermission('read:tutorials'),
  asyncHandler(async (req, res) => {
    const { key } = req.params;

    // Get file metadata
    const metadata = await storageService.getFileMetadata(key);

    logger.info('File metadata retrieved', {
      userId: req.user._id,
      email: req.user.email,
      key,
    });

    res.json({
      success: true,
      data: metadata,
      message: 'File metadata retrieved successfully',
    });
  })
);

// @route   GET /api/v1/storage/files/:key/download
// @desc    Download file from storage
// @access  Private
router.get('/files/:key/download',
  authenticateToken,
  requirePermission('read:tutorials'),
  asyncHandler(async (req, res) => {
    const { key } = req.params;

    // Get file metadata first
    const metadata = await storageService.getFileMetadata(key);

    // Download file
    const fileStream = await storageService.downloadFile(key);

    // Set response headers
    res.set({
      'Content-Type': metadata.contentType || 'application/octet-stream',
      'Content-Length': metadata.size,
      'Content-Disposition': `attachment; filename="${path.basename(key)}"`,
      'Cache-Control': 'no-cache',
    });

    logger.info('File downloaded', {
      userId: req.user._id,
      email: req.user.email,
      key,
      size: metadata.size,
    });

    // Pipe file stream to response
    fileStream.pipe(res);
  })
);

// @route   DELETE /api/v1/storage/files/:key
// @desc    Delete file from storage
// @access  Private
router.delete('/files/:key',
  authenticateToken,
  requirePermission('delete:tutorials'),
  asyncHandler(async (req, res) => {
    const { key } = req.params;

    // Delete file
    const result = await storageService.deleteFile(key);

    logger.info('File deleted', {
      userId: req.user._id,
      email: req.user.email,
      key,
    });

    res.json(result);
  })
);

// @route   POST /api/v1/storage/copy
// @desc    Copy file within storage
// @access  Private
router.post('/copy',
  authenticateToken,
  requirePermission('write:tutorials'),
  [
    body('sourceKey')
      .isString()
      .withMessage('Source key is required')
      .trim(),
    body('destinationKey')
      .isString()
      .withMessage('Destination key is required')
      .trim(),
  ],
  asyncHandler(async (req, res) => {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw validationErrorHandler(errors.array());
    }

    const { sourceKey, destinationKey } = req.body;

    // Copy file
    const result = await storageService.copyFile(sourceKey, destinationKey);

    logger.info('File copied', {
      userId: req.user._id,
      email: req.user.email,
      sourceKey,
      destinationKey,
    });

    res.json(result);
  })
);

// @route   POST /api/v1/storage/move
// @desc    Move file within storage
// @access  Private
router.post('/move',
  authenticateToken,
  requirePermission('write:tutorials'),
  [
    body('sourceKey')
      .isString()
      .withMessage('Source key is required')
      .trim(),
    body('destinationKey')
      .isString()
      .withMessage('Destination key is required')
      .trim(),
  ],
  asyncHandler(async (req, res) => {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw validationErrorHandler(errors.array());
    }

    const { sourceKey, destinationKey } = req.body;

    // Move file
    const result = await storageService.moveFile(sourceKey, destinationKey);

    logger.info('File moved', {
      userId: req.user._id,
      email: req.user.email,
      sourceKey,
      destinationKey,
    });

    res.json(result);
  })
);

// @route   POST /api/v1/storage/process
// @desc    Process file (resize image, compress video, etc.)
// @access  Private
router.post('/process',
  authenticateToken,
  requirePermission('write:tutorials'),
  upload.single('file'),
  [
    body('operation')
      .isIn(['resize', 'compress', 'convert', 'thumbnail'])
      .withMessage('Invalid operation'),
    body('options')
      .optional()
      .isObject()
      .withMessage('Options must be an object'),
  ],
  asyncHandler(async (req, res) => {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw validationErrorHandler(errors.array());
    }

    if (!req.file) {
      throw new ApiError(400, 'No file provided');
    }

    const { operation, options = {} } = req.body;

    let processedFile;

    if (operation === 'resize' || operation === 'thumbnail') {
      // Process image
      processedFile = await storageService.processImage(req.file, options);
    } else if (operation === 'compress') {
      if (req.file.mimetype.startsWith('image/')) {
        processedFile = await storageService.processImage(req.file, options);
      } else if (req.file.mimetype.startsWith('video/')) {
        processedFile = await storageService.processVideo(req.file, options);
      } else {
        throw new ApiError(400, 'File type not supported for compression');
      }
    } else if (operation === 'convert') {
      if (req.file.mimetype.startsWith('image/')) {
        processedFile = await storageService.processImage(req.file, options);
      } else if (req.file.mimetype.startsWith('video/')) {
        processedFile = await storageService.processVideo(req.file, options);
      } else {
        throw new ApiError(400, 'File type not supported for conversion');
      }
    }

    // Generate unique filename for processed file
    const uniqueFilename = storageService.generateUniqueFilename(
      req.file.originalname,
      `${operation}_`
    );
    const key = `processed/${uniqueFilename}`;

    // Upload processed file
    const uploadResult = await storageService.uploadFile(
      { ...req.file, buffer: processedFile.buffer, mimetype: processedFile.mimeType },
      key,
      {
        contentType: processedFile.mimeType,
        metadata: {
          originalName: req.file.originalname,
          processedBy: req.user._id.toString(),
          processedAt: new Date().toISOString(),
          operation,
          options,
          originalSize: req.file.size,
          processedSize: processedFile.size,
        },
      }
    );

    logger.info('File processed successfully', {
      userId: req.user._id,
      email: req.user.email,
      originalFile: req.file.originalname,
      processedFile: key,
      operation,
      originalSize: req.file.size,
      processedSize: processedFile.size,
    });

    res.json({
      success: true,
      message: 'File processed successfully',
      data: {
        ...uploadResult.data,
        originalFile: {
          name: req.file.originalname,
          size: req.file.size,
          mimeType: req.file.mimetype,
        },
        processedFile: {
          name: uniqueFilename,
          size: processedFile.size,
          mimeType: processedFile.mimeType,
        },
        operation,
        options,
      },
    });
  })
);

// @route   GET /api/v1/storage/status
// @desc    Get storage service status
// @access  Private
router.get('/status',
  authenticateToken,
  requirePermission('read:tutorials'),
  asyncHandler(async (req, res) => {
    const status = storageService.getStatus();
    
    // Test connection if service is initialized
    let connectionStatus = 'unknown';
    if (status.isInitialized) {
      try {
        await storageService.testConnection();
        connectionStatus = 'connected';
      } catch (error) {
        connectionStatus = 'error';
        logger.error('Storage connection test failed:', error);
      }
    }

    res.json({
      success: true,
      data: {
        ...status,
        connectionStatus,
        timestamp: new Date().toISOString(),
      },
      message: 'Storage status retrieved successfully',
    });
  })
);

// @route   POST /api/v1/storage/test-connection
// @desc    Test storage service connection
// @access  Private
router.post('/test-connection',
  authenticateToken,
  requirePermission('read:tutorials'),
  asyncHandler(async (req, res) => {
    try {
      await storageService.testConnection();
      
      res.json({
        success: true,
        message: 'Storage connection test successful',
        data: {
          status: 'connected',
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('Storage connection test failed:', error);
      
      res.status(500).json({
        success: false,
        message: 'Storage connection test failed',
        error: error.message,
        data: {
          status: 'error',
          timestamp: new Date().toISOString(),
        },
      });
    }
  })
);

// @route   GET /api/v1/storage/usage
// @desc    Get storage usage statistics
// @access  Private
router.get('/usage',
  authenticateToken,
  requirePermission('read:tutorials'),
  asyncHandler(async (req, res) => {
    // Get user's storage usage
    const userUsage = req.user.usage || {};
    
    // Get total storage usage for the bucket
    const files = await storageService.listFiles('', 10000);
    const totalUsage = files.data.files.reduce((total, file) => total + file.size, 0);
    
    // Get file type breakdown
    const fileTypeBreakdown = files.data.files.reduce((breakdown, file) => {
      const extension = path.extname(file.key).toLowerCase();
      const type = getFileType(extension);
      breakdown[type] = (breakdown[type] || 0) + file.size;
      return breakdown;
    }, {});

    res.json({
      success: true,
      data: {
        userUsage: {
          storageUsed: userUsage.storageUsed || 0,
          tutorialsCreated: userUsage.tutorialsCreated || 0,
          apiCalls: userUsage.apiCalls || 0,
          lastReset: userUsage.lastReset,
        },
        bucketUsage: {
          totalFiles: files.data.files.length,
          totalSize: totalUsage,
          fileTypeBreakdown,
        },
        limits: {
          maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 100 * 1024 * 1024,
          allowedFileTypes: (process.env.ALLOWED_FILE_TYPES || 'image/*,video/*,audio/*,application/pdf,text/*').split(','),
        },
      },
      message: 'Storage usage retrieved successfully',
    });
  })
);

// Helper function to get file type from extension
function getFileType(extension) {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
  const videoExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm'];
  const audioExtensions = ['.mp3', '.wav', '.flac', '.aac', '.ogg'];
  const documentExtensions = ['.pdf', '.doc', '.docx', '.txt', '.md'];
  
  if (imageExtensions.includes(extension)) return 'images';
  if (videoExtensions.includes(extension)) return 'videos';
  if (audioExtensions.includes(extension)) return 'audio';
  if (documentExtensions.includes(extension)) return 'documents';
  
  return 'other';
}

export default router;