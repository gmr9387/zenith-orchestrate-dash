import { TrendingUp, Activity, Zap, BarChart3 } from "lucide-react";
import { toast } from "@/components/ui/sonner";

const metrics = [
  {
    label: "Active Workflows",
    value: "247",
    change: "+23%",
    trend: "up",
    icon: Zap,
    color: "text-primary"
  },
  {
    label: "Tutorials Generated",
    value: "1,847",
    change: "+156%",
    trend: "up", 
    icon: Activity,
    color: "text-success"
  },
  {
    label: "API Integrations",
    value: "89",
    change: "+12%",
    trend: "up",
    icon: BarChart3,
    color: "text-primary-glow"
  },
  {
    label: "Revenue Impact",
    value: "$847K",
    change: "+34%",
    trend: "up",
    icon: TrendingUp,
    color: "text-success"
  }
];

export function HeroMetrics() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {metrics.map((metric, index) => (
        <div 
          key={metric.label}
          className="hero-metric cursor-pointer"
          style={{ animationDelay: `${index * 0.1}s` }}
          onClick={() => toast(metric.label, { description: `${metric.value} (${metric.change})` })}
          role="button"
          tabIndex={0}
        >
          <div className="flex items-center justify-between mb-3">
            <metric.icon className={`h-6 w-6 ${metric.color}`} />
            <div className="flex items-center gap-1">
              <span className="text-xs font-medium text-success">{metric.change}</span>
              <TrendingUp className="h-3 w-3 text-success" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-foreground">{metric.value}</div>
            <div className="text-sm text-muted-foreground">{metric.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}