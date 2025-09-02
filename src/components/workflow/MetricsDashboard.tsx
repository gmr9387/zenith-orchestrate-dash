import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WorkflowMetrics } from '@/lib/workflow-api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Activity, Clock, TrendingUp, AlertCircle, CheckCircle, Users } from 'lucide-react';

interface MetricsDashboardProps {
  metrics: WorkflowMetrics;
}

export function MetricsDashboard({ metrics }: MetricsDashboardProps) {
  const successRate = metrics.totalExecutions > 0 
    ? (metrics.successfulExecutions / metrics.totalExecutions * 100).toFixed(1)
    : '0';

  const failureRate = metrics.totalExecutions > 0 
    ? (metrics.failedExecutions / metrics.totalExecutions * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Total Executions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalExecutions.toLocaleString()}</div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                Active: {metrics.activeExecutions}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                Queued: {metrics.queuedExecutions}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{successRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.successfulExecutions.toLocaleString()} successful
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              Failure Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{failureRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.failedExecutions.toLocaleString()} failed
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Avg. Execution Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(metrics.averageExecutionTime / 1000).toFixed(2)}s
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              CPU: {(metrics.totalCpuTime / 1000).toFixed(1)}s
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Executions Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics.executionsOverTime}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="date" 
                  fontSize={12}
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <YAxis fontSize={12} />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  formatter={(value: number, name: string) => [
                    value,
                    name === 'count' ? 'Executions' : 'Success Rate (%)'
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 3 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="successRate" 
                  stroke="hsl(var(--chart-2))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--chart-2))', strokeWidth: 2, r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Top Workflows
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metrics.topWorkflows} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis type="number" fontSize={12} />
                <YAxis 
                  type="category" 
                  dataKey="workflowName" 
                  fontSize={12}
                  width={100}
                  tickFormatter={(value) => value.length > 15 ? value.slice(0, 15) + '...' : value}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    value,
                    name === 'executions' ? 'Executions' : 'Success Rate (%)'
                  ]}
                />
                <Bar 
                  dataKey="executions" 
                  fill="hsl(var(--primary))" 
                  radius={[0, 2, 2, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Workflow Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Workflow</th>
                  <th className="text-right py-2">Executions</th>
                  <th className="text-right py-2">Success Rate</th>
                  <th className="text-right py-2">Avg. Duration</th>
                </tr>
              </thead>
              <tbody>
                {metrics.topWorkflows.map((workflow, index) => (
                  <tr key={workflow.workflowId} className="border-b last:border-b-0">
                    <td className="py-2 font-medium">{workflow.workflowName}</td>
                    <td className="text-right py-2">{workflow.executions.toLocaleString()}</td>
                    <td className="text-right py-2">
                      <Badge variant={workflow.successRate >= 90 ? 'default' : 
                                    workflow.successRate >= 70 ? 'secondary' : 'destructive'}>
                        {workflow.successRate.toFixed(1)}%
                      </Badge>
                    </td>
                    <td className="text-right py-2 text-muted-foreground">
                      {/* Note: Average duration not available in current metrics */}
                      N/A
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}