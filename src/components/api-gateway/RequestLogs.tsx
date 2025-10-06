import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiGatewayApi, ApiRequest } from '@/lib/api-gateway-api';
import { useToast } from '@/hooks/use-toast';
import { Search, Filter, Download, Eye, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

export function RequestLogs() {
  const [requests, setRequests] = useState<ApiRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { toast } = useToast();

  useEffect(() => {
    loadRequests();
  }, [page, statusFilter]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: 20 };
      if (statusFilter !== 'all') {
        params.status = parseInt(statusFilter);
      }
      
      const response = await apiGatewayApi.getRequests(params);
      setRequests(response.data.requests);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load request logs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'bg-green-500/10 text-green-600 border-green-500/20';
    if (status >= 300 && status < 400) return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
    if (status >= 400 && status < 500) return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
    return 'bg-red-500/10 text-red-600 border-red-500/20';
  };

  const filteredRequests = requests.filter(req => 
    searchTerm === '' || 
    req.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.endpoint?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Request Logs</CardTitle>
            <Button onClick={loadRequests} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="200">2xx Success</SelectItem>
                <SelectItem value="300">3xx Redirect</SelectItem>
                <SelectItem value="400">4xx Client Error</SelectItem>
                <SelectItem value="500">5xx Server Error</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No request logs found
              </div>
            ) : (
              filteredRequests.map((request) => (
                <Card key={request.id} className="hover:bg-accent/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono text-xs">
                            {request.method}
                          </Badge>
                          <code className="text-sm font-mono">{request.path}</code>
                          <Badge className={getStatusColor(request.response.status)}>
                            {request.response.status}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {request.duration}ms
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {(request.response.size / 1024).toFixed(2)} KB
                          </div>
                          {request.error && (
                            <div className="flex items-center gap-1 text-destructive">
                              <AlertCircle className="w-3 h-3" />
                              Error
                            </div>
                          )}
                        </div>

                        {request.endpoint && (
                          <div className="text-xs text-muted-foreground">
                            Endpoint: {request.endpoint.name}
                          </div>
                        )}
                      </div>

                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(request.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                        </p>
                        {request.apiKey && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Key: {request.apiKey.name}
                          </p>
                        )}
                      </div>
                    </div>

                    {request.error && (
                      <div className="mt-2 p-2 bg-destructive/10 rounded text-xs text-destructive font-mono">
                        {request.error}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <Button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                variant="outline"
                size="sm"
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                variant="outline"
                size="sm"
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
