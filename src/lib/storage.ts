import { apiClient, ApiResponse } from './api';
import { authManager } from './auth';

export interface StorageConfig {
  provider: 's3' | 'minio' | 'digitalocean' | 'cloudflare';
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
  lastModified: string;
  etag: string;
  metadata: Record<string, any>;
  url: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface StorageResponse<T = any> {
  success: boolean;
  data: T;
  message: string;
}

class S3StorageManager {
  private config: StorageConfig | null = null;
  private isInitialized: boolean = false;

  async initialize(config: StorageConfig): Promise<void> {
    try {
      this.config = config;
      
      // Test connection to storage service
      await this.testStorageConnection();
      
      this.isInitialized = true;
      console.log('Storage manager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize storage manager:', error);
      throw error;
    }
  }

  private async testStorageConnection(): Promise<void> {
    try {
      const response = await apiClient.post('/storage/test-connection');
      if (!response.success) {
        throw new Error(response.message || 'Connection test failed');
      }
    } catch (error) {
      console.error('Storage connection test failed:', error);
      throw new Error('Storage connection test failed');
    }
  }

  async uploadFile(
    file: File, 
    key: string, 
    onProgress?: (progress: UploadProgress) => void
  ): Promise<StorageResponse<FileMetadata>> {
    try {
      if (!this.isInitialized) {
        throw new Error('Storage manager not initialized');
      }

      // Upload file using the backend API
      const response = await apiClient.uploadFile('/storage/upload', file, {
        folder: key.split('/').slice(0, -1).join('/'),
        publicRead: false,
        processImage: file.type.startsWith('image/'),
        processVideo: file.type.startsWith('video/'),
      });

      if (!response.success) {
        throw new Error(response.message || 'Upload failed');
      }

      // Simulate progress for small files
      if (onProgress) {
        onProgress({ loaded: file.size, total: file.size, percentage: 100 });
      }

      return {
        success: true,
        data: response.data,
        message: 'File uploaded successfully',
      };
    } catch (error) {
      console.error('File upload failed:', error);
      throw error;
    }
  }

  async downloadFile(key: string): Promise<Blob> {
    try {
      if (!this.isInitialized) {
        throw new Error('Storage manager not initialized');
      }

      // Get file metadata first
      const metadataResponse = await apiClient.get<FileMetadata>(`/storage/files/${key}`);
      if (!metadataResponse.success) {
        throw new Error('Failed to get file metadata');
      }

      // Download file using the backend API
      const response = await fetch(`${apiClient['baseURL']}/storage/files/${key}/download`, {
        headers: {
          ...authManager.getAuthHeaders(),
        },
      });

      if (!response.ok) {
        throw new Error('Download failed');
      }

      return await response.blob();
    } catch (error) {
      console.error('File download failed:', error);
      throw error;
    }
  }

  async deleteFile(key: string): Promise<StorageResponse<boolean>> {
    try {
      if (!this.isInitialized) {
        throw new Error('Storage manager not initialized');
      }

      const response = await apiClient.delete(`/storage/files/${key}`);
      
      if (!response.success) {
        throw new Error(response.message || 'Delete failed');
      }

      return {
        success: true,
        data: true,
        message: 'File deleted successfully',
      };
    } catch (error) {
      console.error('File deletion failed:', error);
      throw error;
    }
  }

  async listFiles(prefix?: string, maxKeys: number = 1000): Promise<StorageResponse<FileMetadata[]>> {
    try {
      if (!this.isInitialized) {
        throw new Error('Storage manager not initialized');
      }

      const params: Record<string, any> = { maxKeys };
      if (prefix) {
        params.prefix = prefix;
      }

      const response = await apiClient.get<{ files: FileMetadata[] }>('/storage/files', params);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to list files');
      }

      return {
        success: true,
        data: response.data.files,
        message: 'Files listed successfully',
      };
    } catch (error) {
      console.error('Failed to list files:', error);
      throw error;
    }
  }

  async getFileMetadata(key: string): Promise<FileMetadata> {
    try {
      if (!this.isInitialized) {
        throw new Error('Storage manager not initialized');
      }

      const response = await apiClient.get<FileMetadata>(`/storage/files/${key}`);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to get file metadata');
      }

      return response.data;
    } catch (error) {
      console.error('Failed to get file metadata:', error);
      throw error;
    }
  }

  async generatePresignedUrl(
    key: string, 
    operation: 'getObject' | 'putObject', 
    expiresIn: number = 3600
  ): Promise<string> {
    try {
      if (!this.isInitialized) {
        throw new Error('Storage manager not initialized');
      }

      const response = await apiClient.post<{ url: string }>('/storage/presigned-url', {
        key,
        operation,
        expiresIn,
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to generate presigned URL');
      }

      return response.data.url;
    } catch (error) {
      console.error('Failed to generate presigned URL:', error);
      throw error;
    }
  }

  async copyFile(sourceKey: string, destinationKey: string): Promise<StorageResponse<FileMetadata>> {
    try {
      if (!this.isInitialized) {
        throw new Error('Storage manager not initialized');
      }

      const response = await apiClient.post<FileMetadata>('/storage/copy', {
        sourceKey,
        destinationKey,
      });

      if (!response.success) {
        throw new Error(response.message || 'Copy failed');
      }

      return {
        success: true,
        data: response.data,
        message: 'File copied successfully',
      };
    } catch (error) {
      console.error('File copy failed:', error);
      throw error;
    }
  }

  async moveFile(sourceKey: string, destinationKey: string): Promise<StorageResponse<FileMetadata>> {
    try {
      if (!this.isInitialized) {
        throw new Error('Storage manager not initialized');
      }

      const response = await apiClient.post<FileMetadata>('/storage/move', {
        sourceKey,
        destinationKey,
      });

      if (!response.success) {
        throw new Error(response.message || 'Move failed');
      }

      return {
        success: true,
        data: response.data,
        message: 'File moved successfully',
      };
    } catch (error) {
      console.error('File move failed:', error);
      throw error;
    }
  }

  getFileUrl(key: string): string {
    if (!this.config) {
      throw new Error('Storage manager not configured');
    }

    // For MinIO and other S3-compatible services
    if (this.config.provider === 'minio') {
      return `${this.config.endpoint}/${this.config.bucket}/${key}`;
    }

    // For AWS S3 and other cloud providers
    return `${this.config.endpoint}/${this.config.bucket}/${key}`;
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  getStatus(): StorageConfig | null {
    return this.config;
  }

  // Get storage usage statistics
  async getUsage(): Promise<any> {
    try {
      const response = await apiClient.get('/storage/usage');
      if (!response.success) {
        throw new Error(response.message || 'Failed to get usage statistics');
      }
      return response.data;
    } catch (error) {
      console.error('Failed to get usage statistics:', error);
      throw error;
    }
  }

  // Test storage connection
  async testConnection(): Promise<boolean> {
    try {
      const response = await apiClient.post('/storage/test-connection');
      return response.success;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }
}

export const storageManager = new S3StorageManager();