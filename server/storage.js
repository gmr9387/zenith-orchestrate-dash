import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'fs';
import path from 'path';
import { nanoid } from 'nanoid';
import crypto from 'crypto';

class StorageManager {
  constructor(config) {
    this.config = {
      endpoint: config.endpoint || 'https://s3.amazonaws.com',
      region: config.region || 'us-east-1',
      bucket: config.bucket,
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
      forcePathStyle: config.forcePathStyle || false,
      ...config
    };

    this.client = new S3Client({
      endpoint: this.config.endpoint,
      region: this.config.region,
      credentials: {
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey,
      },
      forcePathStyle: this.config.forcePathStyle,
    });

    this.bucket = this.config.bucket;
  }

  // Generate a unique file key
  generateKey(prefix = '', extension = '') {
    const timestamp = Date.now();
    const randomId = nanoid(8);
    const key = `${prefix}/${timestamp}-${randomId}${extension}`;
    return key.replace(/^\/+/, ''); // Remove leading slashes
  }

  // Upload file from buffer or stream
  async uploadFile(key, data, metadata = {}) {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: data,
        ContentType: metadata.contentType || 'application/octet-stream',
        Metadata: {
          ...metadata,
          uploadedAt: new Date().toISOString(),
          checksum: this.calculateChecksum(data)
        }
      });

      const result = await this.client.send(command);
      
      return {
        key,
        etag: result.ETag?.replace(/"/g, ''),
        size: data.length || data.byteLength,
        url: this.getPublicUrl(key)
      };
    } catch (error) {
      console.error('Upload failed:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  // Upload file from local path
  async uploadFileFromPath(localPath, key, metadata = {}) {
    try {
      const fileStream = fs.createReadStream(localPath);
      const stats = fs.statSync(localPath);
      
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: fileStream,
        ContentType: metadata.contentType || this.getContentType(localPath),
        ContentLength: stats.size,
        Metadata: {
          ...metadata,
          originalName: path.basename(localPath),
          uploadedAt: new Date().toISOString(),
          checksum: this.calculateFileChecksum(localPath)
        }
      });

      const result = await this.client.send(command);
      
      return {
        key,
        etag: result.ETag?.replace(/"/g, ''),
        size: stats.size,
        url: this.getPublicUrl(key)
      };
    } catch (error) {
      console.error('Upload from path failed:', error);
      throw new Error(`Failed to upload file from path: ${error.message}`);
    }
  }

  // Download file
  async downloadFile(key, localPath = null) {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key
      });

      const result = await this.client.send(command);
      
      if (localPath) {
        const fileStream = fs.createWriteStream(localPath);
        result.Body.pipe(fileStream);
        
        return new Promise((resolve, reject) => {
          fileStream.on('finish', () => resolve({ key, localPath, size: result.ContentLength }));
          fileStream.on('error', reject);
        });
      }
      
      return {
        key,
        data: result.Body,
        contentType: result.ContentType,
        size: result.ContentLength,
        metadata: result.Metadata
      };
    } catch (error) {
      console.error('Download failed:', error);
      throw new Error(`Failed to download file: ${error.message}`);
    }
  }

  // Delete file
  async deleteFile(key) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key
      });

      await this.client.send(command);
      return { key, deleted: true };
    } catch (error) {
      console.error('Delete failed:', error);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  // Check if file exists
  async fileExists(key) {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key
      });

      await this.client.send(command);
      return true;
    } catch (error) {
      if (error.name === 'NotFound') {
        return false;
      }
      throw error;
    }
  }

  // Get file metadata
  async getFileMetadata(key) {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key
      });

      const result = await this.client.send(command);
      
      return {
        key,
        size: result.ContentLength,
        contentType: result.ContentType,
        etag: result.ETag?.replace(/"/g, ''),
        lastModified: result.LastModified,
        metadata: result.Metadata
      };
    } catch (error) {
      console.error('Get metadata failed:', error);
      throw new Error(`Failed to get file metadata: ${error.message}`);
    }
  }

  // Generate presigned URL for upload
  async generateUploadUrl(key, contentType, expiresIn = 3600) {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: contentType
      });

      const url = await getSignedUrl(this.client, command, { expiresIn });
      return { key, url, expiresIn };
    } catch (error) {
      console.error('Generate upload URL failed:', error);
      throw new Error(`Failed to generate upload URL: ${error.message}`);
    }
  }

  // Generate presigned URL for download
  async generateDownloadUrl(key, expiresIn = 3600) {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key
      });

      const url = await getSignedUrl(this.client, command, { expiresIn });
      return { key, url, expiresIn };
    } catch (error) {
      console.error('Generate download URL failed:', error);
      throw new Error(`Failed to generate download URL: ${error.message}`);
    }
  }

  // Get public URL (if bucket is public)
  getPublicUrl(key) {
    if (this.config.endpoint.includes('amazonaws.com')) {
      return `https://${this.bucket}.s3.${this.config.region}.amazonaws.com/${key}`;
    } else {
      return `${this.config.endpoint}/${this.bucket}/${key}`;
    }
  }

  // Calculate checksum for buffer
  calculateChecksum(data) {
    return crypto.createHash('md5').update(data).digest('hex');
  }

  // Calculate checksum for file
  calculateFileChecksum(filePath) {
    const fileBuffer = fs.readFileSync(filePath);
    return crypto.createHash('md5').update(fileBuffer).digest('hex');
  }

  // Get content type from file extension
  getContentType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const contentTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.mov': 'video/quicktime',
      '.avi': 'video/x-msvideo',
      '.pdf': 'application/pdf',
      '.txt': 'text/plain',
      '.json': 'application/json',
      '.xml': 'application/xml',
      '.zip': 'application/zip',
      '.tar': 'application/x-tar',
      '.gz': 'application/gzip'
    };
    
    return contentTypes[ext] || 'application/octet-stream';
  }

  // Test connection
  async testConnection() {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: 'test-connection'
      });

      await this.client.send(command);
      return true;
    } catch (error) {
      if (error.name === 'NotFound') {
        // This is expected for a test key
        return true;
      }
      throw error;
    }
  }
}

// Storage configuration presets
const STORAGE_PRESETS = {
  'aws-s3': {
    endpoint: 'https://s3.amazonaws.com',
    forcePathStyle: false
  },
  'digitalocean-spaces': {
    endpoint: 'https://nyc3.digitaloceanspaces.com',
    forcePathStyle: true
  },
  'cloudflare-r2': {
    endpoint: 'https://pub-1234567890.r2.dev',
    forcePathStyle: true
  },
  'minio': {
    endpoint: 'http://localhost:9000',
    forcePathStyle: true
  }
};

// Create storage manager from configuration
function createStorageManager(config) {
  const preset = STORAGE_PRESETS[config.provider];
  if (preset) {
    config = { ...preset, ...config };
  }
  
  return new StorageManager(config);
}

// Export for use in other modules
export { StorageManager, createStorageManager, STORAGE_PRESETS };