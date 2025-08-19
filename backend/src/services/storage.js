import AWS from 'aws-sdk';
import { Client as MinioClient } from 'minio';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, CopyObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { logger } from '../utils/logger.js';
import { ApiError } from '../middleware/errorHandler.js';
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';

class StorageService {
  constructor() {
    this.provider = process.env.STORAGE_PROVIDER || 's3';
    this.endpoint = process.env.STORAGE_ENDPOINT;
    this.bucket = process.env.STORAGE_BUCKET;
    this.region = process.env.STORAGE_REGION;
    this.accessKeyId = process.env.STORAGE_ACCESS_KEY_ID;
    this.secretAccessKey = process.env.STORAGE_SECRET_ACCESS_KEY;
    
    this.client = null;
    this.isInitialized = false;
    
    this.initialize();
  }

  async initialize() {
    try {
      switch (this.provider) {
        case 's3':
          await this.initializeS3();
          break;
        case 'minio':
          await this.initializeMinio();
          break;
        case 'digitalocean':
          await this.initializeDigitalOcean();
          break;
        case 'cloudflare':
          await this.initializeCloudflare();
          break;
        default:
          throw new Error(`Unsupported storage provider: ${this.provider}`);
      }
      
      this.isInitialized = true;
      logger.info(`Storage service initialized with provider: ${this.provider}`);
    } catch (error) {
      logger.error('Failed to initialize storage service:', error);
      throw error;
    }
  }

  async initializeS3() {
    if (this.provider === 's3') {
      // Use AWS SDK v3 for S3
      this.client = new S3Client({
        region: this.region,
        credentials: {
          accessKeyId: this.accessKeyId,
          secretAccessKey: this.secretAccessKey,
        },
      });
    } else {
      // Use AWS SDK v2 for S3-compatible services
      this.client = new AWS.S3({
        endpoint: this.endpoint,
        region: this.region,
        accessKeyId: this.accessKeyId,
        secretAccessKey: this.secretAccessKey,
        s3ForcePathStyle: true, // Required for S3-compatible services
        signatureVersion: 'v4',
      });
    }
  }

  async initializeMinio() {
    this.client = new MinioClient({
      endPoint: new URL(this.endpoint).hostname,
      port: new URL(this.endpoint).port || 443,
      useSSL: this.endpoint.startsWith('https'),
      accessKey: this.accessKeyId,
      secretKey: this.secretAccessKey,
      region: this.region,
    });
  }

  async initializeDigitalOcean() {
    // DigitalOcean Spaces uses S3-compatible API
    this.client = new AWS.S3({
      endpoint: this.endpoint,
      region: this.region,
      accessKeyId: this.accessKeyId,
      secretAccessKey: this.secretAccessKey,
      s3ForcePathStyle: false, // DigitalOcean uses subdomain style
      signatureVersion: 'v4',
    });
  }

  async initializeCloudflare() {
    // Cloudflare R2 uses S3-compatible API
    this.client = new S3Client({
      region: this.region,
      endpoint: this.endpoint,
      credentials: {
        accessKeyId: this.accessKeyId,
        secretAccessKey: this.secretAccessKey,
      },
      forcePathStyle: true,
    });
  }

  // Test connection to storage service
  async testConnection() {
    try {
      if (!this.isInitialized) {
        throw new Error('Storage service not initialized');
      }

      switch (this.provider) {
        case 's3':
          if (this.provider === 's3') {
            await this.client.send(new HeadObjectCommand({
              Bucket: this.bucket,
              Key: 'test-connection',
            }));
          } else {
            await this.client.headObject({
              Bucket: this.bucket,
              Key: 'test-connection',
            }).promise();
          }
          break;
        case 'minio':
          await this.client.statObject(this.bucket, 'test-connection');
          break;
        default:
          // For S3-compatible services
          await this.client.headObject({
            Bucket: this.bucket,
            Key: 'test-connection',
          }).promise();
      }

      return true;
    } catch (error) {
      if (error.name === 'NotFound' || error.code === 'NoSuchKey') {
        // Object doesn't exist, but connection is working
        return true;
      }
      throw error;
    }
  }

