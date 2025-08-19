import { apiClient } from './api';

export interface StorageConfig {
  endpoint: string;
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
}

export interface FileMetadata {
  key: string;
  size: number;
  contentType: string;
  lastModified: Date;
  etag: string;
  url?: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface StorageResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
}

class S3StorageManager {
  private config: StorageConfig | null = null;
  private isInitialized: boolean = false;

  async initialize(config: StorageConfig): Promise<void> {
    this.config = config;
    
    // Test connection
    try {
      await this.testConnection();
      this.isInitialized = true;
    } catch (error) {
      throw new Error(`Failed to initialize S3 storage: ${error}`);
    }
  }

  private async testConnection(): Promise<void> {
    if (!this.config) throw new Error('Storage not initialized');
    
    try {
      await apiClient.get('/storage/test-connection', {
        endpoint: this.config.endpoint,
        bucket: this.config.bucket,
        region: this.config.region,
      });
    } catch (error) {
      throw new Error('Failed to connect to S3-compatible storage');
    }
  }

  async uploadFile(
    file: File,
    key: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<StorageResponse<FileMetadata>> {
    if (!this.isInitialized) throw new Error('Storage not initialized');
    
    try {
      // Create presigned URL for upload
      const presignedResponse = await apiClient.post('/storage/presigned-url', {
        key,
        contentType: file.type,
        operation: 'putObject',
      });

      const { uploadUrl } = presignedResponse.data;

      // Upload file using presigned URL
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      // Get file metadata
      const metadata = await this.getFileMetadata(key);

      return {
        success: true,
        data: metadata,
        message: 'File uploaded successfully',
      };
    } catch (error) {
      return {
        success: false,
        data: null as any,
        message: `Upload failed: ${error}`,
      };
    }
  }

  async downloadFile(key: string): Promise<Blob> {
    if (!this.isInitialized) throw new Error('Storage not initialized');
    
    try {
      // Create presigned URL for download
      const presignedResponse = await apiClient.post('/storage/presigned-url', {
        key,
        operation: 'getObject',
      });

      const { downloadUrl } = presignedResponse.data;

      // Download file using presigned URL
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new Error('Download failed');
      }

      return await response.blob();
    } catch (error) {
      throw new Error(`Download failed: ${error}`);
    }
  }

  async deleteFile(key: string): Promise<StorageResponse<boolean>> {
    if (!this.isInitialized) throw new Error('Storage not initialized');
    
    try {
      await apiClient.delete(`/storage/files/${encodeURIComponent(key)}`);
      
      return {
        success: true,
        data: true,
        message: 'File deleted successfully',
      };
    } catch (error) {
      return {
        success: false,
        data: false,
        message: `Delete failed: ${error}`,
      };
    }
  }

  async listFiles(
    prefix?: string,
    maxKeys: number = 1000
  ): Promise<StorageResponse<FileMetadata[]>> {
    if (!this.isInitialized) throw new Error('Storage not initialized');
    
    try {
      const response = await apiClient.get('/storage/files', {
        prefix,
        maxKeys,
      });

      return {
        success: true,
        data: response.data.files.map((file: any) => ({
          ...file,
          lastModified: new Date(file.lastModified),
        })),
        message: 'Files listed successfully',
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        message: `List files failed: ${error}`,
      };
    }
  }

  async getFileMetadata(key: string): Promise<FileMetadata> {
    if (!this.isInitialized) throw new Error('Storage not initialized');
    
    try {
      const response = await apiClient.get(`/storage/files/${encodeURIComponent(key)}/metadata`);
      
      return {
        ...response.data,
        lastModified: new Date(response.data.lastModified),
      };
    } catch (error) {
      throw new Error(`Failed to get file metadata: ${error}`);
    }
  }

  async generatePresignedUrl(
    key: string,
    operation: 'getObject' | 'putObject',
    expiresIn: number = 3600
  ): Promise<string> {
    if (!this.isInitialized) throw new Error('Storage not initialized');
    
    try {
      const response = await apiClient.post('/storage/presigned-url', {
        key,
        operation,
        expiresIn,
      });

      return response.data.url;
    } catch (error) {
      throw new Error(`Failed to generate presigned URL: ${error}`);
    }
  }

  async copyFile(sourceKey: string, destinationKey: string): Promise<StorageResponse<FileMetadata>> {
    if (!this.isInitialized) throw new Error('Storage not initialized');
    
    try {
      const response = await apiClient.post('/storage/copy', {
        sourceKey,
        destinationKey,
      });

      return {
        success: true,
        data: response.data,
        message: 'File copied successfully',
      };
    } catch (error) {
      return {
        success: false,
        data: null as any,
        message: `Copy failed: ${error}`,
      };
    }
  }

  async moveFile(sourceKey: string, destinationKey: string): Promise<StorageResponse<FileMetadata>> {
    if (!this.isInitialized) throw new Error('Storage not initialized');
    
    try {
      // Copy file to new location
      const copyResult = await this.copyFile(sourceKey, destinationKey);
      if (!copyResult.success) {
        throw new Error('Copy failed');
      }

      // Delete original file
      const deleteResult = await this.deleteFile(sourceKey);
      if (!deleteResult.success) {
        throw new Error('Delete original failed');
      }

      return {
        success: true,
        data: copyResult.data,
        message: 'File moved successfully',
      };
    } catch (error) {
      return {
        success: false,
        data: null as any,
        message: `Move failed: ${error}`,
      };
    }
  }

  getFileUrl(key: string): string {
    if (!this.config) throw new Error('Storage not initialized');
    
    return `${this.config.endpoint}/${this.config.bucket}/${key}`;
  }

  isReady(): boolean {
    return this.isInitialized;
  }
}

export const storageManager = new S3StorageManager();