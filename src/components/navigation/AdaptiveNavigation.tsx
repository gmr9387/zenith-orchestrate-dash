import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Command, Search, Zap, Share, Video, Wrench, Users, 
  Home, Brain, Workflow, Eye, Mic, Settings, Bell
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FloatingToolSwitcher } from "./FloatingToolSwitcher";
import { SmartBreadcrumbs } from "./SmartBreadcrumbs";
import { VoiceNavigation } from "./VoiceNavigation";
import { WorkflowVisualization } from "./WorkflowVisualization";

interface Tool {
  id: string;
  name: string;
  icon: any;
  color: string;
  status: 'active' | 'processing' | 'idle';
}

const tools: Tool[] = [
  { id: 'hub', name: 'API Hub', icon: Share, color: 'hsl(252 82% 62%)', status: 'active' },
  { id: 'tutorial', name: 'Tutorial Builder', icon: Video, color: 'hsl(142 76% 36%)', status: 'processing' },
  { id: 'video', name: 'Video Creator', icon: Video, color: 'hsl(48 96% 53%)', status: 'idle' },
  { id: 'workflow', name: 'Workflow Engine', icon: Zap, color: 'hsl(0 84% 60%)', status: 'active' },
  { id: 'builder', name: 'App Builder', icon: Wrench, color: 'hsl(252 100% 80%)', status: 'idle' },
  { id: 'crm', name: 'CRM Suite', icon: Users, color: 'hsl(142 76% 45%)', status: 'active' }
];

export function AdaptiveNavigation() {
  const [currentTool, setCurrentTool] = useState('hub');
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [showWorkflowViz, setShowWorkflowViz] = useState(false);
  const [smartSuggestions, setSmartSuggestions] = useState<string[]>([]);
  const [contextualActions, setContextualActions] = useState<any[]>([]);

  const currentToolData = tools.find(t => t.id === currentTool);

  // AI-powered smart suggestions based on current tool
  useEffect(() => {
    const suggestions = {
      hub: ["Connect Slack integration", "Monitor API health", "Generate webhook endpoint"],
      tutorial: ["Record CRM workflow", "Create onboarding series", "Export to video"],
      video: ["Import from tutorial", "Add CRM branding", "Schedule social posts"],
      workflow: ["Automate lead scoring", "Connect email sequences", "Build approval flow"],
      builder: ["Create dashboard", "Add authentication", "Deploy to production"],
      crm: ["Import contacts", "Set up pipeline", "Generate client tutorial"]
    };
    setSmartSuggestions(suggestions[currentTool as keyof typeof suggestions] || []);
  }, [currentTool]);

  // Contextual quick actions
  useEffect(() => {
    const actions = {
      hub: [
        { label: "New Integration", icon: Zap, action: () => {} },
        { label: "Test Webhook", icon: Workflow, action: () => {} }
      ],
      tutorial: [
        { label: "Start Recording", icon: Video, action: () => {} },
        { label: "AI Generate", icon: Brain, action: () => {} }
      ],
      video: [
        { label: "New Project", icon: Video, action: () => {} },
        { label: "Import Media", icon: Share, action: () => {} }
      ],
      workflow: [
        { label: "Create Flow", icon: Zap, action: () => {} },
        { label: "Templates", icon: Workflow, action: () => {} }
      ],
      builder: [
        { label: "New App", icon: Wrench, action: () => {} },
        { label: "Components", icon: Share, action: () => {} }
      ],
      crm: [
        { label: "Add Contact", icon: Users, action: () => {} },
        { label: "View Pipeline", icon: Eye, action: () => {} }
      ]
    };
    setContextualActions(actions[currentTool as keyof typeof actions] || []);
  }, [currentTool]);

  return (
    <>
      {/* Revolutionary Adaptive Header */}
      <motion.header 
        className="fixed top-0 left-0 right-0 z-50 glass-intense border-b border-border/50"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Brand + Context */}
            <div className="flex items-center gap-6">
              {/* Zilliance Brand */}
              <motion.div 
                className="flex items-center gap-3"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
                  <Home className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="text-xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                  Zilliance
                </div>
              </motion.div>

              {/* Smart Breadcrumbs */}
              <SmartBreadcrumbs currentTool={currentTool} />

              {/* Tool Status Indicator */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentTool}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full glass-card"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{ borderColor: currentToolData?.color }}
                >
                  {currentToolData && (
                    <>
                      <currentToolData.icon 
                        className="w-4 h-4" 
                        style={{ color: currentToolData.color }}
                      />
                      <span className="text-sm font-medium">{currentToolData.name}</span>
                      <div 
                        className={`w-2 h-2 rounded-full ${
                          currentToolData.status === 'active' ? 'bg-success animate-pulse' :
                          currentToolData.status === 'processing' ? 'bg-warning animate-pulse' :
                          'bg-muted'
                        }`}
                      />
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Center: Floating Tool Switcher */}
            <FloatingToolSwitcher 
              tools={tools}
              currentTool={currentTool}
              onToolChange={setCurrentTool}
            />

            {/* Right: Controls & Actions */}
            <div className="flex items-center gap-3">
              {/* Contextual Quick Actions */}
              <div className="hidden lg:flex items-center gap-2">
                {contextualActions.map((action, idx) => (
                  <motion.div
                    key={action.label}
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs hover:border-primary hover:text-primary transition-all duration-300"
                      onClick={action.action}
                    >
                      <action.icon className="w-3 h-3 mr-1" />
                      {action.label}
                    </Button>
                  </motion.div>
                ))}
              </div>

              {/* Voice Navigation */}
              <VoiceNavigation 
                isActive={isVoiceActive}
                onToggle={setIsVoiceActive}
              />

              {/* Workflow Visualization Toggle */}
              <Button
                variant="outline"
                size="sm"
                className={`transition-all duration-300 ${
                  showWorkflowViz ? 'bg-primary text-primary-foreground' : ''
                }`}
                onClick={() => setShowWorkflowViz(!showWorkflowViz)}
              >
                <Workflow className="w-4 h-4" />
              </Button>

              {/* Notifications */}
              <Button variant="outline" size="sm" className="relative">
                <Bell className="w-4 h-4" />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full animate-pulse" />
              </Button>

              {/* Settings */}
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4" />
              </Button>

              {/* Command Palette Trigger */}
              <Button
                variant="outline"
                size="sm"
                className="hidden md:flex items-center gap-2 min-w-[180px] justify-start text-muted-foreground border-muted hover:border-primary transition-colors"
              >
                <Search className="w-4 h-4" />
                <span>Search commands...</span>
                <div className="ml-auto flex items-center gap-0.5 text-xs">
                  <Command className="w-3 h-3" />
                  <span>K</span>
                </div>
              </Button>
            </div>
          </div>

          {/* Smart Suggestions Bar */}
          <AnimatePresence>
            {smartSuggestions.length > 0 && (
              <motion.div
                className="mt-3 flex items-center gap-3 overflow-x-auto pb-2"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  AI Suggests:
                </span>
                {smartSuggestions.map((suggestion, idx) => (
                  <motion.button
                    key={suggestion}
                    className="text-xs px-2 py-1 rounded-full bg-muted/30 hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-all duration-300 whitespace-nowrap"
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {suggestion}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.header>

      {/* Cross-Tool Workflow Visualization */}
      <WorkflowVisualization 
        show={showWorkflowViz}
        tools={tools}
        currentTool={currentTool}
      />
    </>
  );
}