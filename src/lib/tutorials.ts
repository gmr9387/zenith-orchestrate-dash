import { apiClient, ApiResponse } from './api';
import { storageManager } from './storage';

export interface TutorialStep {
  _id?: string;
  title: string;
  description?: string;
  content: string;
  order: number;
  type: 'text' | 'video' | 'interactive' | 'quiz';
  mediaUrl?: string;
  duration?: number;
  isCompleted?: boolean;
  metadata?: {
    fileSize?: number;
    mimeType?: string;
    dimensions?: {
      width?: number;
      height?: number;
    };
    encoding?: string;
  };
  quizData?: {
    questions: Array<{
      question: string;
      options: string[];
      correctAnswer: number;
      explanation?: string;
    }>;
    passingScore: number;
  };
  interactiveData?: {
    type: 'click' | 'drag' | 'type' | 'select';
    instructions: string;
    targetElements: string[];
    validationRules?: any;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface Tutorial {
  _id?: string;
  title: string;
  description: string;
  slug?: string;
  category: 'business' | 'technology' | 'marketing' | 'sales' | 'development' | 'design' | 'finance' | 'healthcare' | 'education' | 'other';
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: number;
  thumbnailUrl?: string;
  videoUrl?: string;
  steps: TutorialStep[];
  authorId?: string;
  isPublished?: boolean;
  isPublic?: boolean;
  viewCount?: number;
  rating?: {
    average: number;
    count: number;
    total: number;
  };
  reviews?: Array<{
    userId: string;
    rating: number;
    review?: string;
    createdAt: string;
  }>;
  completionStats?: {
    totalAttempts: number;
    successfulCompletions: number;
    averageCompletionTime: number;
    completionRate: number;
  };
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
    canonicalUrl?: string;
  };
  settings?: {
    allowComments: boolean;
    requireLogin: boolean;
    allowSharing: boolean;
    autoAdvance: boolean;
    showProgress: boolean;
  };
  analytics?: {
    uniqueVisitors: number;
    bounceRate: number;
    averageSessionDuration: number;
    popularSteps: Array<{
      stepId: string;
      viewCount: number;
    }>;
  };
  version?: number;
  isArchived?: boolean;
  archivedAt?: string;
  archivedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TutorialSearchParams {
  query?: string;
  category?: string;
  difficulty?: string;
  tags?: string;
  authorId?: string;
  isPublished?: boolean;
  isPublic?: boolean;
  minRating?: number;
  maxDuration?: number;
  sortBy?: 'title' | 'createdAt' | 'updatedAt' | 'rating' | 'viewCount';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface TutorialSearchResponse {
  tutorials: Tutorial[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: {
    applied: TutorialSearchParams;
    available: {
      categories: string[];
      difficulties: string[];
      tags: string[];
    };
  };
}

export interface StepSearchParams {
  tutorialId?: string;
  type?: string;
  query?: string;
  isCompleted?: boolean;
  page?: number;
  limit?: number;
}

class TutorialManager {
  async searchTutorials(params: TutorialSearchParams = {}): Promise<TutorialSearchResponse> {
    try {
      const response = await apiClient.get<TutorialSearchResponse>('/tutorials', params);
      
      if (!response.success) {
        throw new Error(response.message || 'Search failed');
      }

      return response.data;
    } catch (error) {
      console.error('Tutorial search failed:', error);
      throw error;
    }
  }

  async getTutorial(id: string): Promise<Tutorial> {
    try {
      const response = await apiClient.get<Tutorial>(`/tutorials/${id}`);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to get tutorial');
      }

      return response.data;
    } catch (error) {
      console.error('Failed to get tutorial:', error);
      throw error;
    }
  }

  async createTutorial(tutorial: Omit<Tutorial, '_id' | 'createdAt' | 'updatedAt' | 'viewCount' | 'rating'>): Promise<Tutorial> {
    try {
      const response = await apiClient.post<Tutorial>('/tutorials', tutorial);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to create tutorial');
      }

      return response.data;
    } catch (error) {
      console.error('Failed to create tutorial:', error);
      throw error;
    }
  }

  async updateTutorial(id: string, updates: Partial<Tutorial>): Promise<Tutorial> {
    try {
      const response = await apiClient.put<Tutorial>(`/tutorials/${id}`, updates);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to update tutorial');
      }

      return response.data;
    } catch (error) {
      console.error('Failed to update tutorial:', error);
      throw error;
    }
  }

  async deleteTutorial(id: string): Promise<boolean> {
    try {
      const response = await apiClient.delete(`/tutorials/${id}`);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete tutorial');
      }

      return true;
    } catch (error) {
      console.error('Failed to delete tutorial:', error);
      throw error;
    }
  }

  async searchSteps(params: StepSearchParams = {}): Promise<ApiResponse<TutorialStep[]>> {
    try {
      const response = await apiClient.get<TutorialStep[]>('/tutorials', params);
      return response;
    } catch (error) {
      console.error('Step search failed:', error);
      throw error;
    }
  }

  async getStep(id: string): Promise<TutorialStep> {
    try {
      // For now, we'll get the tutorial and find the step
      // In the future, we might have a dedicated step endpoint
      throw new Error('Direct step retrieval not implemented');
    } catch (error) {
      console.error('Failed to get step:', error);
      throw error;
    }
  }

