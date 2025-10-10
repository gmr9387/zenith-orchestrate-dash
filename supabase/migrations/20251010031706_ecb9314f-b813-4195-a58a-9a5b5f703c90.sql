-- Tutorial Builder Enhancements

-- Tutorial templates for marketplace
CREATE TABLE public.tutorial_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  thumbnail_url TEXT,
  content JSONB NOT NULL DEFAULT '{}',
  is_public BOOLEAN DEFAULT false,
  downloads INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tutorial versions for version control
CREATE TABLE public.tutorial_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutorial_id UUID NOT NULL REFERENCES tutorials(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  content JSONB NOT NULL,
  changes_description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tutorial analytics
CREATE TABLE public.tutorial_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutorial_id UUID NOT NULL REFERENCES tutorials(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL, -- view, complete, drop_off, quiz_attempt
  step_index INTEGER,
  session_id TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tutorial collaborators
CREATE TABLE public.tutorial_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutorial_id UUID NOT NULL REFERENCES tutorials(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'editor', -- owner, editor, viewer
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tutorial_id, user_id)
);

-- Tutorial quizzes
CREATE TABLE public.tutorial_quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutorial_id UUID NOT NULL REFERENCES tutorials(id) ON DELETE CASCADE,
  step_index INTEGER NOT NULL,
  questions JSONB NOT NULL, -- array of question objects
  passing_score INTEGER DEFAULT 70,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tutorial branding settings
CREATE TABLE public.tutorial_branding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  logo_url TEXT,
  primary_color TEXT,
  secondary_color TEXT,
  font_family TEXT,
  custom_css TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Video Platform Enhancements

-- Video chapters
CREATE TABLE public.video_chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  start_time INTEGER NOT NULL, -- in seconds
  end_time INTEGER,
  description TEXT,
  thumbnail_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Video playlists
CREATE TABLE public.video_playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  is_public BOOLEAN DEFAULT false,
  video_order UUID[], -- array of video IDs in order
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Video captions
CREATE TABLE public.video_captions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  language TEXT NOT NULL DEFAULT 'en',
  content JSONB NOT NULL, -- VTT format data
  is_auto_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Video interactive elements
CREATE TABLE public.video_interactive_elements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  timestamp INTEGER NOT NULL, -- when element appears
  type TEXT NOT NULL, -- cta, quiz, link, poll
  content JSONB NOT NULL,
  position JSONB, -- {x, y, width, height}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Live streams
CREATE TABLE public.live_streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled', -- scheduled, live, ended
  stream_key TEXT UNIQUE,
  viewer_count INTEGER DEFAULT 0,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workflow Engine Enhancements

-- Workflow templates
CREATE TABLE public.workflow_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  thumbnail_url TEXT,
  config JSONB NOT NULL,
  is_public BOOLEAN DEFAULT false,
  downloads INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workflow nodes (for visual builder)
CREATE TABLE public.workflow_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- trigger, action, condition, transform
  position JSONB NOT NULL, -- {x, y}
  config JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workflow connections (edges in visual builder)
CREATE TABLE public.workflow_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  source_node_id UUID NOT NULL REFERENCES workflow_nodes(id) ON DELETE CASCADE,
  target_node_id UUID NOT NULL REFERENCES workflow_nodes(id) ON DELETE CASCADE,
  condition JSONB, -- for conditional branching
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workflow webhooks
CREATE TABLE public.workflow_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  method TEXT NOT NULL DEFAULT 'POST',
  headers JSONB,
  secret TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workflow schedules (cron jobs)
CREATE TABLE public.workflow_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  cron_expression TEXT NOT NULL,
  timezone TEXT DEFAULT 'UTC',
  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMP WITH TIME ZONE,
  next_run_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CRM Suite Enhancements

-- Email campaigns
CREATE TABLE public.email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, scheduled, sending, sent
  recipients JSONB NOT NULL, -- array of contact IDs or segments
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  stats JSONB DEFAULT '{"sent": 0, "opened": 0, "clicked": 0}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lead scoring
CREATE TABLE public.lead_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0,
  factors JSONB, -- breakdown of score factors
  last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(contact_id)
);

-- Sales forecasts
CREATE TABLE public.sales_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period TEXT NOT NULL, -- month, quarter, year
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  predicted_revenue DECIMAL(15,2),
  confidence_level INTEGER, -- 0-100
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Custom CRM fields
CREATE TABLE public.custom_crm_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL, -- contact, deal, activity
  field_name TEXT NOT NULL,
  field_type TEXT NOT NULL, -- text, number, date, select, multiselect
  field_options JSONB, -- for select/multiselect
  is_required BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, entity_type, field_name)
);

-- Enable RLS on all new tables
ALTER TABLE public.tutorial_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutorial_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutorial_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutorial_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutorial_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutorial_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_captions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_interactive_elements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_crm_fields ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Tutorial Builder

CREATE POLICY "Users can view public templates" ON tutorial_templates FOR SELECT USING (is_public = true OR auth.uid() = user_id);
CREATE POLICY "Users can create templates" ON tutorial_templates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own templates" ON tutorial_templates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own templates" ON tutorial_templates FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view versions of accessible tutorials" ON tutorial_versions FOR SELECT USING (
  EXISTS (SELECT 1 FROM tutorials WHERE id = tutorial_versions.tutorial_id AND user_id = auth.uid())
);
CREATE POLICY "Users can create versions" ON tutorial_versions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM tutorials WHERE id = tutorial_id AND user_id = auth.uid())
);

