import { Bell, CheckCircle, Clock, Zap } from "lucide-react";

const activities = [
  {
    id: 1,
    type: "workflow",
    title: "CRM Lead → Tutorial Generation → Video Creation",
    description: "New lead automatically processed through complete content pipeline",
    time: "2 minutes ago",
    status: "completed",
    icon: Zap
  },
  {
    id: 2,
    type: "integration",
    title: "Salesforce API Integration Active",
    description: "Successfully synced 847 contacts with CRM suite",
    time: "15 minutes ago", 
    status: "active",
    icon: CheckCircle
  },
  {
    id: 3,
    type: "tutorial",
    title: "Tutorial: 'Advanced CRM Workflows' Generated",
    description: "AI-powered tutorial ready for client onboarding",
    time: "1 hour ago",
    status: "ready",
    icon: Bell
  },
  {
    id: 4,
    type: "workflow",
    title: "Video Processing Pipeline Running",
    description: "Rendering 4 promotional videos for Q4 campaign",
    time: "2 hours ago",
    status: "processing",
    icon: Clock
  }
];

export function ActivityFeed() {
  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Live Activity Feed</h3>
        <div className="flex items-center gap-2">
          <div className="status-indicator bg-success"></div>
          <span className="text-sm text-muted-foreground">All systems operational</span>
        </div>
      </div>

      <div className="space-y-4">
        {activities.map((activity, index) => (
          <div 
            key={activity.id} 
            className="flex items-start gap-4 p-4 rounded-xl hover:bg-muted/30 transition-all duration-300 animate-slide-up"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex-shrink-0 p-2 rounded-lg bg-primary/10">
              <activity.icon className="h-5 w-5 text-primary" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-sm font-medium text-foreground truncate">{activity.title}</h4>
                <span className={`
                  text-xs px-2 py-1 rounded-full
                  ${activity.status === 'completed' ? 'bg-success/20 text-success' : ''}
                  ${activity.status === 'active' ? 'bg-primary/20 text-primary' : ''}
                  ${activity.status === 'ready' ? 'bg-warning/20 text-warning' : ''}
                  ${activity.status === 'processing' ? 'bg-muted/50 text-muted-foreground' : ''}
                `}>
                  {activity.status}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-2">{activity.description}</p>
              <span className="text-xs text-muted-foreground">{activity.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}