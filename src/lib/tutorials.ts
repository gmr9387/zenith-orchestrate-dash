import { apiClient, ApiResponse } from './api';
import { storageManager } from './storage';

export interface TutorialStep {
  id: string;
  tutorialId: string;
  title: string;
  description: string;
  content: string;
  order: number;
  type: 'text' | 'video' | 'interactive' | 'quiz';
  mediaUrl?: string;
  duration?: number; // in seconds
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tutorial {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: number; // in minutes
  thumbnailUrl?: string;
  videoUrl?: string;
  steps: TutorialStep[];
  authorId: string;
  isPublished: boolean;
  viewCount: number;
  rating: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TutorialSearchParams {
  query?: string;
  category?: string;
  difficulty?: string;
  tags?: string[];
  authorId?: string;
  isPublished?: boolean;
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
  query?: string;
  type?: string;
  isCompleted?: boolean;
  page?: number;
  limit?: number;
}

class TutorialManager {
  async searchTutorials(params: TutorialSearchParams = {}): Promise<TutorialSearchResponse> {
    try {
      const response = await apiClient.get<TutorialSearchResponse>('/tutorials/search', params);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to search tutorials: ${error}`);
    }
  }

  async getTutorial(id: string): Promise<Tutorial> {
    try {
      const response = await apiClient.get<Tutorial>(`/tutorials/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get tutorial: ${error}`);
    }
  }

  async createTutorial(tutorial: Omit<Tutorial, 'id' | 'createdAt' | 'updatedAt' | 'viewCount' | 'rating'>): Promise<Tutorial> {
    try {
      const response = await apiClient.post<Tutorial>('/tutorials', tutorial);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create tutorial: ${error}`);
    }
  }

  async updateTutorial(id: string, updates: Partial<Tutorial>): Promise<Tutorial> {
    try {
      const response = await apiClient.put<Tutorial>(`/tutorials/${id}`, updates);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to update tutorial: ${error}`);
    }
  }

  async deleteTutorial(id: string): Promise<boolean> {
    try {
      await apiClient.delete(`/tutorials/${id}`);
      return true;
    } catch (error) {
      throw new Error(`Failed to delete tutorial: ${error}`);
    }
  }

  async searchSteps(params: StepSearchParams = {}): Promise<ApiResponse<TutorialStep[]>> {
    try {
      const response = await apiClient.get<TutorialStep[]>('/tutorials/steps/search', params);
      return response;
    } catch (error) {
      throw new Error(`Failed to search steps: ${error}`);
    }
  }

  async getStep(id: string): Promise<TutorialStep> {
    try {
      const response = await apiClient.get<TutorialStep>(`/tutorials/steps/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get step: ${error}`);
    }
  }

  async createStep(step: Omit<TutorialStep, 'id' | 'createdAt' | 'updatedAt'>): Promise<TutorialStep> {
    try {
      const response = await apiClient.post<TutorialStep>('/tutorials/steps', step);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create step: ${error}`);
    }
  }

  async updateStep(id: string, updates: Partial<TutorialStep>): Promise<TutorialStep> {
    try {
      const response = await apiClient.put<TutorialStep>(`/tutorials/steps/${id}`, updates);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to update step: ${error}`);
    }
  }

  async deleteStep(id: string): Promise<boolean> {
    try {
      await apiClient.delete(`/tutorials/steps/${id}`);
      return true;
    } catch (error) {
      throw new Error(`Failed to delete step: ${error}`);
    }
  }

  async reorderSteps(tutorialId: string, stepIds: string[]): Promise<TutorialStep[]> {
    try {
      const response = await apiClient.post<TutorialStep[]>(`/tutorials/${tutorialId}/steps/reorder`, {
        stepIds,
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to reorder steps: ${error}`);
    }
  }

  async markStepComplete(stepId: string, isCompleted: boolean = true): Promise<TutorialStep> {
    try {
      const response = await apiClient.patch<TutorialStep>(`/tutorials/steps/${stepId}/complete`, {
        isCompleted,
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to mark step complete: ${error}`);
    }
  }

  async uploadTutorialMedia(
    file: File,
    tutorialId: string,
    type: 'thumbnail' | 'video' | 'audio'
  ): Promise<string> {
    try {
      const key = `tutorials/${tutorialId}/${type}/${file.name}`;
      const result = await storageManager.uploadFile(file, key);
      
      if (!result.success) {
        throw new Error(result.message);
      }

      return result.data.url || storageManager.getFileUrl(key);
    } catch (error) {
      throw new Error(`Failed to upload tutorial media: ${error}`);
    }
  }

  async getTutorialProgress(tutorialId: string, userId: string): Promise<{
    completedSteps: number;
    totalSteps: number;
    percentage: number;
    estimatedTimeRemaining: number;
  }> {
    try {
      const response = await apiClient.get(`/tutorials/${tutorialId}/progress`, { userId });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get tutorial progress: ${error}`);
    }
  }

  async getPopularTutorials(limit: number = 10): Promise<Tutorial[]> {
    try {
      const response = await apiClient.get<Tutorial[]>('/tutorials/popular', { limit });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get popular tutorials: ${error}`);
    }
  }

  async getRecommendedTutorials(userId: string, limit: number = 10): Promise<Tutorial[]> {
    try {
      const response = await apiClient.get<Tutorial[]>('/tutorials/recommended', { userId, limit });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get recommended tutorials: ${error}`);
    }
  }

  async addTutorialRating(tutorialId: string, userId: string, rating: number, review?: string): Promise<void> {
    try {
      await apiClient.post(`/tutorials/${tutorialId}/ratings`, {
        userId,
        rating,
        review,
      });
    } catch (error) {
      throw new Error(`Failed to add tutorial rating: ${error}`);
    }
  }

  async incrementViewCount(tutorialId: string): Promise<void> {
    try {
      await apiClient.post(`/tutorials/${tutorialId}/view`);
    } catch (error) {
      throw new Error(`Failed to increment view count: ${error}`);
    }
  }
}

export const tutorialManager = new TutorialManager();