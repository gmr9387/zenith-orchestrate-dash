import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <Card className={`glass-card ${className || ''}`}>
      <CardContent className="flex flex-col items-center justify-center text-center py-12 px-6">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 animate-float">
          <Icon className="w-10 h-10 text-primary" />
        </div>
        
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground mb-6 max-w-md">{description}</p>
        
        {action && (
          <Button onClick={action.onClick} variant="premium" size="lg">
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
