import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ApiKey } from '@/lib/api-gateway-api';
import { Key, Eye, EyeOff, Copy } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { format } from 'date-fns';

interface ApiKeyManagerProps {
  apiKeys: ApiKey[];
  onCreateApiKey: (data: Omit<ApiKey, 'id' | 'key' | 'createdAt' | 'updatedAt' | 'userId' | 'lastUsedAt' | 'usageCount'>) => Promise<void>;
  onUpdateApiKey: (id: string, data: Partial<ApiKey>) => Promise<void>;
  onDeleteApiKey: (id: string) => Promise<void>;
}

export function ApiKeyManager({ apiKeys }: ApiKeyManagerProps) {
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

  const toggleKeyVisibility = (keyId: string) => {
    setVisibleKeys((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(keyId)) {
        newSet.delete(keyId);
      } else {
        newSet.add(keyId);
      }
      return newSet;
    });
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast('API key copied to clipboard');
  };

  const maskKey = (key: string) => {
    if (!key) return '';
    return `${key.substring(0, 8)}${'*'.repeat(24)}${key.substring(key.length - 4)}`;
  };

  const isKeyExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-foreground">API Keys</h3>
        <p className="text-sm text-muted-foreground">Manage authentication keys for API access</p>
      </div>
      
      <div className="grid gap-4">
        {apiKeys.map((apiKey) => {
          const expired = isKeyExpired(apiKey.expiresAt);
          const isVisible = visibleKeys.has(apiKey.id);
          
          return (
            <Card key={apiKey.id} className={`glass-card ${expired ? 'opacity-60' : 'hover:border-primary/40'} transition-all`}>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{apiKey.name}</h4>
                      {expired && <Badge variant="destructive">Expired</Badge>}
                      {!apiKey.isActive && <Badge variant="outline">Inactive</Badge>}
                    </div>
                    {apiKey.description && (
                      <p className="text-sm text-muted-foreground">{apiKey.description}</p>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleKeyVisibility(apiKey.id)}
                    >
                      {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCopyKey(apiKey.key)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 p-3 bg-muted/30 rounded font-mono text-sm">
                  <Key className="w-4 h-4 text-muted-foreground" />
                  <code className="flex-1 truncate">
                    {isVisible ? apiKey.key : maskKey(apiKey.key)}
                  </code>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Usage</div>
                    <div className="font-semibold">{apiKey.usageCount.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Rate Limit</div>
                    <div className="font-semibold">{apiKey.rateLimit.requests}/{apiKey.rateLimit.windowMs/1000}s</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Last Used</div>
                    <div className="font-semibold">
                      {apiKey.lastUsedAt ? format(new Date(apiKey.lastUsedAt), 'MMM d, HH:mm') : 'Never'}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Expires</div>
                    <div className={`font-semibold ${expired ? 'text-destructive' : ''}`}>
                      {apiKey.expiresAt ? format(new Date(apiKey.expiresAt), 'MMM d, yyyy') : 'Never'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        
        {apiKeys.length === 0 && (
          <Card className="glass-card">
            <CardContent className="py-12 text-center">
              <Key className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No API keys yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first API key to authenticate requests
              </p>
              <Button disabled>Coming Soon</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