  async createStep(tutorialId: string, step: Omit<TutorialStep, '_id' | 'createdAt' | 'updatedAt'>): Promise<Tutorial> {
    try {
      const response = await apiClient.post<Tutorial>(`/tutorials/${tutorialId}/steps`, step);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to create step');
      }

      return response.data;
    } catch (error) {
      console.error('Failed to create step:', error);
      throw error;
    }
  }

  async updateStep(tutorialId: string, stepId: string, updates: Partial<TutorialStep>): Promise<Tutorial> {
    try {
      const response = await apiClient.put<Tutorial>(`/tutorials/${tutorialId}/steps/${stepId}`, updates);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to update step');
      }

      return response.data;
    } catch (error) {
      console.error('Failed to update step:', error);
      throw error;
    }
  }

  async deleteStep(tutorialId: string, stepId: string): Promise<Tutorial> {
    try {
      const response = await apiClient.delete<Tutorial>(`/tutorials/${tutorialId}/steps/${stepId}`);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete step');
      }

      return response.data;
    } catch (error) {
      console.error('Failed to delete step:', error);
      throw error;
    }
  }

  async reorderSteps(tutorialId: string, stepIds: string[]): Promise<Tutorial> {
    try {
      const response = await apiClient.post<Tutorial>(`/tutorials/${tutorialId}/steps/reorder`, {
        stepIds,
      });
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to reorder steps');
      }

      return response.data;
    } catch (error) {
      console.error('Failed to reorder steps:', error);
      throw error;
    }
  }

  async markStepComplete(tutorialId: string, stepId: string, isCompleted: boolean = true): Promise<Tutorial> {
    try {
      const response = await apiClient.patch<Tutorial>(`/tutorials/${tutorialId}/steps/${stepId}/complete`, {
        isCompleted,
      });
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to update step completion');
      }

      return response.data;
    } catch (error) {
      console.error('Failed to update step completion:', error);
      throw error;
    }
  }

  async uploadTutorialMedia(file: File, tutorialId: string, type: 'thumbnail' | 'video' | 'audio'): Promise<string> {
    try {
      // Upload file to storage
      const key = `tutorials/${tutorialId}/${type}/${file.name}`;
      const uploadResult = await storageManager.uploadFile(file, key);
      
      if (!uploadResult.success) {
        throw new Error('File upload failed');
      }

      // Update tutorial with media URL
      const updateData: Partial<Tutorial> = {};
      if (type === 'thumbnail') {
        updateData.thumbnailUrl = uploadResult.data.url;
      } else if (type === 'video') {
        updateData.videoUrl = uploadResult.data.url;
      }

      await this.updateTutorial(tutorialId, updateData);

      return uploadResult.data.url;
    } catch (error) {
      console.error('Failed to upload tutorial media:', error);
      throw error;
    }
  }

  async getTutorialProgress(tutorialId: string, userId: string): Promise<{
    completedSteps: number;
    totalSteps: number;
    percentage: number;
    estimatedTimeRemaining: number;
  }> {
    try {
      const response = await apiClient.get(`/tutorials/${tutorialId}/progress`);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to get tutorial progress');
      }

      return response.data || {
        completedSteps: 0,
        totalSteps: 0,
        percentage: 0,
        estimatedTimeRemaining: 0
      };
    } catch (error) {
      console.error('Failed to get tutorial progress:', error);
      throw error;
    }
  }

  async getPopularTutorials(limit: number = 10): Promise<Tutorial[]> {
    try {
      const response = await apiClient.get<Tutorial[]>('/tutorials/popular', { limit });
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to get popular tutorials');
      }

      return response.data;
    } catch (error) {
      console.error('Failed to get popular tutorials:', error);
      throw error;
    }
  }

  async getRecommendedTutorials(userId: string, limit: number = 10): Promise<Tutorial[]> {
    try {
      const response = await apiClient.get<Tutorial[]>('/tutorials/recommended', { limit });
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to get recommended tutorials');
      }

      return response.data;
    } catch (error) {
      console.error('Failed to get recommended tutorials:', error);
      throw error;
    }
  }

  async addTutorialRating(tutorialId: string, userId: string, rating: number, review?: string): Promise<void> {
    try {
      const response = await apiClient.post(`/tutorials/${tutorialId}/rating`, {
        rating,
        review,
      });
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to add rating');
      }
    } catch (error) {
      console.error('Failed to add tutorial rating:', error);
      throw error;
    }
  }

  async incrementViewCount(tutorialId: string): Promise<void> {
    try {
      const response = await apiClient.post(`/tutorials/${tutorialId}/view`);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to increment view count');
      }
    } catch (error) {
      console.error('Failed to increment view count:', error);
      throw error;
    }
  }

  async publishTutorial(tutorialId: string): Promise<Tutorial> {
    try {
      const response = await apiClient.post<Tutorial>(`/tutorials/${tutorialId}/publish`);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to publish tutorial');
      }

      return response.data;
    } catch (error) {
      console.error('Failed to publish tutorial:', error);
      throw error;
    }
  }

  async unpublishTutorial(tutorialId: string): Promise<Tutorial> {
    try {
      const response = await apiClient.post<Tutorial>(`/tutorials/${tutorialId}/unpublish`);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to unpublish tutorial');
      }

      return response.data;
    } catch (error) {
      console.error('Failed to unpublish tutorial:', error);
      throw error;
    }
  }
}

export const tutorialManager = new TutorialManager();