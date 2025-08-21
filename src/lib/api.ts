import { authManager, AuthToken } from './auth';

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message: string;
  error?: {
    message: string;
    statusCode: number;
    stack?: string;
  };
  timestamp?: string;
  path?: string;
}

export interface ApiError {
  message: string;
  statusCode: number;
  stack?: string;
}

class ApiClient {
  private baseURL: string;
  private retryCount: number = 0;
  private maxRetries: number = 3;

  constructor(baseURL: string = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3001/api/v1') {
    this.baseURL = baseURL;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      // Get authentication headers
      const authHeaders = authManager.getAuthHeaders();
      
      // Prepare request options
      const requestOptions: RequestInit = {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
          ...options.headers,
        },
      };

      // Make the request
      const response = await fetch(`${this.baseURL}${endpoint}`, requestOptions);
      
      // Parse response
      let responseData: any;
      try {
        responseData = await response.json();
      } catch (error) {
        // Handle non-JSON responses
        responseData = {
          success: false,
          message: 'Invalid response format',
          data: null,
        };
      }

      // Handle authentication errors
      if (response.status === 401) {
        // Try to refresh token
        const refreshSuccess = await authManager.refreshToken();
        if (refreshSuccess && this.retryCount < this.maxRetries) {
          this.retryCount++;
          return this.request<T>(endpoint, options);
        } else {
          // Refresh failed, redirect to login
          authManager.logout();
          window.location.href = '/login';
          throw new Error('Authentication failed');
        }
      }

      // Reset retry count on success
      this.retryCount = 0;

      // Handle other HTTP errors
      if (!response.ok) {
        throw new Error(responseData.error?.message || responseData.message || `HTTP ${response.status}`);
      }

      return responseData;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Generic request methods
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.request<T>(`${endpoint}${queryString}`, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // File upload method
  async uploadFile<T>(endpoint: string, file: File, additionalData?: Record<string, any>): Promise<ApiResponse<T>> {
    try {
      const authHeaders = authManager.getAuthHeaders();
      
      const formData = new FormData();
      formData.append('file', file);
      
      if (additionalData) {
        Object.entries(additionalData).forEach(([key, value]) => {
          formData.append(key, value);
        });
      }

      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers: {
          ...authHeaders,
          // Don't set Content-Type for FormData
        },
        body: formData,
      });

      let responseData: any;
      try {
        responseData = await response.json();
      } catch (error) {
        responseData = {
          success: false,
          message: 'Invalid response format',
          data: null,
        };
      }

      if (!response.ok) {
        throw new Error(responseData.error?.message || responseData.message || `HTTP ${response.status}`);
      }

      return responseData;
    } catch (error) {
      console.error('File upload failed:', error);
      throw error;
    }
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string; uptime: number }> {
    try {
      const response = await fetch(`${this.baseURL.replace('/api/v1', '')}/health`);
      return await response.json();
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }
}

export const apiClient = new ApiClient();

// Lightweight helpers to maintain compatibility with existing pages
const API_URL = (import.meta.env.VITE_API_URL as string) || '';
export function hasBackend() { return Boolean(API_URL); }
export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(API_URL + path);
  if (!res.ok) throw new Error(`GET ${path} ${res.status}`);
  return res.json();
}
export async function apiPost<T>(path: string, body: any): Promise<T> {
  const res = await fetch(API_URL + path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`POST ${path} ${res.status}`);
  return res.json();
}
export async function apiUpload(path: string, file: Blob, field = 'file'): Promise<void> {
  const form = new FormData();
  form.append(field, file);
  const res = await fetch(API_URL + path, { method: 'POST', body: form });
  if (!res.ok) throw new Error(`UPLOAD ${path} ${res.status}`);
}
export async function apiPut<T>(path: string, body: any): Promise<T> {
  const res = await fetch(API_URL + path, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`PUT ${path} ${res.status}`);
  return res.json();
}
export async function apiDelete<T = { success: boolean }>(path: string): Promise<T> {
  const res = await fetch(API_URL + path, { method: 'DELETE' });
  if (!res.ok) throw new Error(`DELETE ${path} ${res.status}`);
  return res.json();
}
