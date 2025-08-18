import { ReactNode, useState } from "react";
import { ExternalLink, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface ToolCardProps {
  title: string;
  description: string;
  image: string;
  icon: ReactNode;
  metrics?: Array<{ label: string; value: string; color?: string }>;
  actions?: Array<{ label: string; icon: ReactNode; variant?: "default" | "secondary" | "outline"; onClick?: () => void }>;
  children?: ReactNode;
  className?: string;
  onOpen?: () => void;
}

export function ToolCard({ 
  title, 
  description, 
  image, 
  icon, 
  metrics = [], 
  actions = [],
  children,
  className = "",
  onOpen
}: ToolCardProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  return (
    <div className={`tool-card group ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
            {icon}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <ExternalLink
          className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:text-primary"
          onClick={onOpen}
          aria-label={`Open ${title}`}
        />
      </div>

      {/* Preview Image/Content */}
      <div className="relative mb-4 overflow-hidden rounded-xl">
        <img 
          src={image} 
          alt={title}
          className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute bottom-4 left-4 right-4">
            <Button
              size="sm"
              className="w-full bg-white/20 border-white/30 text-white hover:bg-white/30 backdrop-blur-sm"
              onClick={() => setPreviewOpen(true)}
            >
              <Play className="h-4 w-4 mr-2" />
              Quick Preview
            </Button>
          </div>
        </div>
      </div>

      {/* Custom Children Content */}
      {children}

      {/* Metrics */}
      {metrics.length > 0 && (
        <div className="grid grid-cols-2 gap-4 mb-4">
          {metrics.map((metric, index) => (
            <div key={index} className="text-center">
              <div className={`text-xl font-bold ${metric.color || 'text-foreground'}`}>
                {metric.value}
              </div>
              <div className="text-xs text-muted-foreground">{metric.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      {actions.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {actions.map((action, index) => (
            <Button 
              key={index}
              size="sm" 
              variant={action.variant || "default"}
              className="flex-1 min-w-0"
              onClick={action.onClick}
            >
              {action.icon}
              <span className="ml-2 truncate">{action.label}</span>
            </Button>
          ))}
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{title} — Quick Preview</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <div className="rounded-lg overflow-hidden">
            <img src={image} alt={`${title} preview`} className="w-full h-auto" />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}