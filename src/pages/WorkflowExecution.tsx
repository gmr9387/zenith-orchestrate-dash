import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/auth';
import { 
  Play, 
  Pause, 
  Square, 
  RefreshCw, 
  Clock, 
  CheckCircle,
  XCircle,
  AlertCircle,
  Activity,
  Zap,
  Terminal
} from 'lucide-react';

interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: string;
  startedAt: string;
  completedAt?: string;
  result?: any;
  error?: string;
  logs: ExecutionLog[];
}

interface ExecutionLog {
  id: string;
  nodeId: string;
  step: string;
  status: string;
  input?: any;
  output?: any;
  error?: string;
  startedAt: string;
  completedAt?: string;
  duration?: number;
}

const WorkflowExecution: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [execution, setExecution] = useState<WorkflowExecution | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      loadExecution();
    }
  }, [id]);

  const loadExecution = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/executions/${id}`);
      setExecution(response.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load execution details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const executeWorkflow = async () => {
    try {
      const response = await apiClient.post(`/workflows/${id}/execute`, {
        input: {}
      });
      
      toast({
        title: "Success",
        description: "Workflow execution started",
      });
      
      // Reload execution data
      setTimeout(loadExecution, 1000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to execute workflow",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'running':
        return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'running':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!execution) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Execution not found</h2>
        <p className="text-gray-600">The execution you're looking for doesn't exist.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Workflow Execution</h1>
          <p className="text-gray-600">Monitor and manage workflow execution</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={executeWorkflow} disabled={execution.status === 'running'}>
            <Play className="w-4 h-4 mr-2" />
            Execute
          </Button>
          <Button variant="outline" onClick={loadExecution}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Execution Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Execution Status</CardTitle>
            <div className="flex items-center space-x-2">
              {getStatusIcon(execution.status)}
              <Badge className={getStatusColor(execution.status)}>
                {execution.status}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Started</p>
              <p className="font-semibold">
                {new Date(execution.startedAt).toLocaleString()}
              </p>
            </div>
            {execution.completedAt && (
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="font-semibold">
                  {new Date(execution.completedAt).toLocaleString()}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600">Duration</p>
              <p className="font-semibold">
                {execution.completedAt 
                  ? `${Math.round((new Date(execution.completedAt).getTime() - new Date(execution.startedAt).getTime()) / 1000)}s`
                  : 'Running...'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="logs">Execution Logs</TabsTrigger>
          <TabsTrigger value="result">Result</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Execution Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Execution Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Steps</span>
                    <span className="font-semibold">{execution.logs.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Completed</span>
                    <span className="font-semibold">
                      {execution.logs.filter(log => log.status === 'completed').length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Failed</span>
                    <span className="font-semibold">
                      {execution.logs.filter(log => log.status === 'failed').length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Running</span>
                    <span className="font-semibold">
                      {execution.logs.filter(log => log.status === 'running').length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Error Details */}
            {execution.error && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-red-600">Error Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800">{execution.error}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Execution Logs</CardTitle>
              <CardDescription>Step-by-step execution details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {execution.logs.map((log) => (
                  <div key={log.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(log.status)}
                        <span className="font-semibold">{log.step}</span>
                        <Badge variant="outline">{log.nodeId}</Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">
                          {log.duration ? `${log.duration}ms` : 'Running...'}
                        </span>
                        <Badge className={getStatusColor(log.status)}>
                          {log.status}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {log.input && (
                        <div>
                          <p className="font-medium text-gray-700 mb-1">Input:</p>
                          <pre className="bg-gray-50 p-2 rounded text-xs overflow-x-auto">
                            {JSON.stringify(log.input, null, 2)}
                          </pre>
                        </div>
                      )}
                      {log.output && (
                        <div>
                          <p className="font-medium text-gray-700 mb-1">Output:</p>
                          <pre className="bg-gray-50 p-2 rounded text-xs overflow-x-auto">
                            {JSON.stringify(log.output, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                    
                    {log.error && (
                      <div className="mt-2">
                        <p className="font-medium text-red-700 mb-1">Error:</p>
                        <div className="bg-red-50 border border-red-200 rounded p-2">
                          <p className="text-red-800 text-sm">{log.error}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="result" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Execution Result</CardTitle>
              <CardDescription>Final output from workflow execution</CardDescription>
            </CardHeader>
            <CardContent>
              {execution.result ? (
                <div className="bg-gray-50 border rounded-lg p-4">
                  <pre className="text-sm overflow-x-auto">
                    {JSON.stringify(execution.result, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Terminal className="w-12 h-12 mx-auto mb-4" />
                  <p>No result available yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WorkflowExecution;