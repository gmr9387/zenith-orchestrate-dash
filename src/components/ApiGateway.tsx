import React, { useState, useRef, useCallback } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Play, 
  Save, 
  Settings, 
  Plus, 
  Trash2, 
  Copy,
  Download,
  Upload,
  Code,
  Globe,
  Shield,
  Clock,
  BarChart3,
  Zap,
  Database,
  Webhook,
  Key,
  Eye,
  EyeOff,
  Send,
  CheckCircle,
  AlertCircle,
  Loader2,
  History,
  BookOpen,
  FileText,
  Network,
  Activity,
  Target,
  Cpu,
  Server,
  Cloud,
  Lock,
  Unlock,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  Info,
  HelpCircle,
  ExternalLink,
  Folder,
  File,
  GitBranch,
  Users,
  Star,
  Heart,
  Share2,
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
  Search,
  Filter,
  SortAsc,
  SortDesc
} from 'lucide-react';

interface ApiRequest {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
  url: string;
  headers: Record<string, string>;
  params: Record<string, string>;
  body: string;
  auth: {
    type: 'none' | 'bearer' | 'basic' | 'apiKey' | 'oauth2';
    value: string;
  };
  description: string;
  tags: string[];
  collection: string;
  createdAt: string;
  updatedAt: string;
  lastExecuted: string | null;
  executionCount: number;
  averageResponseTime: number;
  successRate: number;
}

interface ApiResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  responseTime: number;
  size: number;
  timestamp: string;
}

