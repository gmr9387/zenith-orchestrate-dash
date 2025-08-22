import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import crypto from 'crypto';
import path from 'path';

class StorageManager {
  constructor(config = {}) {
    this.config = {
      provider: config.provider || 'local', // 'local', 's3', 'r2', etc.
      endpoint: config.endpoint,
      region: config.region,
      bucket: config.bucket,
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
      cdnBaseUrl: config.cdnBaseUrl, // optional CDN URL
      defaultTtl: typeof config.defaultTtl === 'number' ? config.defaultTtl : 3600,
      ...config
    };

    this.client = null;
    this.setupClient();
  }

  setupClient() {
    if (this.config.provider === 'local') {
      console.log('Using local storage');
      return;
    }

    try {
      const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
      const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

      this.client = new S3Client({
        endpoint: this.config.endpoint,
        region: this.config.region,
        credentials: {
          accessKeyId: this.config.accessKeyId,
          secretAccessKey: this.config.secretAccessKey
        },
        forcePathStyle: true // For S3-compatible services like MinIO
      });

      this.s3Commands = {
        PutObjectCommand,
        GetObjectCommand,
        DeleteObjectCommand,
        HeadObjectCommand
      };

      this.getSignedUrl = getSignedUrl;
      console.log(`Storage client initialized for ${this.config.provider}`);
    } catch (error) {
      console.warn('AWS SDK not available, using local storage:', error.message);
      this.config.provider = 'local';
    }
  }

  // Upload file to storage
  async uploadFile(filePath, key, options = {}) {
    if (this.config.provider === 'local') {
      return this.uploadToLocal(filePath, key, options);
    }

    try {
      const fs = await import('fs');
      const fileContent = fs.readFileSync(filePath);
      
      const command = new this.s3Commands.PutObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
        Body: fileContent,
        ContentType: options.contentType || this.getContentType(filePath),
        Metadata: options.metadata || {},
        CacheControl: options.cacheControl || 'public, max-age=31536000, immutable',
        ...options
      });

      await this.client.send(command);
      
