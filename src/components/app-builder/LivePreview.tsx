import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AppProject } from '@/lib/app-builder-api';
import { appBuilderApi } from '@/lib/app-builder-api';
import { useToast } from '@/hooks/use-toast';
import { Monitor, Tablet, Smartphone, RefreshCw, ExternalLink } from 'lucide-react';

interface LivePreviewProps {
  project: AppProject;
}

export function LivePreview({ project }: LivePreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadPreview();
  }, [project.id]);

  const loadPreview = async () => {
    setLoading(true);
    try {
      const preview = await appBuilderApi.getPreview(project.id);
      setPreviewUrl(preview.previewUrl);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load preview",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getPreviewDimensions = () => {
    switch (viewMode) {
      case 'mobile':
        return { width: '375px', height: '667px' };
      case 'tablet':
        return { width: '768px', height: '1024px' };
      default:
        return { width: '100%', height: '100%' };
    }
  };

  const dimensions = getPreviewDimensions();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{project.name}</h2>
          <p className="text-muted-foreground">{project.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={
            project.status === 'published' ? 'default' :
            project.status === 'building' ? 'secondary' :
            project.status === 'error' ? 'destructive' : 'outline'
          }>
            {project.status}
          </Badge>
          <Button variant="outline" size="sm" onClick={loadPreview} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {project.publishedUrl && (
            <Button size="sm" asChild>
              <a href={project.publishedUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                View Live
              </a>
            </Button>
          )}
        </div>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Live Preview</CardTitle>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant={viewMode === 'desktop' ? 'default' : 'outline'}
                onClick={() => setViewMode('desktop')}
              >
                <Monitor className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'tablet' ? 'default' : 'outline'}
                onClick={() => setViewMode('tablet')}
              >
                <Tablet className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'mobile' ? 'default' : 'outline'}
                onClick={() => setViewMode('mobile')}
              >
                <Smartphone className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            <div
              className="border rounded-lg overflow-hidden shadow-lg bg-white transition-all duration-300"
              style={{
                width: dimensions.width,
                height: viewMode === 'desktop' ? '600px' : dimensions.height,
                maxWidth: '100%',
                maxHeight: '80vh'
              }}
            >
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : previewUrl ? (
                <iframe
                  src={previewUrl}
                  className="w-full h-full border-0"
                  title={`${project.name} preview`}
                  sandbox="allow-scripts allow-same-origin"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <Monitor className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">No Preview Available</h3>
                    <p className="text-sm">Build your project to generate a preview</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base">Project Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Components:</span>
              <span>{project.components.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created:</span>
              <span>{new Date(project.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Updated:</span>
              <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base">Build Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <Badge variant="outline">{project.status}</Badge>
            </div>
            {project.buildUrl && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Build URL:</span>
                <a 
                  href={project.buildUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  View
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base">Deployment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {project.publishedUrl ? (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge>Live</Badge>
                </div>
                <Button size="sm" className="w-full" asChild>
                  <a href={project.publishedUrl} target="_blank" rel="noopener noreferrer">
                    Visit Site
                  </a>
                </Button>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-2">Not deployed</p>
                <Button size="sm" variant="outline" className="w-full">
                  Deploy Project
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}