import { useEffect, useRef } from "react";

interface Node {
  id: string;
  x: number;
  y: number;
  radius: number;
  color: string;
  label: string;
}

interface Edge {
  from: string;
  to: string;
  animated: boolean;
}

const nodes: Node[] = [
  { id: "salesforce", x: 50, y: 100, radius: 8, color: "#6366f1", label: "Salesforce" },
  { id: "hubspot", x: 200, y: 60, radius: 6, color: "#22c55e", label: "HubSpot" },
  { id: "stripe", x: 180, y: 140, radius: 7, color: "#f59e0b", label: "Stripe" },
  { id: "slack", x: 120, y: 180, radius: 5, color: "#8b5cf6", label: "Slack" },
  { id: "zilliance", x: 125, y: 100, radius: 12, color: "#a855f7", label: "Zilliance" },
];

const edges: Edge[] = [
  { from: "salesforce", to: "zilliance", animated: true },
  { from: "hubspot", to: "zilliance", animated: true },
  { from: "stripe", to: "zilliance", animated: false },
  { from: "zilliance", to: "slack", animated: true },
];

export function NetworkVisualization() {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    // Animate the network connections
    const interval = setInterval(() => {
      const connections = svg.querySelectorAll('.network-edge');
      connections.forEach((connection, index) => {
        setTimeout(() => {
          connection.classList.add('animate-pulse');
          setTimeout(() => {
            connection.classList.remove('animate-pulse');
          }, 1000);
        }, index * 200);
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox="0 0 250 220"
        className="w-full h-40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Render edges */}
        {edges.map((edge, index) => {
          const fromNode = nodes.find(n => n.id === edge.from);
          const toNode = nodes.find(n => n.id === edge.to);
          
          if (!fromNode || !toNode) return null;

          return (
            <line
              key={index}
              x1={fromNode.x}
              y1={fromNode.y}
              x2={toNode.x}
              y2={toNode.y}
              className={`network-edge ${edge.animated ? 'network-connection' : ''}`}
              stroke="url(#gradient)"
              strokeWidth="2"
              strokeDasharray={edge.animated ? "5,5" : "none"}
            />
          );
        })}

        {/* Render nodes */}
        {nodes.map((node) => (
          <g key={node.id}>
            <circle
              cx={node.x}
              cy={node.y}
              r={node.radius}
              fill={node.color}
              className={node.id === 'zilliance' ? 'network-node animate-glow' : 'network-node'}
              style={{
                filter: `drop-shadow(0 0 8px ${node.color}40)`
              }}
            />
            <text
              x={node.x}
              y={node.y + node.radius + 12}
              textAnchor="middle"
              className="text-xs fill-muted-foreground"
              fontSize="10"
            >
              {node.label}
            </text>
          </g>
        ))}

        {/* Gradient definition */}
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#a855f7" stopOpacity="1" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0.8" />
          </linearGradient>
        </defs>
      </svg>

      {/* Status indicators */}
      <div className="absolute top-2 right-2 flex gap-2">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
          <span className="text-xs text-muted-foreground">Live</span>
        </div>
      </div>
    </div>
  );
}