  // Generate presigned URL for upload
  async generatePresignedUrl(key, operation = 'putObject', expiresIn = 3600) {
    try {
      if (!this.isInitialized) {
        throw new Error('Storage service not initialized');
      }

      let presignedUrl;

      if (this.provider === 's3' && this.provider === 's3') {
        // AWS SDK v3
        const command = operation === 'putObject' 
          ? new PutObjectCommand({ Bucket: this.bucket, Key: key })
          : new GetObjectCommand({ Bucket: this.bucket, Key: key });
        
        presignedUrl = await getSignedUrl(this.client, command, { expiresIn });
      } else if (this.provider === 'minio') {
        // MinIO
        if (operation === 'putObject') {
          presignedUrl = await this.client.presignedPutObject(this.bucket, key, expiresIn);
        } else {
          presignedUrl = await this.client.presignedGetObject(this.bucket, key, expiresIn);
        }
      } else {
        // S3-compatible services using AWS SDK v2
        const params = {
          Bucket: this.bucket,
          Key: key,
          Expires: expiresIn,
        };

        if (operation === 'putObject') {
          presignedUrl = await this.client.getSignedUrl('putObject', params);
        } else {
          presignedUrl = await this.client.getSignedUrl('getObject', params);
        }
      }

      return presignedUrl;
    } catch (error) {
      logger.error('Failed to generate presigned URL:', error);
      throw new ApiError(500, 'Failed to generate presigned URL');
    }
  }

  // Upload file directly to storage
  async uploadFile(file, key, options = {}) {
    try {
      if (!this.isInitialized) {
        throw new Error('Storage service not initialized');
      }

      const {
        contentType,
        metadata = {},
        publicRead = false,
        processImage = false,
        processVideo = false,
      } = options;

      let uploadData = file;
      let finalKey = key;
      let finalContentType = contentType || file.mimetype;

      // Process image if requested
      if (processImage && file.mimetype.startsWith('image/')) {
        const processedImage = await this.processImage(file);
        uploadData = processedImage.buffer;
        finalKey = this.addSuffix(key, '_processed');
        finalContentType = processedImage.mimeType;
      }

      // Process video if requested
      if (processVideo && file.mimetype.startsWith('video/')) {
        const processedVideo = await this.processVideo(file);
        uploadData = processedVideo.buffer;
        finalKey = this.addSuffix(key, '_processed');
        finalContentType = processedVideo.mimeType;
      }

      const uploadParams = {
        Bucket: this.bucket,
        Key: finalKey,
        Body: uploadData,
        ContentType: finalContentType,
        Metadata: metadata,
      };

      if (publicRead) {
        uploadParams.ACL = 'public-read';
      }

      let result;

      if (this.provider === 's3' && this.provider === 's3') {
        // AWS SDK v3
        result = await this.client.send(new PutObjectCommand(uploadParams));
      } else if (this.provider === 'minio') {
        // MinIO
        result = await this.client.putObject(
          this.bucket,
          finalKey,
          uploadData,
          uploadData.length,
          { 'Content-Type': finalContentType, ...metadata }
        );
      } else {
        // S3-compatible services
        result = await this.client.upload(uploadParams).promise();
      }

      // Get file metadata
      const fileMetadata = await this.getFileMetadata(finalKey);

      logger.info('File uploaded successfully', {
        key: finalKey,
        size: file.size,
        contentType: finalContentType,
        bucket: this.bucket,
      });

      return {
        success: true,
        data: fileMetadata,
        message: 'File uploaded successfully',
      };
    } catch (error) {
      logger.error('File upload failed:', error);
      throw new ApiError(500, 'File upload failed');
    }
  }

  // Download file from storage
  async downloadFile(key) {
    try {
      if (!this.isInitialized) {
        throw new Error('Storage service not initialized');
      }

      let result;

      if (this.provider === 's3' && this.provider === 's3') {
        // AWS SDK v3
        result = await this.client.send(new GetObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }));
      } else if (this.provider === 'minio') {
        // MinIO
        result = await this.client.getObject(this.bucket, key);
      } else {
        // S3-compatible services
        result = await this.client.getObject({
          Bucket: this.bucket,
          Key: key,
        }).promise();
      }

