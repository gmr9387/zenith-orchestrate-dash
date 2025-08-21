import { apiClient } from './api';

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  workflow: {
    id: string;
    name: string;
  };
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt: string;
  completedAt?: string;
  duration?: number;
  triggerData: Record<string, any>;
  logs: ExecutionLog[];
  nodeExecutions: NodeExecution[];
  error?: string;
  metrics: {
    nodesExecuted: number;
    totalNodes: number;
    memoryUsed: number;
    cpuTime: number;
  };
}

export interface NodeExecution {
  id: string;
  nodeId: string;
  nodeName: string;
  nodeType: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startedAt: string;
  completedAt?: string;
  duration?: number;
  input: Record<string, any>;
  output?: Record<string, any>;
  error?: string;
  retryCount: number;
  executionOrder: number;
}

export interface ExecutionLog {
  id: string;
  executionId: string;
  nodeId?: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface WorkflowMetrics {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  totalCpuTime: number;
  totalMemoryUsed: number;
  activeExecutions: number;
  queuedExecutions: number;
  executionsOverTime: Array<{
    date: string;
    count: number;
    successRate: number;
  }>;
  topWorkflows: Array<{
    workflowId: string;
    workflowName: string;
    executions: number;
    successRate: number;
  }>;
}

export const workflowExecutionApi = {
  // Executions
  getExecutions: async (params?: { 
    workflowId?: string; 
    status?: string; 
    page?: number; 
    limit?: number; 
    startDate?: string; 
    endDate?: string; 
  }) => {
    return apiClient.get<{ executions: WorkflowExecution[]; total: number; page: number; totalPages: number }>('/workflows/executions', params);
  },

  getExecution: async (id: string) => {
    return apiClient.get<WorkflowExecution>(`/workflows/executions/${id}`);
  },

  // Trigger workflow
  triggerWorkflow: async (workflowId: string, data?: Record<string, any>) => {
    return apiClient.post<WorkflowExecution>(`/workflows/${workflowId}/trigger`, { data });
  },

  // Cancel execution
  cancelExecution: async (id: string) => {
    return apiClient.post(`/workflows/executions/${id}/cancel`);
  },

  // Retry execution
  retryExecution: async (id: string) => {
    return apiClient.post<WorkflowExecution>(`/workflows/executions/${id}/retry`);
  },

  // Get execution logs
  getExecutionLogs: async (id: string, params?: { level?: string; nodeId?: string; limit?: number }) => {
    return apiClient.get<{ logs: ExecutionLog[]; total: number }>(`/workflows/executions/${id}/logs`, params);
  },

  // Get node execution details
  getNodeExecution: async (executionId: string, nodeId: string) => {
    return apiClient.get<NodeExecution>(`/workflows/executions/${executionId}/nodes/${nodeId}`);
  },

  // Real-time execution status (WebSocket endpoint)
  getExecutionStatus: async (id: string) => {
    return apiClient.get<{ status: string; progress: number; currentNode?: string }>(`/workflows/executions/${id}/status`);
  },

  // Metrics
  getMetrics: async (params?: { workflowId?: string; startDate?: string; endDate?: string }) => {
    return apiClient.get<WorkflowMetrics>('/workflows/metrics', params);
  },

  // Performance analytics
  getPerformanceMetrics: async (workflowId?: string) => {
    return apiClient.get<{
      averageExecutionTime: number;
      p95ExecutionTime: number;
      errorRate: number;
      throughput: number;
      resourceUsage: {
        cpu: number;
        memory: number;
        network: number;
      };
    }>('/workflows/performance', { workflowId });
  }
};