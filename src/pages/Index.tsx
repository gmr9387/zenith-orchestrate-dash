import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Share, Video, Zap, Wrench, Users, BarChart3,
  Play, Plus, Calendar, Settings, Search, Command,
  TrendingUp, Activity, ExternalLink, Bell, BookOpen, Filter
} from 'lucide-react';
import { CommandPalette } from '@/components/CommandPalette';
import { HeroMetrics } from '@/components/HeroMetrics';
import { ActivityFeed } from '@/components/ActivityFeed';
import { ToolCard } from '@/components/ToolCard';
import { toast } from '@/components/ui/sonner';
import { NetworkVisualization } from '@/components/NetworkVisualization';
import { apiClient } from '@/lib/api';

// Import hero images
import apiHubHero from '@/assets/api-hub-hero.jpg';
import tutorialBuilderHero from '@/assets/tutorial-builder-hero.jpg';
import videoCreatorHero from '@/assets/video-creator-hero.jpg';
import workflowEngineHero from '@/assets/workflow-engine-hero.jpg';
import appBuilderHero from '@/assets/app-builder-hero.jpg';
import crmSuiteHero from '@/assets/crm-suite-hero.jpg';

const Index: React.FC = () => {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [tutorials, setTutorials] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load tutorials from backend
  useEffect(() => {
    loadTutorials();
  }, []);

  const loadTutorials = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/tutorials');
      if (response.success) {
        setTutorials(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load tutorials:', error);
      toast('Failed to load tutorials', { description: 'Please try again later' });
    } finally {
      setLoading(false);
    }
  };

  const createTutorial = async (title: string, description: string) => {
    try {
      setLoading(true);
      
      // Create tutorial in local Dexie DB
      const { db } = await import('@/lib/db');
      const tutorialId = `tutorial_${Date.now()}`;
      
      await db.tutorials.add({
        id: tutorialId,
        title,
        description,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        stepCount: 0,
      });

      // Also create in backend (mock for now)
      const response = await apiClient.post('/tutorials', {
        title,
        description,
        type: 'manual',
      });

      if (response.success) {
        toast('Tutorial Created!', { description: `${title} has been created successfully` });
        loadTutorials(); // Reload the list
        return tutorialId;
      }
    } catch (error) {
      console.error('Failed to create tutorial:', error);
      toast('Failed to create tutorial', { description: 'Please try again later' });
    } finally {
      setLoading(false);
    }
  };

  const openToast = (title: string, description?: string) => toast(title, { description });

  const handleCreateTutorial = async () => {
    const title = prompt('Enter tutorial title:');
    if (title) {
      const description = prompt('Enter tutorial description:') || 'A new tutorial';
      await createTutorial(title, description);
    }
  };

  const handleQuickTutorial = async () => {
    const quickTutorials = [
      { title: 'Getting Started with Zilliance', description: 'Learn the basics of our platform' },
      { title: 'Creating Your First Tutorial', description: 'Step-by-step guide to tutorial creation' },
      { title: 'Advanced Features Overview', description: 'Master advanced platform capabilities' },
    ];
    
    const randomTutorial = quickTutorials[Math.floor(Math.random() * quickTutorials.length)];
    await createTutorial(randomTutorial.title, randomTutorial.description);
  };

  return (
    <>
      {/* Welcome Section */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome to Zilliance! 👋
        </h2>
        <p className="text-gray-600">
          Ready to build amazing tutorials and grow your business?
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tutorials</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tutorials.length}</div>
            <p className="text-xs text-muted-foreground">
              {loading ? 'Loading...' : `${tutorials.length} tutorials available`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89%</div>
            <p className="text-xs text-muted-foreground">
              +5% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$12,345</div>
            <p className="text-xs text-muted-foreground">
              +23% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plus className="h-5 w-5" />
              <span>Quick Actions</span>
            </CardTitle>
            <CardDescription>
              Get started with common tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={handleCreateTutorial}
              disabled={loading}
            >
              <BookOpen className="mr-2 h-4 w-4" />
              {loading ? 'Creating...' : 'Create New Tutorial'}
            </Button>
            
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={handleQuickTutorial}
              disabled={loading}
            >
              <Zap className="mr-2 h-4 w-4" />
              {loading ? 'Creating...' : 'Quick Tutorial'}
            </Button>
            
            <Link to="/tutorials">
              <Button className="w-full justify-start" variant="outline">
                <Search className="mr-2 h-4 w-4" />
                Browse Tutorials
              </Button>
            </Link>
            
            <Button className="w-full justify-start" variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Manage Content
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Your latest actions and updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tutorials.length > 0 ? (
                tutorials.slice(0, 3).map((tutorial: any) => (
                  <div key={tutorial.id} className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">
                      Tutorial "{tutorial.title}" created
                    </span>
                    <span className="text-xs text-gray-400 ml-auto">Just now</span>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500 text-center py-4">
                  No tutorials yet. Create your first one!
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Premium Tool Cards - Masonry Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
        {/* API Hub Card */}
        <ToolCard
          title="API Hub"
          description="Integration management with live network visualizations"
          image={apiHubHero}
          icon={<Share className="h-6 w-6 text-primary" />}
          onOpen={() => openToast('Opening API Hub', 'Deep link coming soon')}
          metrics={[
            { label: 'Active Integrations', value: '89', color: 'text-success' },
            { label: 'Data Processed', value: '2.4TB', color: 'text-primary' },
          ]}
          actions={[
            { label: 'Add Integration', icon: <Plus className="h-4 w-4" />, variant: 'default', onClick: () => openToast('Add Integration', 'Connector gallery coming soon') },
            { label: 'Analytics', icon: <BarChart3 className="h-4 w-4" />, variant: 'outline', onClick: () => openToast('Opening Analytics') },
          ]}
        >
          <div className="mb-4">
            <NetworkVisualization />
          </div>
        </ToolCard>

        {/* Tutorial Builder Card */}
        <ToolCard
          title="Tutorial Builder"
          description="AI-powered screen recording and tutorial generation"
          image={tutorialBuilderHero}
          icon={<Video className="h-6 w-6 text-primary" />}
          onOpen={() => openToast('Opening Tutorial Builder')}
          onPreview={async () => {
            const { db } = await import('@/lib/db');
            const recent = await db.tutorials.orderBy('updatedAt').reverse().first();
            if (recent) window.location.href = `/tutorial/${recent.id}`;
            else window.location.href = '/tutorial/record';
          }}
          metrics={[
            { label: 'Tutorials Created', value: tutorials.length.toString(), color: 'text-success' },
            { label: 'Avg. Duration', value: '12m', color: 'text-primary' },
          ]}
          actions={[
            { label: 'Generate Tutorial', icon: <Play className="h-4 w-4" />, variant: 'default', onClick: () => { window.location.href = '/tutorial/record?title=New%20Tutorial'; } },
            { label: 'Auto Generate', icon: <Zap className="h-4 w-4" />, variant: 'outline', onClick: () => { window.location.href = '/tutorial/auto'; } },
            { label: 'View Library', icon: <ExternalLink className="h-4 w-4" />, variant: 'outline', onClick: () => { window.location.href = '/tutorials'; } },
          ]}
        >
          <div className="mb-4 p-4 bg-muted/30 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-8 bg-primary/20 rounded border border-primary/30 flex items-center justify-center">
                <Play className="h-3 w-3 text-primary" />
              </div>
              <div>
                <div className="text-sm font-medium">Advanced CRM Workflows</div>
                <div className="text-xs text-muted-foreground">Generating... 45% complete</div>
              </div>
            </div>
          </div>
        </ToolCard>

        {/* Video Creator Card */}
        <ToolCard
          title="Video Creator"
          description="Browser-native video editing with Hollywood-level capabilities"
          image={videoCreatorHero}
          icon={<Video className="h-6 w-6 text-primary" />}
          onOpen={() => openToast('Opening Video Creator')}
          metrics={[
            { label: 'Projects Active', value: '23', color: 'text-warning' },
            { label: 'Rendered This Week', value: '156', color: 'text-success' },
          ]}
          actions={[
            { label: 'New Project', icon: <Plus className="h-4 w-4" />, variant: 'default', onClick: () => openToast('Create Video Project', 'Template picker coming soon') },
            { label: 'Templates', icon: <ExternalLink className="h-4 w-4" />, variant: 'outline', onClick: () => openToast('Opening Templates') },
          ]}
        />

        {/* Workflow Engine Card */}
        <ToolCard
          title="Workflow Engine"
          description="Visual business process automation that rivals Zapier"
          image={workflowEngineHero}
          icon={<Zap className="h-6 w-6 text-primary" />}
          onOpen={() => openToast('Opening Workflow Engine')}
          metrics={[
            { label: 'Active Workflows', value: '247', color: 'text-primary' },
            { label: 'Tasks Automated', value: '12.4K', color: 'text-success' },
          ]}
          actions={[
            { label: 'Create Workflow', icon: <Plus className="h-4 w-4" />, variant: 'default', onClick: () => openToast('Create Workflow', 'Drag-and-drop builder coming soon') },
            { label: 'Templates', icon: <ExternalLink className="h-4 w-4" />, variant: 'outline', onClick: () => openToast('Opening Templates') },
          ]}
        />

        {/* App Builder Card */}
        <ToolCard
          title="App Builder"
          description="Low-code platform for building custom business applications"
          image={appBuilderHero}
          icon={<Wrench className="h-6 w-6 text-primary" />}
          onOpen={() => openToast('Opening App Builder')}
          metrics={[
            { label: 'Apps Built', value: '34', color: 'text-success' },
            { label: 'Components', value: '500+', color: 'text-primary' },
          ]}
          actions={[
            { label: 'Build App', icon: <Plus className="h-4 w-4" />, variant: 'default', onClick: () => openToast('Build App', 'Schema to React generator next') },
            { label: 'Component Library', icon: <ExternalLink className="h-4 w-4" />, variant: 'outline', onClick: () => openToast('Opening Components') },
          ]}
        />

        {/* CRM Suite Card */}
        <ToolCard
          title="CRM Suite"
          description="Next-generation customer relationship management"
          image={crmSuiteHero}
          icon={<Users className="h-6 w-6 text-primary" />}
          onOpen={() => openToast('Opening CRM Suite')}
          metrics={[
            { label: 'Active Contacts', value: '8,567', color: 'text-success' },
            { label: 'Pipeline Value', value: '$2.4M', color: 'text-primary' },
          ]}
          actions={[
            { label: 'Add Contact', icon: <Plus className="h-4 w-4" />, variant: 'default', onClick: () => openToast('Add Contact', 'Contact form coming soon') },
            { label: 'View Pipeline', icon: <TrendingUp className="h-4 w-4" />, variant: 'outline', onClick: () => openToast('Opening Pipeline') },
          ]}
        />
      </div>

      {/* Cross-Tool Intelligence Section */}
      <div className="mt-16 glass-card rounded-2xl p-8 animate-fade-in">
        <h2 className="text-2xl font-bold mb-4 text-center">Cross-Tool Intelligence</h2>
        <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
          Watch your tools work together seamlessly. Smart workflows suggest the next best action across your entire automation suite.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 rounded-xl bg-muted/30 hover-lift">
            <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Smart Automation</h3>
            <p className="text-sm text-muted-foreground">AI-powered workflow suggestions</p>
          </div>

          <div className="text-center p-6 rounded-xl bg-muted/30 hover-lift">
            <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Share className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Seamless Integration</h3>
            <p className="text-sm text-muted-foreground">All tools work together</p>
          </div>

          <div className="text-center p-6 rounded-xl bg-muted/30 hover-lift">
            <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Performance Insights</h3>
            <p className="text-sm text-muted-foreground">Real-time analytics & optimization</p>
          </div>
        </div>

        <div className="text-center mt-8">
          <Link to="/tutorial-builder">
            <Button size="lg">
              <BookOpen className="mr-2 h-4 w-4" />
              Open Tutorial Builder
            </Button>
          </Link>
        </div>
      </div>
    </>
  );
};

export default Index;

