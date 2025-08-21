import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  Play, 
  Pause, 
  Trash2, 
  Plus, 
  Settings, 
  Zap, 
  Database, 
  Webhook, 
  Mail, 
  MessageSquare,
  Calendar,
  FileText,
  CreditCard,
  Users,
  BarChart3,
  Globe,
  Shield,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Workflow,
  Bot,
  Cpu,
  Network
} from 'lucide-react';
import { hasBackend, apiGet, apiPost, apiPut, apiDelete } from '../lib/api';

interface WorkflowNode {
  id: string;
  type: 'trigger' | 'action' | 'condition' | 'delay' | 'webhook';
  name: string;
  description: string;
  position: { x: number; y: number };
  config: any;
  connections: string[];
  status: 'idle' | 'running' | 'success' | 'error' | 'disabled';
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  isActive: boolean;
  lastRun: string | null;
  runCount: number;
  successRate: number;
  createdAt: string;
  updatedAt: string;
}

const WorkflowEngine: React.FC = () => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWorkflow, setNewWorkflow] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    (async () => {
      try {
        if (!hasBackend()) return;
        const list = await apiGet<Workflow[]>('/api/workflows');
        setWorkflows(list);
        if (list.length && !selectedWorkflow) setSelectedWorkflow(list[0]);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Failed to load workflows', e);
      }
    })();
  }, []);

  // Available triggers
  const availableTriggers = [
    {
      id: 'webhook',
      name: 'Webhook',
      icon: Webhook,
      description: 'Trigger workflow when a webhook is received',
      category: 'Integration'
    },
    {
      id: 'email',
      name: 'Email Received',
      icon: Mail,
      description: 'Trigger when new email arrives',
      category: 'Communication'
    },
    {
      id: 'form_submit',
      name: 'Form Submission',
      icon: FileText,
      description: 'Trigger on form submission',
      category: 'Data Collection'
    },
    {
      id: 'database_change',
      name: 'Database Change',
      icon: Database,
      description: 'Trigger on database record changes',
      category: 'Data'
    },
    {
      id: 'schedule',
      name: 'Scheduled',
      icon: Calendar,
      description: 'Trigger on schedule (cron)',
      category: 'Time'
    },
    {
      id: 'payment',
      name: 'Payment Received',
      icon: CreditCard,
      description: 'Trigger on successful payment',
      category: 'Finance'
    }
  ];

  // Available actions
  const availableActions = [
    {
      id: 'send_email',
      name: 'Send Email',
      icon: Mail,
      description: 'Send automated emails',
      category: 'Communication'
    },
    {
      id: 'create_record',
      name: 'Create Record',
      icon: Database,
      description: 'Create new database record',
      category: 'Data'
    },
    {
      id: 'update_record',
      name: 'Update Record',
      icon: Database,
      description: 'Update existing record',
      category: 'Data'
    },
    {
      id: 'send_sms',
      name: 'Send SMS',
      icon: MessageSquare,
      description: 'Send text messages',
      category: 'Communication'
    },
    {
      id: 'webhook_call',
      name: 'Call Webhook',
      icon: Webhook,
      description: 'Make HTTP request to external service',
      category: 'Integration'
    },
    {
      id: 'delay',
      name: 'Delay',
      icon: Clock,
      description: 'Wait for specified time',
      category: 'Control'
    },
    {
      id: 'condition',
      name: 'Condition',
      icon: Cpu,
      description: 'Execute different paths based on conditions',
      category: 'Control'
    }
  ];

  const createWorkflow = async () => {
    const wf: Workflow = {
      id: `wf_${Date.now()}`,
      name: newWorkflow.name,
      description: newWorkflow.description,
      nodes: [],
      isActive: false,
      lastRun: null,
      runCount: 0,
      successRate: 100,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      if (hasBackend()) {
        const created = await apiPost<Workflow>('/api/workflows', { name: wf.name, description: wf.description });
        setWorkflows(prev => [created, ...prev]);
        setSelectedWorkflow(created);
      } else {
        setWorkflows(prev => [wf, ...prev]);
        setSelectedWorkflow(wf);
      }
      setShowCreateModal(false);
      setNewWorkflow({ name: '', description: '' });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Failed to create workflow', e);
    }
  };

  const persistWorkflow = async (workflow: Workflow) => {
    try {
      if (!hasBackend()) return;
      const updated = await apiPut<Workflow>(`/api/workflows/${workflow.id}`, {
        name: workflow.name,
        description: workflow.description,
        isActive: workflow.isActive,
        nodes: workflow.nodes,
        lastRun: workflow.lastRun,
        runCount: workflow.runCount,
        successRate: workflow.successRate,
      });
      setWorkflows(prev => prev.map(w => w.id === workflow.id ? updated : w));
      if (selectedWorkflow?.id === workflow.id) setSelectedWorkflow(updated);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Failed to persist workflow', e);
    }
  };

  const addNode = async (workflowId: string, nodeType: WorkflowNode['type'], position: { x: number; y: number }) => {
    const workflow = workflows.find(w => w.id === workflowId);
    if (!workflow) return;

    const node: WorkflowNode = {
      id: `node_${Date.now()}`,
      type: nodeType,
      name: `${nodeType.charAt(0).toUpperCase() + nodeType.slice(1)} ${workflow.nodes.length + 1}`,
      description: `Automated ${nodeType} step`,
      position,
      config: {},
      connections: [],
      status: 'idle',
    };

    const updatedWorkflow = {
      ...workflow,
      nodes: [...workflow.nodes, node],
      updatedAt: new Date().toISOString(),
    };

    setWorkflows(prev => prev.map(w => w.id === workflowId ? updatedWorkflow : w));
    setSelectedWorkflow(updatedWorkflow);
    await persistWorkflow(updatedWorkflow);
  };

  const toggleWorkflow = async (workflowId: string) => {
    const workflow = workflows.find(w => w.id === workflowId);
    if (!workflow) return;
    const updated = { ...workflow, isActive: !workflow.isActive, updatedAt: new Date().toISOString() };
    setWorkflows(prev => prev.map(w => w.id === workflowId ? updated : w));
    if (selectedWorkflow?.id === workflowId) setSelectedWorkflow(updated);
    await persistWorkflow(updated);
  };

  const deleteWorkflow = async (workflowId: string) => {
    if (!confirm('Are you sure you want to delete this workflow? This action cannot be undone.')) return;
    try {
      if (hasBackend()) {
        await apiDelete(`/api/workflows/${workflowId}`);
      }
      setWorkflows(prev => prev.filter(w => w.id !== workflowId));
      if (selectedWorkflow?.id === workflowId) {
        setSelectedWorkflow(null);
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Failed to delete workflow', e);
    }
  };

  const getNodeIcon = (type: WorkflowNode['type']) => {
    switch (type) {
      case 'trigger': return Zap;
      case 'action': return Cpu;
      case 'condition': return Cpu;
      case 'delay': return Clock;
      case 'webhook': return Webhook;
      default: return Cpu;
    }
  };

  const getStatusColor = (status: WorkflowNode['status']) => {
    switch (status) {
      case 'success': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      case 'running': return 'bg-blue-500';
      case 'disabled': return 'bg-gray-400';
      default: return 'bg-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Workflow Engine</h1>
          <p className="text-muted-foreground">
            Build powerful automation workflows that connect your apps and services
          </p>
        </div>
        
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Workflow
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Workflows</CardTitle>
            <Workflow className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workflows.length}</div>
            <p className="text-xs text-muted-foreground">
              {workflows.filter(w => w.isActive).length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Runs</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workflows.reduce((sum, w) => sum + w.runCount, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              This month
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
              {workflows.length > 0 
                ? Math.round(workflows.reduce((sum, w) => sum + w.successRate, 0) / workflows.length)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Average across workflows
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Integrations</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">
              Connected services
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Workflows List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Workflows</CardTitle>
              <CardDescription>
                Manage your automation workflows
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {workflows.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Workflow className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No workflows yet</p>
                  <p className="text-sm">Create your first workflow to get started</p>
                </div>
              ) : (
                workflows.map(workflow => (
                  <div
                    key={workflow.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                      selectedWorkflow?.id === workflow.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedWorkflow(workflow)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-sm">{workflow.name}</h3>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={workflow.isActive ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {workflow.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleWorkflow(workflow.id);
                          }}
                        >
                          {workflow.isActive ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                        </Button>
                      </div>
                    </div>
                    
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                      {workflow.description}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{workflow.nodes.length} steps</span>
                      <span>{workflow.runCount} runs</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Workflow Builder */}
        <div className="lg:col-span-2">
          {selectedWorkflow ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{selectedWorkflow.name}</CardTitle>
                    <CardDescription>{selectedWorkflow.description}</CardDescription>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant={selectedWorkflow.isActive ? 'outline' : 'default'}
                      size="sm"
                      onClick={() => toggleWorkflow(selectedWorkflow.id)}
                    >
                      {selectedWorkflow.isActive ? (
                        <>
                          <Pause className="mr-2 h-4 w-4" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="mr-2 h-4 w-4" />
                          Activate
                        </>
                      )}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(!isEditing)}
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      {isEditing ? 'Done' : 'Edit'}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteWorkflow(selectedWorkflow.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                {/* Workflow Canvas */}
                <div className="relative min-h-[400px] bg-muted/20 border border-dashed border-muted-foreground/30 rounded-lg p-4">
                  {selectedWorkflow.nodes.length === 0 ? (
                    <div className="text-center py-16">
                      <Bot className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">Build Your Workflow</h3>
                      <p className="text-muted-foreground mb-4">
                        Start by adding a trigger, then connect actions to automate your processes
                      </p>
                      
                      {isEditing && (
                        <div className="space-y-3">
                          <div>
                            <Label className="text-sm font-medium mb-2 block">Add Trigger</Label>
                            <div className="grid grid-cols-2 gap-2">
                              {availableTriggers.slice(0, 4).map(trigger => (
                                <Button
                                  key={trigger.id}
                                  variant="outline"
                                  size="sm"
                                  className="justify-start"
                                  onClick={() => addNode(selectedWorkflow.id, 'trigger', { x: 100, y: 100 })}
                                >
                                  <trigger.icon className="mr-2 h-4 w-4" />
                                  {trigger.name}
                                </Button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="relative">
                      {selectedWorkflow.nodes.map((node, index) => {
                        const Icon = getNodeIcon(node.type);
                        return (
                          <div
                            key={node.id}
                            className="absolute"
                            style={{ left: node.position.x, top: node.position.y }}
                          >
                            <div className="flex items-center gap-2">
                              <div className="relative">
                                <div className={`w-3 h-3 rounded-full ${getStatusColor(node.status)} absolute -top-1 -right-1`} />
                                <div className="w-12 h-12 bg-background border-2 border-border rounded-lg flex items-center justify-center hover:border-primary transition-colors cursor-pointer">
                                  <Icon className="h-6 w-6 text-muted-foreground" />
                                </div>
                              </div>
                              
                              {index < selectedWorkflow.nodes.length - 1 && (
                                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                            
                            <div className="mt-2 text-center">
                              <p className="text-xs font-medium">{node.name}</p>
                              <p className="text-xs text-muted-foreground">{node.type}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Workflow Stats */}
                {selectedWorkflow.nodes.length > 0 && (
                  <div className="mt-6 grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                      <div className="text-2xl font-bold">{selectedWorkflow.runCount}</div>
                      <div className="text-xs text-muted-foreground">Total Runs</div>
                    </div>
                    
                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                      <div className="text-2xl font-bold">{selectedWorkflow.successRate}%</div>
                      <div className="text-xs text-muted-foreground">Success Rate</div>
                    </div>
                    
                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                      <div className="text-2xl font-bold">
                        {selectedWorkflow.lastRun 
                          ? new Date(selectedWorkflow.lastRun).toLocaleDateString()
                          : 'Never'
                        }
                      </div>
                      <div className="text-xs text-muted-foreground">Last Run</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-16">
                <Workflow className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Select a Workflow</h3>
                <p className="text-muted-foreground">
                  Choose a workflow from the list to view and edit it
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Create Workflow Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create New Workflow</h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="workflow-name">Name</Label>
                <Input
                  id="workflow-name"
                  value={newWorkflow.name}
                  onChange={(e) => setNewWorkflow(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter workflow name"
                />
              </div>
              
              <div>
                <Label htmlFor="workflow-description">Description</Label>
                <Input
                  id="workflow-description"
                  value={newWorkflow.description}
                  onChange={(e) => setNewWorkflow(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this workflow does"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button 
                onClick={createWorkflow}
                disabled={!newWorkflow.name.trim()}
              >
                Create Workflow
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowEngine;