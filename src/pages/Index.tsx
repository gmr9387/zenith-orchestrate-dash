import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Share, Video, Zap, Wrench, Users, BarChart3,
  Play, Plus, Calendar, Settings, Search, Command,
  TrendingUp, Activity, ExternalLink, Bell, BookOpen, Filter
} from 'lucide-react';
// Removed unused CommandPalette to reduce bundle size
import { HeroMetrics } from '@/components/HeroMetrics';
import { ActivityFeed } from '@/components/ActivityFeed';
import { ToolCard } from '@/components/ToolCard';
import { toast } from '@/components/ui/sonner';
const NetworkVisualization = lazy(() => import('@/components/NetworkVisualization').then(m => ({ default: m.NetworkVisualization })));
import { apiClient } from '@/lib/api';

// Import hero images
import apiHubHero from '@/assets/api-hub-hero.jpg?as=picture&w=480;768;1080;1440&format=avif;webp;jpg';
import tutorialBuilderHero from '@/assets/tutorial-builder-hero.jpg?as=picture&w=480;768;1080;1440&format=avif;webp;jpg';
import videoCreatorHero from '@/assets/video-creator-hero.jpg?as=picture&w=480;768;1080;1440&format=avif;webp;jpg';
import workflowEngineHero from '@/assets/workflow-engine-hero.jpg?as=picture&w=480;768;1080;1440&format=avif;webp;jpg';
import appBuilderHero from '@/assets/app-builder-hero.jpg?as=picture&w=480;768;1080;1440&format=avif;webp;jpg';
import crmSuiteHero from '@/assets/crm-suite-hero.jpg?as=picture&w=480;768;1080;1440&format=avif;webp;jpg';

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
        setTutorials(Array.isArray(response.data) ? response.data : []);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900">
      {/* Welcome Section */}
      <div className="mb-8 p-6 glass-card rounded-2xl">
        <h2 className="text-4xl font-bold text-white mb-3 bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
          Welcome to Zilliance! 👋
        </h2>
        <p className="text-purple-200 text-lg">
          Ready to build amazing tutorials and grow your business?
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="glass-card border-purple-500/20 hover:border-purple-400/40 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-200">Total Tutorials</CardTitle>
            <BookOpen className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{tutorials.length}</div>
            <p className="text-xs text-purple-300">
              {loading ? 'Loading...' : `${tutorials.length} tutorials available`}
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-purple-500/20 hover:border-purple-400/40 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-200">Active Users</CardTitle>
            <Users className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">1,234</div>
            <p className="text-xs text-purple-300">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-purple-500/20 hover:border-purple-400/40 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-200">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">89%</div>
            <p className="text-xs text-purple-300">
              +5% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-purple-500/20 hover:border-purple-400/40 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-200">Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">$12,345</div>
            <p className="text-xs text-purple-300">
              +23% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="glass-card border-purple-500/20 hover:border-purple-400/40 transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-purple-200">
              <Plus className="h-5 w-5 text-purple-400" />
              <span>Quick Actions</span>
            </CardTitle>
            <CardDescription className="text-purple-300">
              Get started with common tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              className="w-full justify-start bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0" 
              variant="outline"
              onClick={handleCreateTutorial}
              disabled={loading}
            >
              <BookOpen className="mr-2 h-4 w-4" />
              {loading ? 'Creating...' : 'Create New Tutorial'}
            </Button>
            
            <Button 
              className="w-full justify-start bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0" 
              variant="outline"
              onClick={handleQuickTutorial}
              disabled={loading}
            >
              <Zap className="mr-2 h-4 w-4" />
              {loading ? 'Creating...' : 'Quick Tutorial'}
            </Button>
            
            <Link to="/tutorials">
              <Button className="w-full justify-start bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white border-0">
                <Search className="mr-2 h-4 w-4" />
                Browse Tutorials
              </Button>
            </Link>
            
            <Button className="w-full justify-start bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white border-0">
              <Filter className="mr-2 h-4 w-4" />
              Manage Content
            </Button>
          </CardContent>
        </Card>

        <Card className="glass-card border-purple-500/20 hover:border-purple-400/40 transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-purple-200">Recent Activity</CardTitle>
            <CardDescription className="text-purple-300">
              Your latest actions and updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tutorials.length > 0 ? (
                tutorials.slice(0, 3).map((tutorial: any) => (
                  <div key={tutorial.id} className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm text-purple-200">
                      Tutorial "{tutorial.title}" created
                    </span>
                    <span className="text-xs text-purple-400 ml-auto">Just now</span>
                  </div>
                ))
              ) : (
                <div className="text-sm text-purple-400 text-center py-4">
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
          pictureSources={(apiHubHero as any).sources}
          pictureImg={(apiHubHero as any).img}
          icon={<Share className="h-6 w-6 text-purple-400" />}
          onOpen={() => openToast('Opening API Hub', 'Deep link coming soon')}
          metrics={[
            { label: 'Active Integrations', value: '89', color: 'text-green-400' },
            { label: 'Data Processed', value: '2.4TB', color: 'text-purple-400' },
          ]}
          actions={[
            { label: 'Add Integration', icon: <Plus className="h-4 w-4" />, variant: 'default', onClick: () => openToast('Add Integration', 'Connector gallery coming soon') },
            { label: 'Analytics', icon: <BarChart3 className="h-4 w-4" />, variant: 'outline', onClick: () => openToast('Opening Analytics') },
          ]}
        >
          <div className="mb-4">
            <Suspense fallback={<div className="text-sm text-purple-300">Loading visualization…</div>}>
              <NetworkVisualization />
            </Suspense>
          </div>
        </ToolCard>

        {/* Tutorial Builder Card */}
        <ToolCard
          title="Tutorial Builder"
          description="AI-powered screen recording and tutorial generation"
          pictureSources={(tutorialBuilderHero as any).sources}
          pictureImg={(tutorialBuilderHero as any).img}
          icon={<Video className="h-6 w-6 text-purple-400" />}
          onOpen={() => openToast('Opening Tutorial Builder')}
          onPreview={async () => {
            const { db } = await import('@/lib/db');
            const recent = await db.tutorials.orderBy('updatedAt').reverse().first();
            if (recent) window.location.href = `/tutorial/${recent.id}`;
            else window.location.href = '/tutorial/record';
          }}
          metrics={[
            { label: 'Tutorials Created', value: tutorials.length.toString(), color: 'text-green-400' },
            { label: 'Avg. Duration', value: '12m', color: 'text-purple-400' },
          ]}
          actions={[
            { label: 'Generate Tutorial', icon: <Play className="h-4 w-4" />, variant: 'default', onClick: () => { window.location.href = '/tutorial/record?title=New%20Tutorial'; } },
            { label: 'Auto Generate', icon: <Zap className="h-4 w-4" />, variant: 'outline', onClick: () => { window.location.href = '/tutorial/auto'; } },
            { label: 'View Library', icon: <ExternalLink className="h-4 w-4" />, variant: 'outline', onClick: () => { window.location.href = '/tutorials'; } },
          ]}
        >
          <div className="mb-4 p-4 bg-purple-900/30 rounded-xl border border-purple-500/20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-8 bg-purple-500/20 rounded border border-purple-400/30 flex items-center justify-center">
                <Play className="h-3 w-3 text-purple-400" />
              </div>
              <div>
                <div className="text-sm font-medium text-purple-200">Advanced CRM Workflows</div>
                <div className="text-xs text-purple-400">Generating... 45% complete</div>
              </div>
            </div>
          </div>
        </ToolCard>

        {/* Video Creator Card */}
        <ToolCard
          title="Video Creator"
          description="Browser-native video editing with Hollywood-level capabilities"
          pictureSources={(videoCreatorHero as any).sources}
          pictureImg={(videoCreatorHero as any).img}
          icon={<Video className="h-6 w-6 text-purple-400" />}
          onOpen={() => openToast('Opening Video Creator')}
          metrics={[
            { label: 'Projects Active', value: '23', color: 'text-yellow-400' },
            { label: 'Rendered This Week', value: '156', color: 'text-green-400' },
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
          pictureSources={(workflowEngineHero as any).sources}
          pictureImg={(workflowEngineHero as any).img}
          icon={<Zap className="h-6 w-6 text-purple-400" />}
          onOpen={() => openToast('Opening Workflow Engine')}
          metrics={[
            { label: 'Active Workflows', value: '247', color: 'text-purple-400' },
            { label: 'Tasks Automated', value: '12.4K', color: 'text-green-400' },
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
          pictureSources={(appBuilderHero as any).sources}
          pictureImg={(appBuilderHero as any).img}
          icon={<Wrench className="h-6 w-6 text-purple-400" />}
          onOpen={() => openToast('Opening App Builder')}
          metrics={[
            { label: 'Apps Built', value: '34', color: 'text-green-400' },
            { label: 'Components', value: '500+', color: 'text-purple-400' },
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
          pictureSources={(crmSuiteHero as any).sources}
          pictureImg={(crmSuiteHero as any).img}
          icon={<Users className="h-6 w-6 text-purple-400" />}
          onOpen={() => openToast('Opening CRM Suite')}
          metrics={[
            { label: 'Active Contacts', value: '8,567', color: 'text-green-400' },
            { label: 'Pipeline Value', value: '$2.4M', color: 'text-purple-400' },
          ]}
          actions={[
            { label: 'Add Contact', icon: <Plus className="h-4 w-4" />, variant: 'default', onClick: () => openToast('Add Contact', 'Contact form coming soon') },
            { label: 'View Pipeline', icon: <TrendingUp className="h-4 w-4" />, variant: 'outline', onClick: () => openToast('Opening Pipeline') },
          ]}
        />
      </div>

      {/* Cross-Tool Intelligence Section */}
      <div className="mt-16 glass-card rounded-2xl p-8 animate-fade-in border-purple-500/20">
        <h2 className="text-3xl font-bold mb-4 text-center text-white">Cross-Tool Intelligence</h2>
        <p className="text-center text-purple-300 mb-8 max-w-2xl mx-auto">
          Watch your tools work together seamlessly. Smart workflows suggest the next best action across your entire automation suite.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 rounded-xl bg-purple-900/30 border border-purple-500/20 hover:border-purple-400/40 hover-lift">
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mx-auto mb-4 border border-purple-400/30">
              <Zap className="h-6 w-6 text-purple-400" />
            </div>
            <h3 className="font-semibold mb-2 text-purple-200">Smart Automation</h3>
            <p className="text-sm text-purple-300">AI-powered workflow suggestions</p>
          </div>

          <div className="text-center p-6 rounded-xl bg-purple-900/30 border border-purple-500/20 hover:border-purple-400/40 hover-lift">
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mx-auto mb-4 border border-purple-400/30">
              <Share className="h-6 w-6 text-purple-400" />
            </div>
            <h3 className="font-semibold mb-2 text-purple-200">Seamless Integration</h3>
            <p className="text-sm text-purple-300">All tools work together</p>
          </div>

          <div className="text-center p-6 rounded-xl bg-purple-900/30 border border-purple-500/20 hover:border-purple-400/40 hover-lift">
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mx-auto mb-4 border border-purple-400/30">
              <TrendingUp className="h-6 w-6 text-purple-400" />
            </div>
            <h3 className="font-semibold mb-2 text-purple-200">Performance Insights</h3>
            <p className="text-sm text-purple-300">Real-time analytics & optimization</p>
          </div>
        </div>

        <div className="text-center mt-8">
          <Link to="/tutorial-builder">
            <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 px-8 py-4 text-lg">
              <BookOpen className="mr-2 h-5 w-5" />
              Open Tutorial Builder
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;

