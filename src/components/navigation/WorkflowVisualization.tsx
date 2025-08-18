import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Zap, ArrowRight, Clock, CheckCircle, AlertCircle } from "lucide-react";

interface Tool {
  id: string;
  name: string;
  icon: any;
  color: string;
  status: 'active' | 'processing' | 'idle';
}

interface WorkflowConnection {
  from: string;
  to: string;
  type: 'data' | 'trigger' | 'output';
  active: boolean;
  data?: string;
}

interface WorkflowVisualizationProps {
  show: boolean;
  tools: Tool[];
  currentTool: string;
}

export function WorkflowVisualization({ show, tools, currentTool }: WorkflowVisualizationProps) {
  const [connections, setConnections] = useState<WorkflowConnection[]>([]);
  const [activeWorkflows, setActiveWorkflows] = useState<any[]>([]);
  const [dataFlow, setDataFlow] = useState<any[]>([]);

  // Generate dynamic workflow connections
  useEffect(() => {
    const workflows: WorkflowConnection[] = [
      { from: 'hub', to: 'crm', type: 'data', active: true, data: 'Contact sync' },
      { from: 'crm', to: 'tutorial', type: 'trigger', active: true, data: 'New lead' },
      { from: 'tutorial', to: 'video', type: 'output', active: false, data: 'Tutorial export' },
      { from: 'workflow', to: 'hub', type: 'trigger', active: true, data: 'API call' },
      { from: 'builder', to: 'workflow', type: 'data', active: false, data: 'App deployment' },
      { from: 'video', to: 'crm', type: 'output', active: true, data: 'Client videos' }
    ];
    
    setConnections(workflows);
  }, []);

  // Simulate active workflows
  useEffect(() => {
    const workflows = [
      {
        id: 'wf-1',
        name: 'Lead Onboarding Automation',
        status: 'running',
        progress: 75,
        steps: ['CRM → Tutorial Builder → Video Creator'],
        lastRun: '2 minutes ago'
      },
      {
        id: 'wf-2',
        name: 'API Integration Health Check',
        status: 'completed',
        progress: 100,
        steps: ['API Hub → Workflow Engine → CRM'],
        lastRun: '5 minutes ago'
      },
      {
        id: 'wf-3',
        name: 'Client Presentation Pipeline',
        status: 'waiting',
        progress: 30,
        steps: ['Video Creator → CRM → Tutorial Builder'],
        lastRun: '1 hour ago'
      }
    ];
    
    setActiveWorkflows(workflows);
  }, []);

  // Simulate real-time data flow
  useEffect(() => {
    if (!show) return;

    const interval = setInterval(() => {
      setDataFlow(prev => [
        {
          id: Date.now(),
          from: connections[Math.floor(Math.random() * connections.length)]?.from || 'hub',
          to: connections[Math.floor(Math.random() * connections.length)]?.to || 'crm',
          data: ['User data', 'API response', 'File upload', 'Webhook trigger'][Math.floor(Math.random() * 4)],
          timestamp: new Date().toLocaleTimeString()
        },
        ...prev.slice(0, 9)
      ]);
    }, 3000);

    return () => clearInterval(interval);
  }, [show, connections]);

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-40 bg-background/95 backdrop-blur-xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-6 py-8 h-full overflow-auto">
          {/* Header */}
          <motion.div
            className="text-center mb-8"
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-foreground via-primary to-primary-glow bg-clip-text text-transparent">
              Cross-Tool Workflow Intelligence
            </h2>
            <p className="text-muted-foreground">
              Real-time visualization of data flows and automation across your Zilliance suite
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
            {/* Tool Network Map */}
            <motion.div
              className="lg:col-span-2 glass-card rounded-2xl p-6"
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Tool Network Map
              </h3>

              {/* Network Visualization */}
              <div className="relative h-96 rounded-xl bg-muted/10 overflow-hidden">
                <svg className="w-full h-full">
                  {/* Tool Nodes */}
                  {tools.map((tool, index) => {
                    const angle = (index * 2 * Math.PI) / tools.length;
                    const radius = 120;
                    const x = 200 + radius * Math.cos(angle);
                    const y = 150 + radius * Math.sin(angle);
                    
                    return (
                      <motion.g
                        key={tool.id}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                      >
                        <circle
                          cx={x}
                          cy={y}
                          r={tool.id === currentTool ? 25 : 20}
                          fill={tool.color}
                          fillOpacity={tool.id === currentTool ? 0.8 : 0.4}
                          stroke={tool.color}
                          strokeWidth={tool.id === currentTool ? 3 : 1}
                          className="transition-all duration-300"
                        />
                        <text
                          x={x}
                          y={y + 35}
                          textAnchor="middle"
                          className="text-xs fill-foreground"
                        >
                          {tool.name.split(' ')[0]}
                        </text>
                      </motion.g>
                    );
                  })}

                  {/* Connection Lines */}
                  {connections.map((conn, index) => {
                    const fromTool = tools.find(t => t.id === conn.from);
                    const toTool = tools.find(t => t.id === conn.to);
                    if (!fromTool || !toTool) return null;

                    const fromIndex = tools.indexOf(fromTool);
                    const toIndex = tools.indexOf(toTool);
                    
                    const fromAngle = (fromIndex * 2 * Math.PI) / tools.length;
                    const toAngle = (toIndex * 2 * Math.PI) / tools.length;
                    
                    const radius = 120;
                    const x1 = 200 + radius * Math.cos(fromAngle);
                    const y1 = 150 + radius * Math.sin(fromAngle);
                    const x2 = 200 + radius * Math.cos(toAngle);
                    const y2 = 150 + radius * Math.sin(toAngle);

                    return (
                      <motion.line
                        key={`${conn.from}-${conn.to}`}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke={conn.active ? fromTool.color : 'hsl(var(--muted))'}
                        strokeWidth={conn.active ? 3 : 1}
                        strokeDasharray={conn.active ? "5,5" : "none"}
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ delay: 0.8 + index * 0.1, duration: 0.5 }}
                        className={conn.active ? "animate-pulse" : ""}
                      />
                    );
                  })}
                </svg>

                {/* Data Flow Particles */}
                <AnimatePresence>
                  {dataFlow.slice(0, 3).map((flow, index) => (
                    <motion.div
                      key={flow.id}
                      className="absolute w-2 h-2 bg-primary rounded-full"
                      initial={{ x: 100, y: 100, opacity: 0 }}
                      animate={{ 
                        x: 300, 
                        y: 200, 
                        opacity: [0, 1, 0],
                        scale: [0.5, 1, 0.5]
                      }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 2, delay: index * 0.3 }}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Right Panel */}
            <div className="space-y-6">
              {/* Active Workflows */}
              <motion.div
                className="glass-card rounded-2xl p-4"
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  Active Workflows
                </h3>
                
                <div className="space-y-3">
                  {activeWorkflows.map((workflow, index) => (
                    <motion.div
                      key={workflow.id}
                      className="p-3 rounded-lg bg-muted/20 border border-border/50"
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {workflow.status === 'running' && (
                          <div className="w-2 h-2 bg-warning rounded-full animate-pulse" />
                        )}
                        {workflow.status === 'completed' && (
                          <CheckCircle className="w-4 h-4 text-success" />
                        )}
                        {workflow.status === 'waiting' && (
                          <AlertCircle className="w-4 h-4 text-muted-foreground" />
                        )}
                        <span className="text-sm font-medium">{workflow.name}</span>
                      </div>
                      
                      <div className="text-xs text-muted-foreground mb-2">
                        {workflow.steps[0]}
                      </div>
                      
                      <div className="flex items-center justify-between text-xs">
                        <span>{workflow.progress}% complete</span>
                        <span className="text-muted-foreground">{workflow.lastRun}</span>
                      </div>
                      
                      <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full ${
                            workflow.status === 'completed' ? 'bg-success' :
                            workflow.status === 'running' ? 'bg-warning' : 'bg-muted-foreground'
                          }`}
                          initial={{ width: 0 }}
                          animate={{ width: `${workflow.progress}%` }}
                          transition={{ delay: 0.8 + index * 0.1, duration: 0.5 }}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Real-time Data Flow */}
              <motion.div
                className="glass-card rounded-2xl p-4"
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-primary" />
                  Live Data Flow
                </h3>
                
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  <AnimatePresence mode="popLayout">
                    {dataFlow.map((flow, index) => (
                      <motion.div
                        key={flow.id}
                        className="flex items-center gap-2 p-2 rounded bg-muted/10 text-xs"
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -20, opacity: 0 }}
                        layout
                      >
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                        <span className="font-mono text-primary">{flow.from.toUpperCase()}</span>
                        <ArrowRight className="w-3 h-3 text-muted-foreground" />
                        <span className="font-mono text-success">{flow.to.toUpperCase()}</span>
                        <span className="text-muted-foreground ml-auto">{flow.timestamp}</span>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}