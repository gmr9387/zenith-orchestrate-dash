import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { WorkflowExecution } from '@/lib/workflow-api';
import { Clock, Cpu, MemoryStick, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface ExecutionDetailsProps {
  execution: WorkflowExecution;
}

export function ExecutionDetails({ execution }: ExecutionDetailsProps) {
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
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const progressPercentage = (execution.metrics.nodesExecuted / execution.metrics.totalNodes) * 100;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Duration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {execution.duration ? `${(execution.duration / 1000).toFixed(2)}s` : 'Running...'}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Cpu className="w-4 h-4" />
              CPU Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(execution.metrics.cpuTime / 1000).toFixed(2)}s
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <MemoryStick className="w-4 h-4" />
              Memory Used
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(execution.metrics.memoryUsed / 1024 / 1024).toFixed(1)}MB
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">
              {execution.metrics.nodesExecuted}/{execution.metrics.totalNodes}
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Execution Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Status:</span>
              <div className="flex items-center gap-2">
                {getStatusIcon(execution.status)}
                <Badge variant={execution.status === 'completed' ? 'default' : 
                              execution.status === 'failed' ? 'destructive' : 'secondary'}>
                  {execution.status}
                </Badge>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Workflow:</span>
              <span className="font-medium">{execution.workflow.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Started:</span>
              <span>{new Date(execution.startedAt).toLocaleString()}</span>
            </div>
            {execution.completedAt && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Completed:</span>
                <span>{new Date(execution.completedAt).toLocaleString()}</span>
              </div>
            )}
            {execution.error && (
              <div className="border-l-4 border-red-500 pl-4 py-2 bg-red-50 dark:bg-red-900/20">
                <p className="text-sm font-medium text-red-800 dark:text-red-200">Error:</p>
                <p className="text-sm text-red-600 dark:text-red-300">{execution.error}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Trigger Data</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
              {JSON.stringify(execution.triggerData, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Node Executions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {execution.nodeExecutions
              .sort((a, b) => a.executionOrder - b.executionOrder)
              .map((node, index) => (
                <motion.div
                  key={node.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="border rounded-lg p-4 bg-background"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                        {node.executionOrder}
                      </div>
                      <div>
                        <h4 className="font-medium">{node.nodeName}</h4>
                        <p className="text-xs text-muted-foreground">{node.nodeType}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(node.status)}
                      <Badge variant={node.status === 'completed' ? 'default' : 
                                    node.status === 'failed' ? 'destructive' : 'secondary'}>
                        {node.status}
                      </Badge>
                      {node.duration && (
                        <span className="text-xs text-muted-foreground">
                          {(node.duration / 1000).toFixed(2)}s
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {node.error && (
                    <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs">
                      <span className="font-medium text-red-800 dark:text-red-200">Error: </span>
                      <span className="text-red-600 dark:text-red-300">{node.error}</span>
                    </div>
                  )}
                  
                  {node.retryCount > 0 && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Retries: {node.retryCount}
                    </div>
                  )}
                </motion.div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}