CREATE POLICY "Users can view own analytics" ON tutorial_analytics FOR SELECT USING (
  EXISTS (SELECT 1 FROM tutorials WHERE id = tutorial_analytics.tutorial_id AND user_id = auth.uid())
);
CREATE POLICY "Anyone can create analytics" ON tutorial_analytics FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view collaborators" ON tutorial_collaborators FOR SELECT USING (
  auth.uid() = user_id OR EXISTS (SELECT 1 FROM tutorials WHERE id = tutorial_id AND user_id = auth.uid())
);
CREATE POLICY "Tutorial owners can manage collaborators" ON tutorial_collaborators FOR ALL USING (
  EXISTS (SELECT 1 FROM tutorials WHERE id = tutorial_id AND user_id = auth.uid())
);

CREATE POLICY "Users can manage quizzes" ON tutorial_quizzes FOR ALL USING (
  EXISTS (SELECT 1 FROM tutorials WHERE id = tutorial_id AND user_id = auth.uid())
);

CREATE POLICY "Users can manage own branding" ON tutorial_branding FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for Video Platform

CREATE POLICY "Users can manage own video chapters" ON video_chapters FOR ALL USING (
  EXISTS (SELECT 1 FROM videos WHERE id = video_id AND user_id = auth.uid())
);

CREATE POLICY "Users can view public playlists" ON video_playlists FOR SELECT USING (is_public = true OR auth.uid() = user_id);
CREATE POLICY "Users can manage own playlists" ON video_playlists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own playlists" ON video_playlists FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own playlists" ON video_playlists FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can manage captions" ON video_captions FOR ALL USING (
  EXISTS (SELECT 1 FROM videos WHERE id = video_id AND user_id = auth.uid())
);

CREATE POLICY "Users can manage interactive elements" ON video_interactive_elements FOR ALL USING (
  EXISTS (SELECT 1 FROM videos WHERE id = video_id AND user_id = auth.uid())
);

CREATE POLICY "Users can view live streams" ON live_streams FOR SELECT USING (true);
CREATE POLICY "Users can manage own streams" ON live_streams FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own streams" ON live_streams FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own streams" ON live_streams FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for Workflow Engine

CREATE POLICY "Users can view public workflow templates" ON workflow_templates FOR SELECT USING (is_public = true OR auth.uid() = user_id);
CREATE POLICY "Users can create workflow templates" ON workflow_templates FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can update own templates" ON workflow_templates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own templates" ON workflow_templates FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can manage workflow nodes" ON workflow_nodes FOR ALL USING (
  EXISTS (SELECT 1 FROM workflows WHERE id = workflow_id AND user_id = auth.uid())
);

CREATE POLICY "Users can manage workflow connections" ON workflow_connections FOR ALL USING (
  EXISTS (SELECT 1 FROM workflows WHERE id = workflow_id AND user_id = auth.uid())
);

CREATE POLICY "Users can manage workflow webhooks" ON workflow_webhooks FOR ALL USING (
  EXISTS (SELECT 1 FROM workflows WHERE id = workflow_id AND user_id = auth.uid())
);

CREATE POLICY "Users can manage workflow schedules" ON workflow_schedules FOR ALL USING (
  EXISTS (SELECT 1 FROM workflows WHERE id = workflow_id AND user_id = auth.uid())
);

-- RLS Policies for CRM Suite

CREATE POLICY "Users can manage own campaigns" ON email_campaigns FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view lead scores" ON lead_scores FOR SELECT USING (
  EXISTS (SELECT 1 FROM contacts WHERE id = contact_id AND user_id = auth.uid())
);
CREATE POLICY "Users can manage lead scores" ON lead_scores FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM contacts WHERE id = contact_id AND user_id = auth.uid())
);
CREATE POLICY "Users can update lead scores" ON lead_scores FOR UPDATE USING (
  EXISTS (SELECT 1 FROM contacts WHERE id = contact_id AND user_id = auth.uid())
);

CREATE POLICY "Users can manage own forecasts" ON sales_forecasts FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own custom fields" ON custom_crm_fields FOR ALL USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_tutorial_analytics_tutorial_id ON tutorial_analytics(tutorial_id);
CREATE INDEX idx_tutorial_analytics_event_type ON tutorial_analytics(event_type);
CREATE INDEX idx_video_chapters_video_id ON video_chapters(video_id);
CREATE INDEX idx_video_captions_video_id ON video_captions(video_id);
CREATE INDEX idx_workflow_nodes_workflow_id ON workflow_nodes(workflow_id);
CREATE INDEX idx_workflow_connections_workflow_id ON workflow_connections(workflow_id);
CREATE INDEX idx_email_campaigns_status ON email_campaigns(status);
CREATE INDEX idx_lead_scores_contact_id ON lead_scores(contact_id);

-- Add update triggers
CREATE TRIGGER update_tutorial_templates_updated_at BEFORE UPDATE ON tutorial_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tutorial_quizzes_updated_at BEFORE UPDATE ON tutorial_quizzes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tutorial_branding_updated_at BEFORE UPDATE ON tutorial_branding FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_video_playlists_updated_at BEFORE UPDATE ON video_playlists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workflow_templates_updated_at BEFORE UPDATE ON workflow_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_email_campaigns_updated_at BEFORE UPDATE ON email_campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();