import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Zap } from "lucide-react";

interface Tool {
  id: string;
  name: string;
  icon: any;
  color: string;
  status: 'active' | 'processing' | 'idle';
}

interface FloatingToolSwitcherProps {
  tools: Tool[];
  currentTool: string;
  onToolChange: (toolId: string) => void;
}

export function FloatingToolSwitcher({ tools, currentTool, onToolChange }: FloatingToolSwitcherProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hoveredTool, setHoveredTool] = useState<string | null>(null);
  const [predictiveLoading, setPredictiveLoading] = useState<string[]>([]);

  // AI-powered predictive loading
  useEffect(() => {
    const predictions = {
      hub: ['workflow', 'crm'],
      tutorial: ['video', 'crm'],
      video: ['tutorial', 'workflow'],
      workflow: ['hub', 'crm'],
      builder: ['hub', 'workflow'],
      crm: ['tutorial', 'workflow']
    };
    
    setPredictiveLoading(predictions[currentTool as keyof typeof predictions] || []);
  }, [currentTool]);

  const currentToolData = tools.find(t => t.id === currentTool);

  return (
    <div className="relative">
      {/* Main Floating Pod */}
      <motion.div
        className="flex items-center gap-2 px-4 py-2 rounded-full glass-intense cursor-pointer"
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ 
          boxShadow: `0 8px 32px ${currentToolData?.color}20, 0 0 0 1px ${currentToolData?.color}30`
        }}
      >
        {/* Current Tool Icon */}
        {currentToolData && (
          <motion.div
            className="flex items-center gap-2"
            initial={false}
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <currentToolData.icon 
              className="w-5 h-5" 
              style={{ color: currentToolData.color }}
            />
            <span className="hidden sm:block font-medium">{currentToolData.name}</span>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </motion.div>
        )}

        {/* Processing Indicator */}
        {currentToolData?.status === 'processing' && (
          <motion.div
            className="w-2 h-2 rounded-full bg-warning"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}
      </motion.div>

      {/* Expanded Tool Grid */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 p-2 rounded-2xl glass-intense min-w-[320px]"
            initial={{ opacity: 0, scale: 0.8, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -10 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="grid grid-cols-3 gap-2">
              {tools.map((tool, index) => (
                <motion.button
                  key={tool.id}
                  className={`p-3 rounded-xl transition-all duration-300 group relative overflow-hidden ${
                    tool.id === currentTool 
                      ? 'bg-primary/20 border border-primary/30' 
                      : 'hover:bg-muted/30 border border-transparent'
                  }`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => {
                    onToolChange(tool.id);
                    setIsExpanded(false);
                  }}
                  onMouseEnter={() => setHoveredTool(tool.id)}
                  onMouseLeave={() => setHoveredTool(null)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {/* Background Glow */}
                  <motion.div
                    className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-20"
                    style={{ backgroundColor: tool.color }}
                    animate={{ opacity: hoveredTool === tool.id ? 0.2 : 0 }}
                    transition={{ duration: 0.3 }}
                  />

                  {/* Tool Content */}
                  <div className="relative z-10 flex flex-col items-center gap-2">
                    <tool.icon 
                      className="w-6 h-6 transition-colors duration-300" 
                      style={{ color: tool.id === currentTool ? tool.color : undefined }}
                    />
                    <div className="text-xs font-medium text-center">
                      {tool.name.split(' ')[0]}
                    </div>

                    {/* Status Indicator */}
                    <div className="flex items-center gap-1">
                      <div 
                        className={`w-1.5 h-1.5 rounded-full ${
                          tool.status === 'active' ? 'bg-success animate-pulse' :
                          tool.status === 'processing' ? 'bg-warning animate-pulse' :
                          'bg-muted'
                        }`}
                      />
                    </div>

                    {/* Predictive Loading Indicator */}
                    {predictiveLoading.includes(tool.id) && tool.id !== currentTool && (
                      <motion.div
                        className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-primary/60"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}
                  </div>

                  {/* Quick Action Hint */}
                  <AnimatePresence>
                    {hoveredTool === tool.id && tool.id !== currentTool && (
                      <motion.div
                        className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-muted-foreground whitespace-nowrap bg-background/90 px-2 py-1 rounded"
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                      >
                        Switch to {tool.name}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="mt-3 pt-3 border-t border-border/50">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Quick Switch</span>
                <div className="flex items-center gap-1">
                  <span>Tab</span>
                  <span>+</span>
                  <span>1-6</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}