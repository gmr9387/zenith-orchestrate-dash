import { apiClient } from './api';

export interface AppTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  thumbnail: string;
  previewUrl: string;
  components: ComponentConfig[];
  features: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
  downloads: number;
  rating: number;
}

export interface ComponentConfig {
  id: string;
  type: string;
  name: string;
  props: Record<string, any>;
  children?: ComponentConfig[];
  styles?: Record<string, any>;
}

export interface AppProject {
  id: string;
  name: string;
  description: string;
  templateId?: string;
  template?: AppTemplate;
  components: ComponentConfig[];
  config: {
    theme: Record<string, any>;
    layout: Record<string, any>;
    integrations: Record<string, any>;
  };
  status: 'draft' | 'building' | 'ready' | 'published' | 'error';
  buildUrl?: string;
  publishedUrl?: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface ComponentLibraryItem {
  id: string;
  name: string;
  category: string;
  description: string;
  thumbnail: string;
  code: string;
  props: Array<{
    name: string;
    type: string;
    required: boolean;
    default?: any;
    description: string;
  }>;
  examples: Array<{
    name: string;
    code: string;
    preview: string;
  }>;
  tags: string[];
}

export interface BuildResult {
  success: boolean;
  buildId: string;
  url?: string;
  error?: string;
  logs: string[];
  deployedAt?: string;
}

export const appBuilderApi = {
  // Templates
  getTemplates: async (params?: { category?: string; search?: string; page?: number; limit?: number }) => {
    return apiClient.get<{ templates: AppTemplate[]; total: number; page: number; totalPages: number }>('/app-builder/templates', params);
  },

  getTemplate: async (id: string) => {
    return apiClient.get<AppTemplate>(`/app-builder/templates/${id}`);
  },

  // Projects
  getProjects: async (params?: { page?: number; limit?: number; search?: string }) => {
    return apiClient.get<{ projects: AppProject[]; total: number; page: number; totalPages: number }>('/app-builder/projects', params);
  },

  getProject: async (id: string) => {
    return apiClient.get<AppProject>(`/app-builder/projects/${id}`);
  },

  createProject: async (data: { name: string; description: string; templateId?: string }) => {
    return apiClient.post<AppProject>('/app-builder/projects', data);
  },

  updateProject: async (id: string, data: Partial<AppProject>) => {
    return apiClient.put<AppProject>(`/app-builder/projects/${id}`, data);
  },

  deleteProject: async (id: string) => {
    return apiClient.delete(`/app-builder/projects/${id}`);
  },

  // Component Library
  getComponents: async (params?: { category?: string; search?: string; page?: number; limit?: number }) => {
    return apiClient.get<{ components: ComponentLibraryItem[]; total: number; page: number; totalPages: number }>('/app-builder/components', params);
  },

  getComponent: async (id: string) => {
    return apiClient.get<ComponentLibraryItem>(`/app-builder/components/${id}`);
  },

  // Build & Deploy
  buildProject: async (id: string) => {
    return apiClient.post<BuildResult>(`/app-builder/projects/${id}/build`);
  },

  getBuildStatus: async (id: string, buildId: string) => {
    return apiClient.get<{ status: string; progress: number; logs: string[] }>(`/app-builder/projects/${id}/builds/${buildId}`);
  },

  publishProject: async (id: string) => {
    return apiClient.post<{ url: string; publishedAt: string }>(`/app-builder/projects/${id}/publish`);
  },

  // Preview
  getPreview: async (id: string) => {
    return apiClient.get<{ previewUrl: string }>(`/app-builder/projects/${id}/preview`);
  }
};