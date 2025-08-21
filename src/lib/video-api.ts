import { apiClient } from './api';

export interface Video {
  id: string;
  title: string;
  description: string;
  filename: string;
  originalFilename: string;
  size: number;
  duration: number | null;
  thumbnail: string | null;
  status: 'uploading' | 'processing' | 'ready' | 'error';
  quality: 'sd' | 'hd' | '4k';
  hlsUrl?: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  views: number;
  watchTime: number;
}

export interface VideoUploadProgress {
  videoId: string;
  progress: number;
  status: string;
}

export interface VideoAnalytics {
  totalVideos: number;
  totalViews: number;
  totalWatchTime: number;
  averageWatchTime: number;
  topVideos: Array<{
    id: string;
    title: string;
    views: number;
    watchTime: number;
  }>;
  viewsOverTime: Array<{
    date: string;
    views: number;
  }>;
}

export const videoApi = {
  // Get all videos
  getVideos: async (params?: { page?: number; limit?: number; search?: string }) => {
    return apiClient.get<{ videos: Video[]; total: number; page: number; totalPages: number }>('/videos', params);
  },

  // Get single video
  getVideo: async (id: string) => {
    return apiClient.get<Video>(`/videos/${id}`);
  },

  // Upload video
  uploadVideo: async (file: File, metadata: { title: string; description: string; quality: string }) => {
    return apiClient.uploadFile<Video>('/videos/upload', file, metadata);
  },

  // Update video
  updateVideo: async (id: string, data: Partial<Video>) => {
    return apiClient.put<Video>(`/videos/${id}`, data);
  },

  // Delete video
  deleteVideo: async (id: string) => {
    return apiClient.delete(`/videos/${id}`);
  },

  // Get video analytics
  getAnalytics: async () => {
    return apiClient.get<VideoAnalytics>('/videos/analytics');
  },

  // Get video processing status
  getProcessingStatus: async (id: string) => {
    return apiClient.get<{ status: string; progress: number }>(`/videos/${id}/status`);
  },

  // Get video stream URL
  getStreamUrl: async (id: string, quality?: string) => {
    return apiClient.get<{ streamUrl: string; hlsUrl: string }>(`/videos/${id}/stream`, { quality });
  }
};