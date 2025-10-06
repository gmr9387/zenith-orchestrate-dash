import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiGatewayApi, ApiEndpoint, ApiKey, ApiAnalytics } from '@/lib/api-gateway-api';
import { useToast } from '@/hooks/use-toast';
import { EndpointManager } from './EndpointManager';
import { ApiKeyManager } from './ApiKeyManager';
import { RequestLogs } from './RequestLogs';
import { GatewayAnalytics } from './GatewayAnalytics';
import { 
  Plus, 
  Search, 
  Activity, 
  Key, 
  Globe, 
  BarChart3,
  RefreshCw
} from 'lucide-react';

export function ApiGateway() {
  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [analytics, setAnalytics] = useState<ApiAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadData();
    const interval = setInterval(loadAnalytics, 30000); // Refresh analytics every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [endpointsRes, keysRes, analyticsRes] = await Promise.all([
        apiGatewayApi.getEndpoints(),
        apiGatewayApi.getApiKeys(),
        apiGatewayApi.getAnalytics()
      ]);
      setEndpoints(endpointsRes.data.endpoints);
      setApiKeys(keysRes.data.keys);
      setAnalytics(analyticsRes.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load API Gateway data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const analyticsRes = await apiGatewayApi.getAnalytics();
      setAnalytics(analyticsRes.data);
    } catch (error) {
      // Silent error for background refresh
    }
  };

  const handleCreateEndpoint = async (data: Omit<ApiEndpoint, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    try {
      const newEndpoint = await apiGatewayApi.createEndpoint(data);
      setEndpoints(prev => [newEndpoint.data, ...prev]);
      toast({
        title: "Success",
        description: "Endpoint created successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create endpoint",
        variant: "destructive"
      });
    }
  };

  const handleUpdateEndpoint = async (id: string, data: Partial<ApiEndpoint>) => {
    try {
      const updatedEndpoint = await apiGatewayApi.updateEndpoint(id, data);
      setEndpoints(prev => prev.map(e => e.id === id ? updatedEndpoint.data : e));
      toast({
        title: "Success",
        description: "Endpoint updated successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update endpoint",
        variant: "destructive"
      });
    }
  };

  const handleDeleteEndpoint = async (id: string) => {
    try {
      await apiGatewayApi.deleteEndpoint(id);
      setEndpoints(prev => prev.filter(e => e.id !== id));
      toast({
        title: "Success",
        description: "Endpoint deleted successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete endpoint",
        variant: "destructive"
      });
    }
  };

  const handleCreateApiKey = async (data: Omit<ApiKey, 'id' | 'key' | 'createdAt' | 'updatedAt' | 'userId' | 'lastUsedAt' | 'usageCount'>) => {
    try {
      const newKey = await apiGatewayApi.createApiKey(data);
      setApiKeys(prev => [newKey.data, ...prev]);
      toast({
        title: "Success",
        description: "API key created successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create API key",
        variant: "destructive"
      });
    }
  };

  const handleUpdateApiKey = async (id: string, data: Partial<ApiKey>) => {
    try {
      const updatedKey = await apiGatewayApi.updateApiKey(id, data);
      setApiKeys(prev => prev.map(k => k.id === id ? updatedKey.data : k));
      toast({
        title: "Success",
        description: "API key updated successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update API key",
        variant: "destructive"
      });
    }
  };

  const handleDeleteApiKey = async (id: string) => {
    try {
      await apiGatewayApi.deleteApiKey(id);
      setApiKeys(prev => prev.filter(k => k.id !== id));
      toast({
        title: "Success",
        description: "API key deleted successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete API key",
        variant: "destructive"
      });
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
          <h1 className="text-3xl font-bold tracking-tight">API Gateway</h1>
          <p className="text-muted-foreground">Manage endpoints, keys, and monitor API traffic</p>
        </div>
        <Button onClick={loadData} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {analytics && <OverviewCards analytics={analytics} />}

      <Tabs defaultValue="endpoints" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="endpoints" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Endpoints
          </TabsTrigger>
          <TabsTrigger value="keys" className="flex items-center gap-2">
            <Key className="w-4 h-4" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Request Logs
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="endpoints">
          <EndpointManager
            endpoints={endpoints}
            onCreateEndpoint={handleCreateEndpoint}
            onUpdateEndpoint={handleUpdateEndpoint}
            onDeleteEndpoint={handleDeleteEndpoint}
          />
        </TabsContent>

        <TabsContent value="keys">
          <ApiKeyManager
            apiKeys={apiKeys}
            onCreateApiKey={handleCreateApiKey}
            onUpdateApiKey={handleUpdateApiKey}
            onDeleteApiKey={handleDeleteApiKey}
          />
        </TabsContent>

        <TabsContent value="logs">
          <RequestLogs />
        </TabsContent>

        <TabsContent value="analytics">
          <GatewayAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface OverviewCardsProps {
  analytics: ApiAnalytics;
}

function OverviewCards({ analytics }: OverviewCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Total Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analytics.totalRequests.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {analytics.requestsPerSecond.toFixed(2)} req/s
          </p>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Success Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {((1 - analytics.errorRate) * 100).toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {analytics.successfulRequests.toLocaleString()} successful
          </p>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Avg Response Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analytics.averageResponseTime.toFixed(0)}ms</div>
          <p className="text-xs text-muted-foreground mt-1">
            P95: {analytics.p95ResponseTime.toFixed(0)}ms
          </p>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Bandwidth</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {(analytics.bandwidth.outbound / 1024 / 1024).toFixed(1)}MB
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            In: {(analytics.bandwidth.inbound / 1024 / 1024).toFixed(1)}MB
          </p>
        </CardContent>
      </Card>
    </div>
  );
}