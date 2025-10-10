import { supabase } from "@/integrations/supabase/client";

// Workflow Templates
export interface WorkflowTemplate {
  id: string;
  user_id?: string;
  title: string;
  description?: string;
  category?: string;
  thumbnail_url?: string;
  config: any;
  is_public: boolean;
  downloads: number;
  rating: number;
  created_at: string;
  updated_at: string;
}

export const workflowTemplateApi = {
  getPublicTemplates: async () => {
    const { data, error } = await supabase
      .from('workflow_templates')
      .select('*')
      .eq('is_public', true)
      .order('downloads', { ascending: false });
    if (error) throw error;
    return data;
  },

  getMyTemplates: async () => {
    const { data, error } = await supabase
      .from('workflow_templates')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  createTemplate: async (template: Partial<WorkflowTemplate>) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('workflow_templates')
      .insert({ ...template, user_id: user?.id })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  useTemplate: async (templateId: string) => {
    const { data: template, error: templateError } = await supabase
      .from('workflow_templates')
      .select('*')
      .eq('id', templateId)
      .single();
    
    if (templateError) throw templateError;

    // Increment downloads
    await supabase
      .from('workflow_templates')
      .update({ downloads: template.downloads + 1 })
      .eq('id', templateId);

    return template;
  }
};

// Workflow Visual Builder
export interface WorkflowNode {
  id: string;
  workflow_id: string;
  type: 'trigger' | 'action' | 'condition' | 'transform';
  position: { x: number; y: number };
  config: any;
  created_at: string;
}

export interface WorkflowConnection {
  id: string;
  workflow_id: string;
  source_node_id: string;
  target_node_id: string;
  condition?: any;
  created_at: string;
}

export const workflowBuilderApi = {
  getNodes: async (workflowId: string) => {
    const { data, error } = await supabase
      .from('workflow_nodes')
      .select('*')
      .eq('workflow_id', workflowId);
    if (error) throw error;
    return data;
  },

  getConnections: async (workflowId: string) => {
    const { data, error } = await supabase
      .from('workflow_connections')
      .select('*')
      .eq('workflow_id', workflowId);
    if (error) throw error;
    return data;
  },

  createNode: async (node: Omit<WorkflowNode, 'id' | 'created_at'>) => {
    const { data, error } = await supabase
      .from('workflow_nodes')
      .insert(node)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  updateNode: async (id: string, updates: Partial<WorkflowNode>) => {
    const { data, error } = await supabase
      .from('workflow_nodes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  deleteNode: async (id: string) => {
    const { error } = await supabase
      .from('workflow_nodes')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  createConnection: async (connection: Omit<WorkflowConnection, 'id' | 'created_at'>) => {
    const { data, error } = await supabase
      .from('workflow_connections')
      .insert(connection)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  deleteConnection: async (id: string) => {
    const { error } = await supabase
      .from('workflow_connections')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
};

// Workflow Webhooks
export const workflowWebhookApi = {
  getWebhooks: async (workflowId: string) => {
    const { data, error } = await supabase
      .from('workflow_webhooks')
      .select('*')
      .eq('workflow_id', workflowId);
    if (error) throw error;
    return data;
  },

  createWebhook: async (webhook: any) => {
    const { data, error } = await supabase
      .from('workflow_webhooks')
      .insert(webhook)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  updateWebhook: async (id: string, updates: any) => {
    const { data, error } = await supabase
      .from('workflow_webhooks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  deleteWebhook: async (id: string) => {
    const { error } = await supabase
      .from('workflow_webhooks')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
};

// Workflow Schedules
export const workflowScheduleApi = {
  getSchedules: async (workflowId: string) => {
    const { data, error } = await supabase
      .from('workflow_schedules')
      .select('*')
      .eq('workflow_id', workflowId);
    if (error) throw error;
    return data;
  },

  createSchedule: async (schedule: any) => {
    const { data, error } = await supabase
      .from('workflow_schedules')
      .insert(schedule)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  updateSchedule: async (id: string, updates: any) => {
    const { data, error } = await supabase
      .from('workflow_schedules')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  deleteSchedule: async (id: string) => {
    const { error } = await supabase
      .from('workflow_schedules')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
};
