import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { workflowExecutionApi, ExecutionLog } from '@/lib/workflow-api';
import { useToast } from '@/hooks/use-toast';
import { Search, Filter, RefreshCw, Info, AlertTriangle, XCircle, Bug } from 'lucide-react';

interface ExecutionLogsProps {
  executionId: string;
}

export function ExecutionLogs({ executionId }: ExecutionLogsProps) {
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    loadLogs();
    const interval = setInterval(loadLogs, 3000); // Refresh every 3 seconds
    return () => clearInterval(interval);
  }, [executionId]);

  const loadLogs = async () => {
    try {
      const response = await workflowExecutionApi.getExecutionLogs(executionId, { limit: 100 });
      setLogs(response.data.logs);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load execution logs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (log.nodeId && log.nodeId.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesLevel = levelFilter === 'all' || log.level === levelFilter;
    return matchesSearch && matchesLevel;
  });

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'info':
        return <Info className="w-4 h-4 text-blue-500" />;
      case 'warn':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'debug':
        return <Bug className="w-4 h-4 text-gray-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getLevelVariant = (level: string) => {
    switch (level) {
      case 'info':
        return 'default';
      case 'warn':
        return 'secondary';
      case 'error':
        return 'destructive';
      case 'debug':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'info':
        return 'border-l-blue-500';
      case 'warn':
        return 'border-l-yellow-500';
      case 'error':
        return 'border-l-red-500';
      case 'debug':
        return 'border-l-gray-500';
      default:
        return 'border-l-gray-300';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Execution Logs</h2>
        <Button variant="outline" size="sm" onClick={loadLogs} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="px-3 py-2 border rounded-md bg-background"
          >
            <option value="all">All Levels</option>
            <option value="info">Info</option>
            <option value="warn">Warning</option>
            <option value="error">Error</option>
            <option value="debug">Debug</option>
          </select>
        </div>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Logs ({filteredLogs.length})</span>
            <div className="flex gap-2">
              <Badge variant="outline">
                {logs.filter(l => l.level === 'error').length} errors
              </Badge>
              <Badge variant="outline">
                {logs.filter(l => l.level === 'warn').length} warnings
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            <AnimatePresence>
              {filteredLogs.map((log, index) => (
                <motion.div
                  key={log.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.02 }}
                  className={`border-l-4 ${getLevelColor(log.level)} bg-background p-3 rounded-r-lg`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {getLevelIcon(log.level)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-mono break-words">{log.message}</p>
                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                          <details className="mt-2">
                            <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                              View metadata
                            </summary>
                            <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-x-auto">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground whitespace-nowrap">
                      <Badge variant={getLevelVariant(log.level)} className="text-xs">
                        {log.level}
                      </Badge>
                      <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                  {log.nodeId && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Node: {log.nodeId}
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            
            {filteredLogs.length === 0 && !loading && (
              <div className="text-center py-8 text-muted-foreground">
                <Bug className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No logs found matching the current filters</p>
              </div>
            )}
            
            {loading && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}