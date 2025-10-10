import { supabase } from "@/integrations/supabase/client";

// Tutorial Templates
export interface TutorialTemplate {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  category: string;
  thumbnail_url?: string;
  content: any;
  is_public: boolean;
  downloads: number;
  rating: number;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export const tutorialTemplateApi = {
  getPublicTemplates: async () => {
    const { data, error } = await supabase
      .from('tutorial_templates')
      .select('*')
      .eq('is_public', true)
      .order('downloads', { ascending: false });
    if (error) throw error;
    return data;
  },

  getMyTemplates: async () => {
    const { data, error } = await supabase
      .from('tutorial_templates')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  createTemplate: async (template: Partial<TutorialTemplate>) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('tutorial_templates')
      .insert({ ...template, user_id: user?.id })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  updateTemplate: async (id: string, updates: Partial<TutorialTemplate>) => {
    const { data, error } = await supabase
      .from('tutorial_templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  deleteTemplate: async (id: string) => {
    const { error } = await supabase
      .from('tutorial_templates')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
};

// Tutorial Analytics
export const tutorialAnalyticsApi = {
  trackEvent: async (tutorialId: string, eventType: string, metadata?: any, stepIndex?: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('tutorial_analytics')
      .insert({
        tutorial_id: tutorialId,
        user_id: user?.id,
        event_type: eventType,
        step_index: stepIndex,
        session_id: sessionStorage.getItem('tutorial_session_id') || crypto.randomUUID(),
        metadata
      });
    if (error) throw error;
  },

  getAnalytics: async (tutorialId: string) => {
    const { data, error } = await supabase
      .from('tutorial_analytics')
      .select('*')
      .eq('tutorial_id', tutorialId);
    if (error) throw error;
    return data;
  },

  getCompletionRate: async (tutorialId: string) => {
    const { data, error } = await supabase
      .from('tutorial_analytics')
      .select('event_type, session_id')
      .eq('tutorial_id', tutorialId);
    
    if (error) throw error;
    
    const uniqueSessions = new Set(data?.map(d => d.session_id));
    const completedSessions = new Set(
      data?.filter(d => d.event_type === 'complete').map(d => d.session_id)
    );
    
    return completedSessions.size / (uniqueSessions.size || 1);
  }
};

// Tutorial Versions
export const tutorialVersionApi = {
  createVersion: async (tutorialId: string, content: any, description?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: versions } = await supabase
      .from('tutorial_versions')
      .select('version_number')
      .eq('tutorial_id', tutorialId)
      .order('version_number', { ascending: false })
      .limit(1);
    
    const nextVersion = (versions?.[0]?.version_number || 0) + 1;
    
    const { data, error } = await supabase
      .from('tutorial_versions')
      .insert({
        tutorial_id: tutorialId,
        version_number: nextVersion,
        content,
        changes_description: description,
        created_by: user?.id
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  getVersions: async (tutorialId: string) => {
    const { data, error } = await supabase
      .from('tutorial_versions')
      .select('*')
      .eq('tutorial_id', tutorialId)
      .order('version_number', { ascending: false });
    if (error) throw error;
    return data;
  },

  restoreVersion: async (versionId: string) => {
    const { data, error } = await supabase
      .from('tutorial_versions')
      .select('*')
      .eq('id', versionId)
      .single();
    if (error) throw error;
    return data;
  }
};

// Tutorial Quizzes
export const tutorialQuizApi = {
  createQuiz: async (tutorialId: string, stepIndex: number, questions: any[], passingScore?: number) => {
    const { data, error } = await supabase
      .from('tutorial_quizzes')
      .insert({
        tutorial_id: tutorialId,
        step_index: stepIndex,
        questions,
        passing_score: passingScore || 70
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  getQuizzes: async (tutorialId: string) => {
    const { data, error } = await supabase
      .from('tutorial_quizzes')
      .select('*')
      .eq('tutorial_id', tutorialId);
    if (error) throw error;
    return data;
  },

  updateQuiz: async (id: string, updates: any) => {
    const { data, error } = await supabase
      .from('tutorial_quizzes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};

// Tutorial Branding
export const tutorialBrandingApi = {
  getBranding: async () => {
    const { data, error } = await supabase
      .from('tutorial_branding')
      .select('*')
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  saveBranding: async (branding: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('tutorial_branding')
      .upsert({ ...branding, user_id: user?.id })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};
