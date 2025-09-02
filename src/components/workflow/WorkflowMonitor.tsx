import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { workflowExecutionApi, WorkflowExecution, WorkflowMetrics } from '@/lib/workflow-api';
import { useToast } from '@/hooks/use-toast';
import { ExecutionDetails } from './ExecutionDetails';
import { ExecutionLogs } from './ExecutionLogs';
import { MetricsDashboard } from './MetricsDashboard';
import { 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  Search, 
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

export function WorkflowMonitor() {
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [metrics, setMetrics] = useState<WorkflowMetrics | null>(null);
  const [selectedExecution, setSelectedExecution] = useState<WorkflowExecution | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [executionsRes, metricsRes] = await Promise.all([
        workflowExecutionApi.getExecutions({ limit: 50 }),
        workflowExecutionApi.getMetrics()
      ]);
      setExecutions(executionsRes.executions);
      setMetrics(metricsRes);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load workflow data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelExecution = async (id: string) => {
    try {
      await workflowExecutionApi.cancelExecution(id);
      toast({
        title: "Success",
        description: "Execution cancelled"
      });
      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel execution",
        variant: "destructive"
      });
    }
  };

  const handleRetryExecution = async (id: string) => {
    try {
      await workflowExecutionApi.retryExecution(id);
      toast({
        title: "Success",
        description: "Execution retried"
      });
      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to retry execution",
        variant: "destructive"
      });
    }
  };

  const filteredExecutions = executions.filter(execution => {
    const matchesSearch = execution.workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         execution.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || execution.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'running':
        return <Clock className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'cancelled':
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'failed':
        return 'destructive';
      case 'running':
        return 'secondary';
      case 'pending':
        return 'outline';
      case 'cancelled':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workflow Monitor</h1>
          <p className="text-muted-foreground">Monitor and manage workflow executions</p>
        </div>
        <Button onClick={loadData} disabled={loading}>
          <RotateCcw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {metrics && <MetricsDashboard metrics={metrics} />}

      <Tabs defaultValue="executions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="executions">Executions</TabsTrigger>
          <TabsTrigger value="details" disabled={!selectedExecution}>Details</TabsTrigger>
          <TabsTrigger value="logs" disabled={!selectedExecution}>Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="executions" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search executions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border rounded-md bg-background"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="running">Running</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <AnimatePresence>
              {filteredExecutions.map((execution) => (
                <motion.div
                  key={execution.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`cursor-pointer ${
                    selectedExecution?.id === execution.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedExecution(execution)}
                >
                  <Card className="glass-card hover-lift">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(execution.status)}
                          <div>
                            <h3 className="font-medium">{execution.workflow.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              ID: {execution.id.slice(0, 8)}...
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={getStatusVariant(execution.status)}>
                            {execution.status}
                          </Badge>
                          <div className="text-right text-sm text-muted-foreground">
                            <p>Started: {new Date(execution.startedAt).toLocaleString()}</p>
                            {execution.duration && (
                              <p>Duration: {(execution.duration / 1000).toFixed(2)}s</p>
                            )}
                          </div>
                          <div className="flex gap-1">
                            {execution.status === 'running' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCancelExecution(execution.id);
                                }}
                              >
                                <Square className="w-4 h-4" />
                              </Button>
                            )}
                            {execution.status === 'failed' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRetryExecution(execution.id);
                                }}
                              >
                                <RotateCcw className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {execution.status === 'running' && (
                        <div className="mt-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span>Progress</span>
                            <span>{execution.metrics.nodesExecuted}/{execution.metrics.totalNodes} nodes</span>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full transition-all duration-300"
                              style={{
                                width: `${(execution.metrics.nodesExecuted / execution.metrics.totalNodes) * 100}%`
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </TabsContent>

        <TabsContent value="details">
          {selectedExecution && (
            <ExecutionDetails execution={selectedExecution} />
          )}
        </TabsContent>

        <TabsContent value="logs">
          {selectedExecution && (
            <ExecutionLogs executionId={selectedExecution.id} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}