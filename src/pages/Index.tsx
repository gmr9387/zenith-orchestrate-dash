import { useState } from "react";
import { 
  Share, Video, Zap, Wrench, Users, BarChart3, 
  Play, Plus, Calendar, Settings, Search, Command,
  TrendingUp, Activity, ExternalLink, Bell
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CommandPalette } from "@/components/CommandPalette";
import { HeroMetrics } from "@/components/HeroMetrics";
import { ActivityFeed } from "@/components/ActivityFeed";
import { ToolCard } from "@/components/ToolCard";
import { toast } from "@/components/ui/sonner";
import { NetworkVisualization } from "@/components/NetworkVisualization";

// Import hero images
import apiHubHero from "@/assets/api-hub-hero.jpg";
import tutorialBuilderHero from "@/assets/tutorial-builder-hero.jpg";
import videoCreatorHero from "@/assets/video-creator-hero.jpg";
import workflowEngineHero from "@/assets/workflow-engine-hero.jpg";
import appBuilderHero from "@/assets/app-builder-hero.jpg";
import crmSuiteHero from "@/assets/crm-suite-hero.jpg";

const Index = () => {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  const openToast = (title: string, description?: string) => toast(title, { description });

  return (
    <div className="min-h-screen mesh-bg">
      {/* Premium Header */}
      <header className="glass-intense sticky top-0 z-50 border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                Zilliance
              </div>
              <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                <span>Enterprise Suite Active</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setCommandPaletteOpen(true)}
                className="hidden md:flex items-center gap-2 min-w-[200px] justify-start text-muted-foreground border-muted hover:border-primary transition-colors"
              >
                <Search className="h-4 w-4" />
                <span>Search commands...</span>
                <div className="ml-auto flex items-center gap-0.5 text-xs">
                  <Command className="h-3 w-3" />
                  <span>K</span>
                </div>
              </Button>
              
              <Button variant="outline" size="sm">
                <Bell className="h-4 w-4" />
              </Button>
              
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Dashboard */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="mb-12 animate-fade-in">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-foreground via-primary to-primary-glow bg-clip-text text-transparent">
              Command Center
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Six revolutionary tools, one seamless platform. Transform your business automation with enterprise-grade AI.
            </p>
          </div>

          {/* Business Health Metrics */}
          <HeroMetrics />
          
          {/* Activity Feed */}
          <ActivityFeed />
        </div>

        {/* Premium Tool Cards - Masonry Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {/* API Hub Card */}
          <ToolCard
            title="API Hub"
            description="Integration management with live network visualizations"
            image={apiHubHero}
            icon={<Share className="h-6 w-6 text-primary" />}
            onOpen={() => openToast("Opening API Hub", "Deep link coming soon")}
            metrics={[
              { label: "Active Integrations", value: "89", color: "text-success" },
              { label: "Data Processed", value: "2.4TB", color: "text-primary" }
            ]}
            actions={[
              { label: "Add Integration", icon: <Plus className="h-4 w-4" />, variant: "default", onClick: () => openToast("Add Integration", "Connector gallery coming soon") },
              { label: "Analytics", icon: <BarChart3 className="h-4 w-4" />, variant: "outline", onClick: () => openToast("Opening Analytics") }
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
            onOpen={() => openToast("Opening Tutorial Builder")}
            onPreview={async () => {
              // Try opening most recent tutorial, fallback to recorder
              const { db } = await import("@/lib/db");
              const recent = await db.tutorials.orderBy("updatedAt").reverse().first();
              if (recent) window.location.href = `/tutorial/${recent.id}`;
              else window.location.href = "/tutorial/record";
            }}
            metrics={[
              { label: "Tutorials Created", value: "1,847", color: "text-success" },
              { label: "Avg. Duration", value: "12m", color: "text-primary" }
            ]}
            actions={[
              { label: "Generate Tutorial", icon: <Play className="h-4 w-4" />, variant: "default", onClick: () => { window.location.href = "/tutorial/record?title=New%20Tutorial"; } },
              { label: "Auto Generate", icon: <Zap className="h-4 w-4" />, variant: "outline", onClick: () => { window.location.href = "/tutorial/auto"; } },
              { label: "View Library", icon: <ExternalLink className="h-4 w-4" />, variant: "outline", onClick: () => { window.location.href = "/tutorials"; } }
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
            onOpen={() => openToast("Opening Video Creator")}
            metrics={[
              { label: "Projects Active", value: "23", color: "text-warning" },
              { label: "Rendered This Week", value: "156", color: "text-success" }
            ]}
            actions={[
              { label: "New Project", icon: <Plus className="h-4 w-4" />, variant: "default", onClick: () => openToast("Create Video Project", "Template picker coming soon") },
              { label: "Templates", icon: <ExternalLink className="h-4 w-4" />, variant: "outline", onClick: () => openToast("Opening Templates") }
            ]}
          />

          {/* Workflow Engine Card */}
          <ToolCard
            title="Workflow Engine"
            description="Visual business process automation that rivals Zapier"
            image={workflowEngineHero}
            icon={<Zap className="h-6 w-6 text-primary" />}
            onOpen={() => openToast("Opening Workflow Engine")}
            metrics={[
              { label: "Active Workflows", value: "247", color: "text-primary" },
              { label: "Tasks Automated", value: "12.4K", color: "text-success" }
            ]}
            actions={[
              { label: "Create Workflow", icon: <Plus className="h-4 w-4" />, variant: "default", onClick: () => openToast("Create Workflow", "Drag-and-drop builder coming soon") },
              { label: "Templates", icon: <ExternalLink className="h-4 w-4" />, variant: "outline", onClick: () => openToast("Opening Templates") }
            ]}
          />

          {/* App Builder Card */}
          <ToolCard
            title="App Builder"
            description="Low-code platform for building custom business applications"
            image={appBuilderHero}
            icon={<Wrench className="h-6 w-6 text-primary" />}
            onOpen={() => openToast("Opening App Builder")}
            metrics={[
              { label: "Apps Built", value: "34", color: "text-success" },
              { label: "Components", value: "500+", color: "text-primary" }
            ]}
            actions={[
              { label: "Build App", icon: <Plus className="h-4 w-4" />, variant: "default", onClick: () => openToast("Build App", "Schema to React generator next") },
              { label: "Component Library", icon: <ExternalLink className="h-4 w-4" />, variant: "outline", onClick: () => openToast("Opening Components") }
            ]}
          />

          {/* CRM Suite Card */}
          <ToolCard
            title="CRM Suite"
            description="Next-generation customer relationship management"
            image={crmSuiteHero}
            icon={<Users className="h-6 w-6 text-primary" />}
            onOpen={() => openToast("Opening CRM Suite")}
            metrics={[
              { label: "Active Contacts", value: "8,567", color: "text-success" },
              { label: "Pipeline Value", value: "$2.4M", color: "text-primary" }
            ]}
            actions={[
              { label: "Add Contact", icon: <Plus className="h-4 w-4" />, variant: "default", onClick: () => openToast("Add Contact", "Contact form coming soon") },
              { label: "View Pipeline", icon: <TrendingUp className="h-4 w-4" />, variant: "outline", onClick: () => openToast("Opening Pipeline") }
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
              <h3 className="font-semibold mb-2">Smart Suggestions</h3>
              <p className="text-sm text-muted-foreground">AI-powered workflow recommendations based on your usage patterns</p>
            </div>
            
            <div className="text-center p-6 rounded-xl bg-muted/30 hover-lift">
              <div className="w-12 h-12 bg-success/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Activity className="h-6 w-6 text-success" />
              </div>
              <h3 className="font-semibold mb-2">Real-time Sync</h3>
              <p className="text-sm text-muted-foreground">Data flows instantly between all tools for maximum efficiency</p>
            </div>
            
            <div className="text-center p-6 rounded-xl bg-muted/30 hover-lift">
              <div className="w-12 h-12 bg-warning/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-6 w-6 text-warning" />
              </div>
              <h3 className="font-semibold mb-2">Performance Insights</h3>
              <p className="text-sm text-muted-foreground">Advanced analytics showing optimization opportunities</p>
            </div>
          </div>
        </div>
      </main>

      {/* Command Palette */}
      <CommandPalette 
        open={commandPaletteOpen} 
        onOpenChange={setCommandPaletteOpen} 
      />

      {/* Floating Action Button */}
      <Button
        size="lg"
        className="fixed bottom-8 right-8 w-14 h-14 rounded-full shadow-2xl hover:shadow-primary/50 transition-all duration-300 hover-lift"
        onClick={() => setCommandPaletteOpen(true)}
      >
        <Command className="h-6 w-6" />
      </Button>
    </div>
  );
};

export default Index;
