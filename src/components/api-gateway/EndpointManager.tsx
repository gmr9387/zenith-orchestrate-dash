import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ApiEndpoint } from '@/lib/api-gateway-api';
import { Globe, Lock, Unlock } from 'lucide-react';

interface EndpointManagerProps {
  endpoints: ApiEndpoint[];
  onCreateEndpoint: (data: Omit<ApiEndpoint, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<void>;
  onUpdateEndpoint: (id: string, data: Partial<ApiEndpoint>) => Promise<void>;
  onDeleteEndpoint: (id: string) => Promise<void>;
}

export function EndpointManager({ endpoints }: EndpointManagerProps) {
  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'text-green-500 border-green-500';
      case 'POST': return 'text-blue-500 border-blue-500';
      case 'PUT': return 'text-yellow-500 border-yellow-500';
      case 'DELETE': return 'text-red-500 border-red-500';
      case 'PATCH': return 'text-purple-500 border-purple-500';
      default: return 'text-muted-foreground border-muted';
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-foreground">API Endpoints</h3>
        <p className="text-sm text-muted-foreground">Manage your API endpoints and routes</p>
      </div>
      
      <div className="grid gap-4">
        {endpoints.map((endpoint) => (
          <Card key={endpoint.id} className="glass-card hover:border-primary/40 transition-all">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={getMethodColor(endpoint.method)}>
                      {endpoint.method}
                    </Badge>
                    <code className="text-sm font-mono text-foreground">{endpoint.path}</code>
                    {endpoint.authentication.type === 'none' ? (
                      <Unlock className="w-4 h-4 text-green-500" />
                    ) : (
                      <Lock className="w-4 h-4 text-yellow-500" />
                    )}
                  </div>
                  <h4 className="font-semibold">{endpoint.name}</h4>
                  {endpoint.description && (
                    <p className="text-sm text-muted-foreground">{endpoint.description}</p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Target</div>
                  <div className="font-mono text-xs truncate" title={endpoint.targetUrl}>
                    {endpoint.targetUrl}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Rate Limit</div>
                  <div className="font-semibold">{endpoint.rateLimit.requests}/{endpoint.rateLimit.windowMs/1000}s</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Status</div>
                  <Badge variant={endpoint.isActive ? 'default' : 'outline'}>
                    {endpoint.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {endpoints.length === 0 && (
          <Card className="glass-card">
            <CardContent className="py-12 text-center">
              <Globe className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No endpoints yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first API endpoint to get started
              </p>
              <Button disabled>Coming Soon</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
