import { supabase } from "@/integrations/supabase/client";

// Email Campaigns
export interface EmailCampaign {
  id: string;
  user_id: string;
  name: string;
  subject: string;
  content: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent';
  recipients: any;
  scheduled_at?: string;
  sent_at?: string;
  stats: {
    sent: number;
    opened: number;
    clicked: number;
  };
  created_at: string;
  updated_at: string;
}

export const emailCampaignApi = {
  getCampaigns: async () => {
    const { data, error } = await supabase
      .from('email_campaigns')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  createCampaign: async (campaign: Partial<EmailCampaign>) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('email_campaigns')
      .insert({
        ...campaign,
        user_id: user?.id,
        status: 'draft',
        stats: { sent: 0, opened: 0, clicked: 0 }
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  updateCampaign: async (id: string, updates: Partial<EmailCampaign>) => {
    const { data, error } = await supabase
      .from('email_campaigns')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  sendCampaign: async (id: string) => {
    const { data, error } = await supabase.functions.invoke('send-email-campaign', {
      body: { campaignId: id }
    });
    if (error) throw error;
    return data;
  },

  deleteCampaign: async (id: string) => {
    const { error } = await supabase
      .from('email_campaigns')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
};

// Lead Scoring
export interface LeadScore {
  id: string;
  contact_id: string;
  score: number;
  factors?: any;
  last_calculated_at: string;
  created_at: string;
}

export const leadScoringApi = {
  getScore: async (contactId: string) => {
    const { data, error } = await supabase
      .from('lead_scores')
      .select('*')
      .eq('contact_id', contactId)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  calculateScore: async (contactId: string) => {
    const { data, error } = await supabase.functions.invoke('calculate-lead-score', {
      body: { contactId }
    });
    if (error) throw error;
    return data;
  },

  getTopLeads: async (limit: number = 10) => {
    const { data, error } = await supabase
      .from('lead_scores')
      .select('*, contacts(*)')
      .order('score', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data;
  }
};

// Sales Forecasting
export interface SalesForecast {
  id: string;
  user_id: string;
  period: 'month' | 'quarter' | 'year';
  period_start: string;
  period_end: string;
  predicted_revenue?: number;
  confidence_level?: number;
  data?: any;
  created_at: string;
}

export const salesForecastApi = {
  getForecasts: async () => {
    const { data, error } = await supabase
      .from('sales_forecasts')
      .select('*')
      .order('period_start', { ascending: false });
    if (error) throw error;
    return data;
  },

  createForecast: async (forecast: Partial<SalesForecast>) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('sales_forecasts')
      .insert({ ...forecast, user_id: user?.id })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  generateForecast: async (period: string, startDate: string, endDate: string) => {
    const { data, error } = await supabase.functions.invoke('generate-sales-forecast', {
      body: { period, startDate, endDate }
    });
    if (error) throw error;
    return data;
  }
};

// Custom CRM Fields
export interface CustomField {
  id: string;
  user_id: string;
  entity_type: 'contact' | 'deal' | 'activity';
  field_name: string;
  field_type: 'text' | 'number' | 'date' | 'select' | 'multiselect';
  field_options?: any;
  is_required: boolean;
  created_at: string;
}

export const customFieldApi = {
  getFields: async (entityType: string) => {
    const { data, error } = await supabase
      .from('custom_crm_fields')
      .select('*')
      .eq('entity_type', entityType);
    if (error) throw error;
    return data;
  },

  createField: async (field: Partial<CustomField>) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('custom_crm_fields')
      .insert({ ...field, user_id: user?.id })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  updateField: async (id: string, updates: Partial<CustomField>) => {
    const { data, error } = await supabase
      .from('custom_crm_fields')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  deleteField: async (id: string) => {
    const { error } = await supabase
      .from('custom_crm_fields')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
};
