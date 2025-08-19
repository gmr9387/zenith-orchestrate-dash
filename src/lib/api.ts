import { authManager } from './auth';

export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  message: string;
  code: string;
  details?: any;
}

class ApiClient {
  private baseURL: string;
  private retryCount: number = 0;
  private maxRetries: number = 3;

  constructor(baseURL: string = '/api') {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    try {
      // Add auth headers if available
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      if (authManager.isAuthenticated()) {
        try {
          const authHeaders = authManager.getAuthHeaders();
          Object.assign(headers, authHeaders);
        } catch (error) {
          // Token expired, try to refresh
          if (this.retryCount < this.maxRetries) {
            this.retryCount++;
            const refreshed = await authManager.refreshToken();
            if (refreshed) {
              const authHeaders = authManager.getAuthHeaders();
              Object.assign(headers, authHeaders);
            } else {
              throw new Error('Authentication failed');
            }
          } else {
            throw new Error('Authentication failed after retry attempts');
          }
        }
      }

      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        if (response.status === 401 && this.retryCount < this.maxRetries) {
          // Unauthorized, try to refresh token
          this.retryCount++;
          const refreshed = await authManager.refreshToken();
          if (refreshed) {
            // Retry the request with new token
            return this.request(endpoint, options);
          }
        }
        
        const errorData: ApiError = await response.json().catch(() => ({
          message: 'Request failed',
          code: 'UNKNOWN_ERROR'
        }));
        
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      this.retryCount = 0; // Reset retry count on success
      return await response.json();
    } catch (error) {
      this.retryCount = 0; // Reset retry count on error
      throw error;
    }
  }

  // GET request
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.request<T>(`${endpoint}${queryString}`, { method: 'GET' });
  }

  // POST request
  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT request
  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // PATCH request
  async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}

export const apiClient = new ApiClient();