      return result.Body;
    } catch (error) {
      logger.error('File download failed:', error);
      throw new ApiError(500, 'File download failed');
    }
  }

  // Delete file from storage
  async deleteFile(key) {
    try {
      if (!this.isInitialized) {
        throw new Error('Storage service not initialized');
      }

      if (this.provider === 's3' && this.provider === 's3') {
        // AWS SDK v3
        await this.client.send(new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }));
      } else if (this.provider === 'minio') {
        // MinIO
        await this.client.removeObject(this.bucket, key);
      } else {
        // S3-compatible services
        await this.client.deleteObject({
          Bucket: this.bucket,
          Key: key,
        }).promise();
      }

      logger.info('File deleted successfully', { key, bucket: this.bucket });

      return {
        success: true,
        data: true,
        message: 'File deleted successfully',
      };
    } catch (error) {
      logger.error('File deletion failed:', error);
      throw new ApiError(500, 'File deletion failed');
    }
  }

  // Copy file within storage
  async copyFile(sourceKey, destinationKey) {
    try {
      if (!this.isInitialized) {
        throw new Error('Storage service not initialized');
      }

      if (this.provider === 's3' && this.provider === 's3') {
        // AWS SDK v3
        await this.client.send(new CopyObjectCommand({
          Bucket: this.bucket,
          CopySource: `${this.bucket}/${sourceKey}`,
          Key: destinationKey,
        }));
      } else if (this.provider === 'minio') {
        // MinIO
        await this.client.copyObject(this.bucket, sourceKey, this.bucket, destinationKey);
      } else {
        // S3-compatible services
        await this.client.copyObject({
          Bucket: this.bucket,
          CopySource: `${this.bucket}/${sourceKey}`,
          Key: destinationKey,
        }).promise();
      }

      logger.info('File copied successfully', { sourceKey, destinationKey, bucket: this.bucket });

      return {
        success: true,
        data: { sourceKey, destinationKey },
        message: 'File copied successfully',
      };
    } catch (error) {
      logger.error('File copy failed:', error);
      throw new ApiError(500, 'File copy failed');
    }
  }

  // Move file (copy + delete)
  async moveFile(sourceKey, destinationKey) {
    try {
      // Copy file to new location
      await this.copyFile(sourceKey, destinationKey);
      
      // Delete original file
      await this.deleteFile(sourceKey);

      logger.info('File moved successfully', { sourceKey, destinationKey, bucket: this.bucket });

      return {
        success: true,
        data: { sourceKey, destinationKey },
        message: 'File moved successfully',
      };
    } catch (error) {
      logger.error('File move failed:', error);
      throw new ApiError(500, 'File move failed');
    }
  }

  // Get file metadata
  async getFileMetadata(key) {
    try {
      if (!this.isInitialized) {
        throw new Error('Storage service not initialized');
      }

      let result;

      if (this.provider === 's3' && this.provider === 's3') {
        // AWS SDK v3
        result = await this.client.send(new HeadObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }));
      } else if (this.provider === 'minio') {
        // MinIO
        result = await this.client.statObject(this.bucket, key);
      } else {
        // S3-compatible services
        result = await this.client.headObject({
          Bucket: this.bucket,
          Key: key,
        }).promise();
      }

      const metadata = {
        key,
        size: result.ContentLength || result.size,
        contentType: result.ContentType || result.metaData?.['content-type'],
        lastModified: result.LastModified || result.lastModified,
        etag: result.ETag || result.etag,
        metadata: result.Metadata || result.metaData,
        url: this.getFileUrl(key),
      };

      return metadata;
    } catch (error) {
      logger.error('Failed to get file metadata:', error);
      throw new ApiError(500, 'Failed to get file metadata');
    }
  }

  // List files in bucket
  async listFiles(prefix = '', maxKeys = 1000) {
    try {
      if (!this.isInitialized) {
        throw new Error('Storage service not initialized');
      }

      let result;

      if (this.provider === 'minio') {
        // MinIO
        const stream = this.client.listObjects(this.bucket, prefix, true);
        const objects = [];
        
        return new Promise((resolve, reject) => {
          stream.on('data', (obj) => {
            objects.push({
              key: obj.name,
              size: obj.size,
              lastModified: obj.lastModified,
              etag: obj.etag,
            });
          });
          
          stream.on('end', () => {
            resolve({
              success: true,
              data: { files: objects.slice(0, maxKeys) },
              message: 'Files listed successfully',
            });
          });
          
          stream.on('error', reject);
        });
      } else {
        // S3 and S3-compatible services
        const params = {
          Bucket: this.bucket,
          MaxKeys: maxKeys,
        };

        if (prefix) {
          params.Prefix = prefix;
        }

        if (this.provider === 's3' && this.provider === 's3') {
          // AWS SDK v3
          result = await this.client.send(new ListObjectsV2Command(params));
        } else {
          // AWS SDK v2
          result = await this.client.listObjectsV2(params).promise();
        }

        const files = result.Contents?.map(obj => ({
          key: obj.Key,
          size: obj.Size,
          lastModified: obj.LastModified,
          etag: obj.ETag,
        })) || [];

        return {
          success: true,
          data: { files },
          message: 'Files listed successfully',
        };
      }
    } catch (error) {
      logger.error('Failed to list files:', error);
      throw new ApiError(500, 'Failed to list files');
    }
  }

  // Get public URL for file
  getFileUrl(key) {
    if (this.provider === 'minio') {
      return `${this.endpoint}/${this.bucket}/${key}`;
    } else {
      return `${this.endpoint}/${this.bucket}/${key}`;
    }
  }

  // Process image (resize, compress, convert format)
  async processImage(file, options = {}) {
    try {
      const {
        width,
        height,
        quality = 80,
        format = 'webp',
        fit = 'inside',
      } = options;

      let imageProcessor = sharp(file.buffer);

      // Resize if dimensions provided
      if (width || height) {
        imageProcessor = imageProcessor.resize(width, height, { fit });
      }

      // Convert format and set quality
      if (format === 'webp') {
        imageProcessor = imageProcessor.webp({ quality });
      } else if (format === 'jpeg') {
        imageProcessor = imageProcessor.jpeg({ quality });
      } else if (format === 'png') {
        imageProcessor = imageProcessor.png({ quality });
      }

      const processedBuffer = await imageProcessor.toBuffer();
      const mimeType = `image/${format}`;

      return {
        buffer: processedBuffer,
        mimeType,
        size: processedBuffer.length,
      };
    } catch (error) {
      logger.error('Image processing failed:', error);
      throw new ApiError(500, 'Image processing failed');
    }
  }

  // Process video (compress, convert format)
  async processVideo(file, options = {}) {
    try {
      const {
        format = 'mp4',
        quality = 'medium',
        resolution = '720p',
      } = options;

      // This is a simplified video processing example
      // In production, you'd use a more robust video processing service
      const outputPath = `/tmp/processed_${Date.now()}.${format}`;
      
      return new Promise((resolve, reject) => {
        ffmpeg(file.buffer)
          .outputOptions([
            '-c:v', 'libx264',
            '-preset', quality,
            '-crf', '23',
            '-c:a', 'aac',
            '-b:a', '128k',
          ])
          .output(outputPath)
          .on('end', async () => {
            try {
              const processedBuffer = await fs.readFile(outputPath);
              await fs.unlink(outputPath); // Clean up temp file
              
              resolve({
                buffer: processedBuffer,
                mimeType: `video/${format}`,
                size: processedBuffer.length,
              });
            } catch (error) {
              reject(error);
            }
          })
          .on('error', reject)
          .run();
      });
    } catch (error) {
      logger.error('Video processing failed:', error);
      throw new ApiError(500, 'Video processing failed');
    }
  }

  // Add suffix to filename
  addSuffix(filename, suffix) {
    const ext = path.extname(filename);
    const name = path.basename(filename, ext);
    return `${name}${suffix}${ext}`;
  }

  // Generate unique filename
  generateUniqueFilename(originalName, prefix = '') {
    const ext = path.extname(originalName);
    const name = path.basename(originalName, ext);
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    
    return `${prefix}${name}_${timestamp}_${random}${ext}`;
  }

  // Check if service is ready
  isReady() {
    return this.isInitialized;
  }

  // Get service status
  getStatus() {
    return {
      provider: this.provider,
      endpoint: this.endpoint,
      bucket: this.bucket,
      region: this.region,
      isInitialized: this.isInitialized,
    };
  }
}

// Create singleton instance
const storageService = new StorageService();

export default storageService;