interface ApiCollection {
  id: string;
  name: string;
  description: string;
  requests: string[];
  environment: Record<string, string>;
  variables: Record<string, string>;
  auth: {
    type: 'none' | 'bearer' | 'basic' | 'apiKey' | 'oauth2';
    value: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface ApiEnvironment {
  id: string;
  name: string;
  variables: Record<string, string>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const ApiGateway: React.FC = () => {
  const [collections, setCollections] = useState<ApiCollection[]>([]);
  const [requests, setRequests] = useState<ApiRequest[]>([]);
  const [environments, setEnvironments] = useState<ApiEnvironment[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<ApiCollection | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<ApiRequest | null>(null);
  const [currentResponse, setCurrentResponse] = useState<ApiResponse | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEnvironmentModal, setShowEnvironmentModal] = useState(false);
  const [activeTab, setActiveTab] = useState('collections');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMethod, setFilterMethod] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  const [newRequest, setNewRequest] = useState({
    name: '',
    method: 'GET' as const,
    url: '',
    description: '',
    collection: '',
  });

  const [newCollection, setNewCollection] = useState({
    name: '',
    description: '',
  });

  const [newEnvironment, setNewEnvironment] = useState({
    name: '',
    variables: '',
  });

  // Mock data for demonstration
  React.useEffect(() => {
    const mockCollections: ApiCollection[] = [
      {
        id: '1',
        name: 'Zilliance API',
        description: 'Main API collection for Zilliance platform',
        requests: ['1', '2', '3'],
        environment: {},
        variables: {
          baseUrl: 'https://api.zilliance.com',
          apiVersion: 'v1',
        },
        auth: { type: 'bearer', value: '{{authToken}}' },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-15T10:30:00Z',
      },
      {
        id: '2',
        name: 'External Integrations',
        description: 'Third-party service integrations',
        requests: ['4', '5'],
        environment: {},
        variables: {
          stripeUrl: 'https://api.stripe.com',
          sendgridUrl: 'https://api.sendgrid.com',
        },
        auth: { type: 'apiKey', value: '{{apiKey}}' },
        createdAt: '2024-01-10T00:00:00Z',
        updatedAt: '2024-01-12T14:20:00Z',
      }
    ];

    const mockRequests: ApiRequest[] = [
      {
        id: '1',
        name: 'Get User Profile',
        method: 'GET',
        url: '{{baseUrl}}/{{apiVersion}}/users/{{userId}}',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        params: {},
        body: '',
        auth: { type: 'bearer', value: '{{authToken}}' },
        description: 'Retrieve user profile information',
        tags: ['users', 'profile', 'authentication'],
        collection: '1',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-15T10:30:00Z',
        lastExecuted: '2024-01-15T10:30:00Z',
        executionCount: 45,
        averageResponseTime: 120,
        successRate: 98.5,
      },
      {
        id: '2',
        name: 'Create Tutorial',
        method: 'POST',
        url: '{{baseUrl}}/{{apiVersion}}/tutorials',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        params: {},
        body: JSON.stringify({
          title: 'Sample Tutorial',
          description: 'This is a sample tutorial',
          category: 'technology',
          difficulty: 'beginner',
        }, null, 2),
        auth: { type: 'bearer', value: '{{authToken}}' },
        description: 'Create a new tutorial',
        tags: ['tutorials', 'create', 'content'],
        collection: '1',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-15T10:30:00Z',
        lastExecuted: '2024-01-15T09:15:00Z',
        executionCount: 23,
        averageResponseTime: 180,
        successRate: 95.7,
      },
      {
        id: '3',
        name: 'Update User Settings',
        method: 'PUT',
        url: '{{baseUrl}}/{{apiVersion}}/users/{{userId}}/settings',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        params: {},
        body: JSON.stringify({
          notifications: true,
          theme: 'dark',
          language: 'en',
        }, null, 2),
        auth: { type: 'bearer', value: '{{authToken}}' },
        description: 'Update user preferences and settings',
        tags: ['users', 'settings', 'preferences'],
        collection: '1',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-15T10:30:00Z',
        lastExecuted: '2024-01-14T16:45:00Z',
        executionCount: 12,
        averageResponseTime: 95,
        successRate: 100,
      }
    ];

    const mockEnvironments: ApiEnvironment[] = [
      {
        id: '1',
        name: 'Development',
        variables: {
          baseUrl: 'http://localhost:3001',
          apiVersion: 'v1',
          authToken: 'dev_token_123',
          userId: 'dev_user_456',
        },
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-15T10:30:00Z',
      },
      {
        id: '2',
        name: 'Staging',
        variables: {
          baseUrl: 'https://staging-api.zilliance.com',
          apiVersion: 'v1',
          authToken: 'staging_token_789',
          userId: 'staging_user_012',
        },
        isActive: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-15T10:30:00Z',
      },
      {
        id: '3',
        name: 'Production',
        variables: {
          baseUrl: 'https://api.zilliance.com',
          apiVersion: 'v1',
          authToken: 'prod_token_345',
          userId: 'prod_user_678',
        },
        isActive: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-15T10:30:00Z',
      }
    ];

    setCollections(mockCollections);
    setRequests(mockRequests);
    setEnvironments(mockEnvironments);
  }, []);

  const createCollection = () => {
    const collection: ApiCollection = {
      id: `col_${Date.now()}`,
      name: newCollection.name,
      description: newCollection.description,
      requests: [],
      environment: {},
      variables: {},
      auth: { type: 'none', value: '' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setCollections(prev => [...prev, collection]);
    setSelectedCollection(collection);
    setShowCreateModal(false);
    setNewCollection({ name: '', description: '' });
  };

  const createRequest = () => {
    const request: ApiRequest = {
      id: `req_${Date.now()}`,
      name: newRequest.name,
      method: newRequest.method,
      url: newRequest.url,
      headers: { 'Content-Type': 'application/json' },
      params: {},
      body: '',
      auth: { type: 'none', value: '' },
      description: newRequest.description,
      tags: [],
      collection: newRequest.collection,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastExecuted: null,
      executionCount: 0,
      averageResponseTime: 0,
      successRate: 100,
    };

    setRequests(prev => [...prev, request]);
    setSelectedRequest(request);
    setShowCreateModal(false);
    setNewRequest({ name: '', method: 'GET', url: '', description: '', collection: '' });
  };

  const createEnvironment = () => {
    const variables: Record<string, string> = {};
    newEnvironment.variables.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        variables[key.trim()] = value.trim();
      }
    });

    const environment: ApiEnvironment = {
      id: `env_${Date.now()}`,
      name: newEnvironment.name,
      variables,
      isActive: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setEnvironments(prev => [...prev, environment]);
    setShowEnvironmentModal(false);
    setNewEnvironment({ name: '', variables: '' });
  };

  const executeRequest = async (request: ApiRequest) => {
    setIsExecuting(true);
    setCurrentResponse(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

      const response: ApiResponse = {
        status: Math.random() > 0.1 ? 200 : 400,
        statusText: Math.random() > 0.1 ? 'OK' : 'Bad Request',
        headers: {
          'Content-Type': 'application/json',
          'X-Rate-Limit-Remaining': '999',
          'X-Response-Time': '120ms',
        },
        body: JSON.stringify({
          success: Math.random() > 0.1,
          data: Math.random() > 0.1 ? {
            id: 'sample_id',
            message: 'Request processed successfully',
            timestamp: new Date().toISOString(),
          } : {
            error: 'Invalid request parameters',
            code: 'VALIDATION_ERROR',
          }
        }, null, 2),
        responseTime: 120 + Math.random() * 100,
        size: 150 + Math.random() * 200,
        timestamp: new Date().toISOString(),
      };

      setCurrentResponse(response);

      // Update request stats
      setRequests(prev => prev.map(r => 
        r.id === request.id ? {
          ...r,
          lastExecuted: new Date().toISOString(),
          executionCount: r.executionCount + 1,
          averageResponseTime: (r.averageResponseTime + response.responseTime) / 2,
          successRate: r.successRate * 0.9 + (response.status < 400 ? 10 : 0),
        } : r
      ));

    } catch (error) {
      setCurrentResponse({
        status: 500,
        statusText: 'Internal Server Error',
        headers: {},
        body: JSON.stringify({ error: 'Request failed' }, null, 2),
        responseTime: 0,
        size: 0,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-green-100 text-green-800';
      case 'POST': return 'bg-blue-100 text-blue-800';
      case 'PUT': return 'bg-orange-100 text-orange-800';
      case 'DELETE': return 'bg-red-100 text-red-800';
      case 'PATCH': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-green-600';
    if (status >= 400 && status < 500) return 'text-orange-600';
    if (status >= 500) return 'text-red-600';
    return 'text-gray-600';
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         request.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         request.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesMethod = !filterMethod || request.method === filterMethod;
    return matchesSearch && matchesMethod;
  });

  const sortedRequests = [...filteredRequests].sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'method':
        comparison = a.method.localeCompare(b.method);
        break;
      case 'executionCount':
        comparison = a.executionCount - b.executionCount;
        break;
      case 'lastExecuted':
        comparison = (a.lastExecuted || '').localeCompare(b.lastExecuted || '');
        break;
      default:
        comparison = 0;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">API Gateway</h1>
          <p className="text-muted-foreground">
            Professional API testing, documentation, and management platform
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setShowEnvironmentModal(true)}>
            <Settings className="mr-2 h-4 w-4" />
            Environments
          </Button>
          
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Request
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Code className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{requests.length}</div>
            <p className="text-xs text-muted-foreground">
              Across {collections.length} collections
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {requests.reduce((sum, r) => sum + r.executionCount, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              API calls made
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {requests.length > 0 
                ? Math.round(requests.reduce((sum, r) => sum + r.successRate, 0) / requests.length)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Average across requests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {requests.length > 0 
                ? Math.round(requests.reduce((sum, r) => sum + r.averageResponseTime, 0) / requests.length)
                : 0}ms
            </div>
            <p className="text-xs text-muted-foreground">
              Average response time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>API Explorer</CardTitle>
              <CardDescription>
                Navigate your API collections and requests
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="collections">Collections</TabsTrigger>
                  <TabsTrigger value="environments">Environments</TabsTrigger>
                </TabsList>
                
                <TabsContent value="collections" className="space-y-3">
                  {collections.map(collection => (
                    <div
                      key={collection.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                        selectedCollection?.id === collection.id 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedCollection(collection)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-sm">{collection.name}</h3>
                        <Badge variant="secondary" className="text-xs">
                          {collection.requests.length}
                        </Badge>
                      </div>
                      
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {collection.description}
                      </p>
                    </div>
                  ))}
                </TabsContent>
                
                <TabsContent value="environments" className="space-y-3">
                  {environments.map(env => (
                    <div
                      key={env.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                        env.isActive 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-sm">{env.name}</h3>
                        {env.isActive && (
                          <Badge variant="default" className="text-xs">
                            Active
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-xs text-muted-foreground">
                        {Object.keys(env.variables).length} variables
                      </p>
                    </div>
                  ))}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    {selectedCollection ? selectedCollection.name : 'API Requests'}
                  </CardTitle>
                  <CardDescription>
                    {selectedCollection ? selectedCollection.description : 'Manage and execute API requests'}
                  </CardDescription>
                </div>
                
                {selectedCollection && (
                  <Button onClick={() => setShowCreateModal(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Request
                  </Button>
                )}
              </div>
            </CardHeader>
            
            <CardContent>
              {/* Search and Filters */}
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search requests..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={filterMethod} onValueChange={setFilterMethod}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="All methods" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All methods</SelectItem>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                    <SelectItem value="PATCH">PATCH</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="method">Method</SelectItem>
                    <SelectItem value="executionCount">Executions</SelectItem>
                    <SelectItem value="lastExecuted">Last Executed</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                >
                  {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                </Button>
              </div>
              
              {/* Requests List */}
              <div className="space-y-3">
                {sortedRequests.map(request => (
                  <div
                    key={request.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                      selectedRequest?.id === request.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedRequest(request)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Badge className={getMethodColor(request.method)}>
                          {request.method}
                        </Badge>
                        <h3 className="font-medium">{request.name}</h3>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            executeRequest(request);
                          }}
                          disabled={isExecuting}
                        >
                          {isExecuting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                          Execute
                        </Button>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {request.description}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{request.url}</span>
                      <span>•</span>
                      <span>{request.executionCount} executions</span>
                      <span>•</span>
                      <span>{request.averageResponseTime}ms avg</span>
                      <span>•</span>
                      <span>{request.successRate.toFixed(1)}% success</span>
                    </div>
                    
                    {request.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {request.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Request Details Panel */}
      {selectedRequest && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-3">
                  <Badge className={getMethodColor(selectedRequest.method)}>
                    {selectedRequest.method}
                  </Badge>
                  {selectedRequest.name}
                </CardTitle>
                <CardDescription>{selectedRequest.description}</CardDescription>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => executeRequest(selectedRequest)}
                  disabled={isExecuting}
                >
                  {isExecuting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Executing...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Execute Request
                    </>
                  )}
                </Button>
                
                <Button variant="outline">
                  <Save className="mr-2 h-4 w-4" />
                  Save
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <Tabs defaultValue="request" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="request">Request</TabsTrigger>
                <TabsTrigger value="response">Response</TabsTrigger>
                <TabsTrigger value="headers">Headers</TabsTrigger>
                <TabsTrigger value="tests">Tests</TabsTrigger>
              </TabsList>
              
              <TabsContent value="request" className="space-y-4">
                <div>
                  <Label htmlFor="url">URL</Label>
                  <Input
                    id="url"
                    value={selectedRequest.url}
                    onChange={(e) => setSelectedRequest(prev => 
                      prev ? { ...prev, url: e.target.value } : null
                    )}
                    placeholder="Enter API endpoint URL"
                  />
                </div>
                
                <div>
                  <Label htmlFor="body">Request Body</Label>
                  <Textarea
                    id="body"
                    value={selectedRequest.body}
                    onChange={(e) => setSelectedRequest(prev => 
                      prev ? { ...prev, body: e.target.value } : null
                    )}
                    placeholder="Enter request body (JSON, XML, etc.)"
                    rows={8}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="response" className="space-y-4">
                {currentResponse ? (
                  <>
                    <div className="flex items-center gap-4 mb-4">
                      <Badge className={getStatusColor(currentResponse.status)}>
                        {currentResponse.status} {currentResponse.statusText}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {currentResponse.responseTime}ms • {currentResponse.size} bytes
                      </span>
                    </div>
                    
                    <div>
                      <Label>Response Body</Label>
                      <div className="mt-2 p-4 bg-muted rounded-lg">
                        <pre className="text-sm overflow-x-auto">
                          {currentResponse.body}
                        </pre>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Send className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No response yet</p>
                    <p className="text-sm">Execute the request to see the response</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="headers" className="space-y-4">
                <div>
                  <Label>Request Headers</Label>
                  <div className="mt-2 space-y-2">
                    {Object.entries(selectedRequest.headers).map(([key, value]) => (
                      <div key={key} className="flex gap-2">
                        <Input
                          value={key}
                          placeholder="Header name"
                          className="w-1/3"
                        />
                        <Input
                          value={value}
                          placeholder="Header value"
                          className="flex-1"
                        />
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Header
                    </Button>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="tests" className="space-y-4">
                <div>
                  <Label>Test Scripts</Label>
                  <Textarea
                    placeholder="Write test scripts to validate responses..."
                    rows={8}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Create Request Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create New Request</h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="request-name">Name</Label>
                <Input
                  id="request-name"
                  value={newRequest.name}
                  onChange={(e) => setNewRequest(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter request name"
                />
              </div>
              
              <div>
                <Label htmlFor="request-method">Method</Label>
                <Select
                  value={newRequest.method}
                  onValueChange={(value: any) => setNewRequest(prev => ({ ...prev, method: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                    <SelectItem value="PATCH">PATCH</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="request-url">URL</Label>
                <Input
                  id="request-url"
                  value={newRequest.url}
                  onChange={(e) => setNewRequest(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="Enter API endpoint URL"
                />
              </div>
              
              <div>
                <Label htmlFor="request-description">Description</Label>
                <Textarea
                  id="request-description"
                  value={newRequest.description}
                  onChange={(e) => setNewRequest(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this request does"
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="request-collection">Collection</Label>
                <Select
                  value={newRequest.collection}
                  onValueChange={(value) => setNewRequest(prev => ({ ...prev, collection: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select collection" />
                  </SelectTrigger>
                  <SelectContent>
                    {collections.map(collection => (
                      <SelectItem key={collection.id} value={collection.id}>
                        {collection.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button 
                onClick={createRequest}
                disabled={!newRequest.name.trim() || !newRequest.url.trim() || !newRequest.collection}
              >
                Create Request
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Environment Modal */}
      {showEnvironmentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create Environment</h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="env-name">Name</Label>
                <Input
                  id="env-name"
                  value={newEnvironment.name}
                  onChange={(e) => setNewEnvironment(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Development, Staging, Production"
                />
              </div>
              
              <div>
                <Label htmlFor="env-variables">Variables (key=value format)</Label>
                <Textarea
                  id="env-variables"
                  value={newEnvironment.variables}
                  onChange={(e) => setNewEnvironment(prev => ({ ...prev, variables: e.target.value }))}
                  placeholder="baseUrl=https://api.example.com&#10;apiKey=your_api_key_here&#10;authToken=your_auth_token"
                  rows={6}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter variables in key=value format, one per line
                </p>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowEnvironmentModal(false)}>
                Cancel
              </Button>
              <Button 
                onClick={createEnvironment}
                disabled={!newEnvironment.name.trim()}
              >
                Create Environment
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiGateway;