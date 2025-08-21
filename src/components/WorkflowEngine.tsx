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
        const { hasBackend, apiGet } = await import('@/lib/api');
        if (hasBackend()) {
          const resp = await apiGet<{ success: boolean; data: Workflow[] }>(`/workflows`);
          const data = (resp as any).data;
          if (Array.isArray(data)) setWorkflows(data as Workflow[]);
        }
      } catch {}
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
    const nowIso = new Date().toISOString();
    const draft: Workflow = {
      id: `wf_${Date.now()}`,
      name: newWorkflow.name,
      description: newWorkflow.description,
      nodes: [],
      isActive: false,
      lastRun: null,
      runCount: 0,
      successRate: 100,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    try {
      const { hasBackend, apiPost } = await import('@/lib/api');
      if (hasBackend()) {
        const resp = await apiPost<{ success: boolean; data: Workflow }>(`/workflows`, { name: draft.name, description: draft.description });
        const created = (resp as any).data ?? draft;
        setWorkflows(prev => [created as Workflow, ...prev]);
        setSelectedWorkflow(created as Workflow);
      } else {
        setWorkflows(prev => [draft, ...prev]);
        setSelectedWorkflow(draft);
      }
    } catch {
      setWorkflows(prev => [draft, ...prev]);
      setSelectedWorkflow(draft);
    }
    setShowCreateModal(false);
    setNewWorkflow({ name: '', description: '' });
  };

  const addNode = (workflowId: string, nodeType: WorkflowNode['type'], position: { x: number; y: number }) => {
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
  };

  const toggleWorkflow = async (workflowId: string) => {
    setWorkflows(prev => prev.map(w => 
      w.id === workflowId ? { ...w, isActive: !w.isActive } : w
    ));
    try {
      const { hasBackend, apiPut } = await import('@/lib/api');
      const wf = workflows.find(w => w.id === workflowId);
      if (hasBackend() && wf) await apiPut(`/workflows/${workflowId}`, { isActive: !wf.isActive });
    } catch {}
  };

  const deleteWorkflow = async (workflowId: string) => {
    if (confirm('Are you sure you want to delete this workflow? This action cannot be undone.')) {
      setWorkflows(prev => prev.filter(w => w.id !== workflowId));
      if (selectedWorkflow?.id === workflowId) {
        setSelectedWorkflow(null);
      }
      try {
        const { hasBackend, apiDelete } = await import('@/lib/api');
        if (hasBackend()) await apiDelete(`/workflows/${workflowId}`);
      } catch {}
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
      
      {/* ... existing code ... */}
    </div>
  );
};

export default WorkflowEngine;