      const originUrl = `${this.config.endpoint}/${this.config.bucket}/${key}`;
      return {
        url: this.config.cdnBaseUrl ? `${this.config.cdnBaseUrl}/${key}` : originUrl,
        key: key,
        size: fileContent.length
      };
    } catch (error) {
      console.error('S3 upload failed:', error);
      throw new Error(`Failed to upload to S3: ${error.message}`);
    }
  }

  // Upload to local storage
  async uploadToLocal(filePath, key, options = {}) {
    const fs = await import('fs');
    const targetPath = path.join(process.cwd(), 'server/storage', key);
    
    // Ensure directory exists
    const targetDir = path.dirname(targetPath);
    fs.mkdirSync(targetDir, { recursive: true });
    
    // Copy file
    fs.copyFileSync(filePath, targetPath);
    
    return {
      url: `/storage/${key}`,
      key: key,
      size: fs.statSync(targetPath).size
    };
  }

  // Generate signed URL for file access
  async getSignedUrl(key, operation = 'getObject', expiresIn) {
    if (this.config.provider === 'local') {
      return `/storage/${key}`;
    }

    try {
      const command = new this.s3Commands[`${operation}Command`]({
        Bucket: this.config.bucket,
        Key: key
      });

      const url = await this.getSignedUrl(this.client, command, { expiresIn: expiresIn || this.config.defaultTtl });
      if (this.config.cdnBaseUrl && operation === 'getObject') {
        // Rewrite to CDN base; note: CDN must honor origin auth if needed.
        const originPath = `/${this.config.bucket}/`;
        return url.replace(this.config.endpoint + originPath, this.config.cdnBaseUrl + '/');
      }
      return url;
    } catch (error) {
      console.error('Failed to generate signed URL:', error);
      throw new Error(`Failed to generate signed URL: ${error.message}`);
    }
  }

  // Check if file exists
  async fileExists(key) {
    if (this.config.provider === 'local') {
      const fs = await import('fs');
      const filePath = path.join(process.cwd(), 'server/storage', key);
      return fs.existsSync(filePath);
    }

    try {
      const command = new this.s3Commands.HeadObjectCommand({
        Bucket: this.config.bucket,
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

  // Delete file
  async deleteFile(key) {
    if (this.config.provider === 'local') {
      const fs = await import('fs');
      const filePath = path.join(process.cwd(), 'server/storage', key);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return true;
    }

    try {
      const command = new this.s3Commands.DeleteObjectCommand({
        Bucket: this.config.bucket,
        Key: key
      });

      await this.client.send(command);
      return true;
    } catch (error) {
      console.error('Failed to delete file:', error);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  // Get file metadata
  async getFileMetadata(key) {
    if (this.config.provider === 'local') {
      const fs = await import('fs');
      const filePath = path.join(process.cwd(), 'server/storage', key);
      if (!fs.existsSync(filePath)) {
        return null;
      }
      
      const stats = fs.statSync(filePath);
      return {
        size: stats.size,
        lastModified: stats.mtime,
        contentType: this.getContentType(filePath)
      };
    }

    try {
      const command = new this.s3Commands.HeadObjectCommand({
        Bucket: this.config.bucket,
        Key: key
      });

      const response = await this.client.send(command);
      return {
        size: response.ContentLength,
        lastModified: response.LastModified,
        contentType: response.ContentType,
        metadata: response.Metadata
      };
    } catch (error) {
      if (error.name === 'NotFound') {
        return null;
      }
      throw error;
    }
  }

  // Generate checksum for file
  async generateChecksum(filePath) {
    const fs = await import('fs');
    const crypto = await import('crypto');
    
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath);
      
      stream.on('data', (data) => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  // Verify file integrity
  async verifyFileIntegrity(filePath, expectedChecksum) {
    const actualChecksum = await this.generateChecksum(filePath);
    return actualChecksum === expectedChecksum;
  }

  // Get content type from file extension
  getContentType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.avi': 'video/x-msvideo',
      '.mov': 'video/quicktime',
      '.mkv': 'video/x-matroska',
      '.m3u8': 'application/vnd.apple.mpegurl',
      '.ts': 'video/mp2t',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.json': 'application/json',
      '.txt': 'text/plain',
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript'
    };
    
    return mimeTypes[ext] || 'application/octet-stream';
  }

  // Generate storage key for video assets
  generateVideoKey(videoId, type, quality = null) {
    const timestamp = Date.now();
    const key = quality 
      ? `videos/${videoId}/${type}/${quality}_${timestamp}`
      : `videos/${videoId}/${type}/${timestamp}`;
    
    return key;
  }

  // Upload video assets with proper organization
  async uploadVideoAssets(videoId, assets) {
    const results = {};
    
    for (const [type, files] of Object.entries(assets)) {
      results[type] = [];
      
      for (const file of files) {
        const key = this.generateVideoKey(videoId, type, file.quality);
        const result = await this.uploadFile(file.path, key, {
          contentType: this.getContentType(file.path),
          metadata: {
            videoId,
            type,
            quality: file.quality || 'original',
            originalName: file.originalName
          }
        });
        
        results[type].push({
          ...result,
          quality: file.quality,
          originalName: file.originalName
        });
      }
    }
    
    return results;
  }

  // Get signed URLs for video assets
  async getVideoAssetUrls(videoId, assets, expiresIn = 3600) {
    const urls = {};
    
    for (const [type, files] of Object.entries(assets)) {
      urls[type] = [];
      
      for (const file of files) {
        const key = this.generateVideoKey(videoId, type, file.quality);
        const signedUrl = await this.getSignedUrl(key, 'getObject', expiresIn);
        
        urls[type].push({
          url: signedUrl,
          quality: file.quality,
          size: file.size
        });
      }
    }
    
    return urls;
  }

  // Clean up old video assets
  async cleanupVideoAssets(videoId, keepAssets = []) {
    // This would implement lifecycle policies
    // For now, just return success
    console.log(`Cleanup requested for video ${videoId}, keeping:`, keepAssets);
    return true;
  }
}

export default StorageManager;