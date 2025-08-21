import { apiClient } from './api';

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  title: string;
  source: string;
  tags: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
  lastContactedAt: string | null;
  avatar?: string;
}

export interface Lead {
  id: string;
  contactId: string;
  contact: Contact;
  title: string;
  description: string;
  value: number;
  stage: 'new' | 'qualified' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost';
  probability: number;
  expectedCloseDate: string;
  source: string;
  assignedTo: string;
  createdAt: string;
  updatedAt: string;
}

export interface Deal {
  id: string;
  leadId: string;
  lead: Lead;
  title: string;
  description: string;
  value: number;
  stage: 'proposal' | 'negotiation' | 'contract' | 'closed-won' | 'closed-lost';
  probability: number;
  closeDate: string;
  assignedTo: string;
  products: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: string;
  type: 'call' | 'email' | 'meeting' | 'note' | 'task';
  title: string;
  description: string;
  contactId?: string;
  leadId?: string;
  dealId?: string;
  assignedTo: string;
  dueDate?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CrmMetrics {
  totalContacts: number;
  totalLeads: number;
  totalDeals: number;
  totalRevenue: number;
  conversionRate: number;
  averageDealSize: number;
  pipelineValue: number;
  activitiesThisWeek: number;
}

export const crmApi = {
  // Contacts
  getContacts: async (params?: { page?: number; limit?: number; search?: string }) => {
    return apiClient.get<{ contacts: Contact[]; total: number; page: number; totalPages: number }>('/crm/contacts', params);
  },

  getContact: async (id: string) => {
    return apiClient.get<Contact>(`/crm/contacts/${id}`);
  },

  createContact: async (data: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => {
    return apiClient.post<Contact>('/crm/contacts', data);
  },

  updateContact: async (id: string, data: Partial<Contact>) => {
    return apiClient.put<Contact>(`/crm/contacts/${id}`, data);
  },

  deleteContact: async (id: string) => {
    return apiClient.delete(`/crm/contacts/${id}`);
  },

  // Leads
  getLeads: async (params?: { page?: number; limit?: number; stage?: string; search?: string }) => {
    return apiClient.get<{ leads: Lead[]; total: number; page: number; totalPages: number }>('/crm/leads', params);
  },

  getLead: async (id: string) => {
    return apiClient.get<Lead>(`/crm/leads/${id}`);
  },

  createLead: async (data: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'contact'>) => {
    return apiClient.post<Lead>('/crm/leads', data);
  },

  updateLead: async (id: string, data: Partial<Lead>) => {
    return apiClient.put<Lead>(`/crm/leads/${id}`, data);
  },

  deleteLead: async (id: string) => {
    return apiClient.delete(`/crm/leads/${id}`);
  },

  // Deals
  getDeals: async (params?: { page?: number; limit?: number; stage?: string; search?: string }) => {
    return apiClient.get<{ deals: Deal[]; total: number; page: number; totalPages: number }>('/crm/deals', params);
  },

  getDeal: async (id: string) => {
    return apiClient.get<Deal>(`/crm/deals/${id}`);
  },

  createDeal: async (data: Omit<Deal, 'id' | 'createdAt' | 'updatedAt' | 'lead'>) => {
    return apiClient.post<Deal>('/crm/deals', data);
  },

  updateDeal: async (id: string, data: Partial<Deal>) => {
    return apiClient.put<Deal>(`/crm/deals/${id}`, data);
  },

  deleteDeal: async (id: string) => {
    return apiClient.delete(`/crm/deals/${id}`);
  },

  // Activities
  getActivities: async (params?: { page?: number; limit?: number; type?: string; contactId?: string; leadId?: string; dealId?: string }) => {
    return apiClient.get<{ activities: Activity[]; total: number; page: number; totalPages: number }>('/crm/activities', params);
  },

  createActivity: async (data: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>) => {
    return apiClient.post<Activity>('/crm/activities', data);
  },

  updateActivity: async (id: string, data: Partial<Activity>) => {
    return apiClient.put<Activity>(`/crm/activities/${id}`, data);
  },

  deleteActivity: async (id: string) => {
    return apiClient.delete(`/crm/activities/${id}`);
  },

  // Metrics
  getMetrics: async () => {
    return apiClient.get<CrmMetrics>('/crm/metrics');
  }
};