import { motion } from "framer-motion";
import { ChevronRight, Home, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";

interface BreadcrumbItem {
  label: string;
  path: string;
  type: 'tool' | 'section' | 'action';
  color?: string;
}

interface SmartBreadcrumbsProps {
  currentTool: string;
}

export function SmartBreadcrumbs({ currentTool }: SmartBreadcrumbsProps) {
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const [workflowPath, setWorkflowPath] = useState<string[]>([]);

  // Generate intelligent breadcrumbs based on current context
  useEffect(() => {
    const toolBreadcrumbs = {
      hub: [
        { label: 'Dashboard', path: '/', type: 'section' as const },
        { label: 'API Hub', path: '/hub', type: 'tool' as const, color: 'hsl(252 82% 62%)' },
        { label: 'Integrations', path: '/hub/integrations', type: 'section' as const }
      ],
      tutorial: [
        { label: 'Dashboard', path: '/', type: 'section' as const },
        { label: 'Tutorial Builder', path: '/tutorial', type: 'tool' as const, color: 'hsl(142 76% 36%)' },
        { label: 'AI Recording', path: '/tutorial/record', type: 'action' as const }
      ],
      video: [
        { label: 'Dashboard', path: '/', type: 'section' as const },
        { label: 'Video Creator', path: '/video', type: 'tool' as const, color: 'hsl(48 96% 53%)' },
        { label: 'Projects', path: '/video/projects', type: 'section' as const }
      ],
      workflow: [
        { label: 'Dashboard', path: '/', type: 'section' as const },
        { label: 'Workflow Engine', path: '/workflow', type: 'tool' as const, color: 'hsl(0 84% 60%)' },
        { label: 'Visual Builder', path: '/workflow/builder', type: 'action' as const }
      ],
      builder: [
        { label: 'Dashboard', path: '/', type: 'section' as const },
        { label: 'App Builder', path: '/builder', type: 'tool' as const, color: 'hsl(252 100% 80%)' },
        { label: 'Components', path: '/builder/components', type: 'section' as const }
      ],
      crm: [
        { label: 'Dashboard', path: '/', type: 'section' as const },
        { label: 'CRM Suite', path: '/crm', type: 'tool' as const, color: 'hsl(142 76% 45%)' },
        { label: 'Contacts', path: '/crm/contacts', type: 'section' as const }
      ]
    };

    setBreadcrumbs(toolBreadcrumbs[currentTool as keyof typeof toolBreadcrumbs] || []);
  }, [currentTool]);

  // Track cross-tool workflow paths
  useEffect(() => {
    setWorkflowPath(prev => {
      const newPath = [...prev, currentTool];
      // Keep only last 4 tools to show workflow progression
      return newPath.slice(-4);
    });
  }, [currentTool]);

  return (
    <div className="flex flex-col gap-1">
      {/* Main Breadcrumbs */}
      <div className="flex items-center gap-1 text-sm">
        {breadcrumbs.map((crumb, index) => (
          <motion.div
            key={crumb.path}
            className="flex items-center gap-1"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            {index > 0 && (
              <ChevronRight className="w-3 h-3 text-muted-foreground/50" />
            )}
            
            <motion.button
              className={`px-2 py-1 rounded-md transition-all duration-300 hover:bg-muted/30 ${
                index === breadcrumbs.length - 1 
                  ? 'text-foreground font-medium' 
                  : 'text-muted-foreground hover:text-foreground'
              } ${
                crumb.type === 'tool' ? 'border border-transparent hover:border-primary/30' : ''
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                color: crumb.type === 'tool' && index === breadcrumbs.length - 1 ? crumb.color : undefined
              }}
            >
              {crumb.label}
            </motion.button>
          </motion.div>
        ))}
      </div>

      {/* Cross-Tool Workflow Path */}
      {workflowPath.length > 1 && (
        <motion.div
          className="flex items-center gap-1 text-xs text-muted-foreground"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.3 }}
        >
          <span>Workflow:</span>
          <div className="flex items-center gap-1">
            {workflowPath.slice(-3).map((tool, index, arr) => (
              <motion.div
                key={`${tool}-${index}`}
                className="flex items-center gap-1"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <span className={`px-1.5 py-0.5 rounded text-xs ${
                  index === arr.length - 1 ? 'bg-primary/20 text-primary' : 'bg-muted/30'
                }`}>
                  {tool.toUpperCase()}
                </span>
                {index < arr.length - 1 && (
                  <ArrowRight className="w-3 h-3 text-muted-foreground/50" />
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
