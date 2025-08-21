import { apiClient } from './api';

export interface ApiEndpoint {
  id: string;
  name: string;
  description: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  targetUrl: string;
  isActive: boolean;
  authentication: {
    type: 'none' | 'api-key' | 'bearer' | 'basic';
    config: Record<string, any>;
  };
  rateLimit: {
    enabled: boolean;
    requests: number;
    windowMs: number;
  };
  caching: {
    enabled: boolean;
    ttl: number;
  };
  transformations: {
    request?: Record<string, any>;
    response?: Record<string, any>;
  };
  monitoring: {
    enabled: boolean;
    logLevel: 'none' | 'basic' | 'detailed';
  };
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  description: string;
  permissions: string[];
  endpointIds: string[];
  rateLimit: {
    requests: number;
    windowMs: number;
  };
  isActive: boolean;
  expiresAt?: string;
  lastUsedAt?: string;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface ApiRequest {
  id: string;
  endpointId: string;
  endpoint: ApiEndpoint;
  apiKeyId?: string;
  apiKey?: ApiKey;
  method: string;
  path: string;
  headers: Record<string, string>;
  query: Record<string, string>;
  body?: any;
  response: {
    status: number;
    headers: Record<string, string>;
    body?: any;
    size: number;
  };
  duration: number;
  timestamp: string;
  ip: string;
  userAgent: string;
  error?: string;
}

export interface ApiAnalytics {
  totalRequests: number;
  successfulRequests: number;
  errorRate: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  requestsPerSecond: number;
  bandwidth: {
    inbound: number;
    outbound: number;
  };
  topEndpoints: Array<{
    endpointId: string;
    path: string;
    requests: number;
    averageResponseTime: number;
  }>;
  errorsByType: Array<{
    status: number;
    count: number;
  }>;
  requestsOverTime: Array<{
    timestamp: string;
    requests: number;
    errors: number;
    averageResponseTime: number;
  }>;
}

export const apiGatewayApi = {
  // Endpoints
  getEndpoints: async (params?: { page?: number; limit?: number; search?: string; isActive?: boolean }) => {
    return apiClient.get<{ endpoints: ApiEndpoint[]; total: number; page: number; totalPages: number }>('/gateway/endpoints', params);
  },

  getEndpoint: async (id: string) => {
    return apiClient.get<ApiEndpoint>(`/gateway/endpoints/${id}`);
  },

  createEndpoint: async (data: Omit<ApiEndpoint, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    return apiClient.post<ApiEndpoint>('/gateway/endpoints', data);
  },

  updateEndpoint: async (id: string, data: Partial<ApiEndpoint>) => {
    return apiClient.put<ApiEndpoint>(`/gateway/endpoints/${id}`, data);
  },

  deleteEndpoint: async (id: string) => {
    return apiClient.delete(`/gateway/endpoints/${id}`);
  },

  testEndpoint: async (id: string, testData?: { headers?: Record<string, string>; body?: any }) => {
    return apiClient.post<{ status: number; response: any; duration: number }>(`/gateway/endpoints/${id}/test`, testData);
  },

  // API Keys
  getApiKeys: async (params?: { page?: number; limit?: number; search?: string; isActive?: boolean }) => {
    return apiClient.get<{ keys: ApiKey[]; total: number; page: number; totalPages: number }>('/gateway/keys', params);
  },

  getApiKey: async (id: string) => {
    return apiClient.get<ApiKey>(`/gateway/keys/${id}`);
  },

  createApiKey: async (data: Omit<ApiKey, 'id' | 'key' | 'createdAt' | 'updatedAt' | 'userId' | 'lastUsedAt' | 'usageCount'>) => {
    return apiClient.post<ApiKey>('/gateway/keys', data);
  },

  updateApiKey: async (id: string, data: Partial<ApiKey>) => {
    return apiClient.put<ApiKey>(`/gateway/keys/${id}`, data);
  },

  deleteApiKey: async (id: string) => {
    return apiClient.delete(`/gateway/keys/${id}`);
  },

  regenerateApiKey: async (id: string) => {
    return apiClient.post<{ key: string }>(`/gateway/keys/${id}/regenerate`);
  },

  // Request Logs
  getRequests: async (params?: { 
    endpointId?: string; 
    apiKeyId?: string; 
    status?: number; 
    startDate?: string; 
    endDate?: string; 
    page?: number; 
    limit?: number; 
  }) => {
    return apiClient.get<{ requests: ApiRequest[]; total: number; page: number; totalPages: number }>('/gateway/requests', params);
  },

  getRequest: async (id: string) => {
    return apiClient.get<ApiRequest>(`/gateway/requests/${id}`);
  },

  // Analytics
  getAnalytics: async (params?: { 
    endpointId?: string; 
    apiKeyId?: string; 
    startDate?: string; 
    endDate?: string; 
    granularity?: 'hour' | 'day' | 'week'; 
  }) => {
    return apiClient.get<ApiAnalytics>('/gateway/analytics', params);
  },

  // Real-time monitoring
  getRealtimeMetrics: async () => {
    return apiClient.get<{
      activeRequests: number;
      requestsPerSecond: number;
      errorRate: number;
      averageResponseTime: number;
      healthStatus: 'healthy' | 'degraded' | 'down';
    }>('/gateway/realtime');
  },

  // Rate limiting
  getRateLimitStatus: async (apiKeyId?: string, endpointId?: string) => {
    return apiClient.get<{
      remaining: number;
      resetTime: string;
      limit: number;
    }>('/gateway/rate-limit', { apiKeyId, endpointId });
  }
};