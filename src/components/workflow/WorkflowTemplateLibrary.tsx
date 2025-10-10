import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { workflowTemplateApi } from '@/lib/workflow-advanced-api';
import { Search, Download, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function WorkflowTemplateLibrary({ onUseTemplate }: { onUseTemplate?: (template: any) => void }) {
  const [templates, setTemplates] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const data = await workflowTemplateApi.getPublicTemplates();
      setTemplates(data || []);
    } catch (error: any) {
      toast({ title: 'Error loading templates', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleUseTemplate = async (templateId: string) => {
    try {
      const template = await workflowTemplateApi.useTemplate(templateId);
      toast({ title: 'Template loaded successfully' });
      onUseTemplate?.(template);
    } catch (error: any) {
      toast({ title: 'Error using template', description: error.message, variant: 'destructive' });
    }
  };

  const filteredTemplates = templates.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search workflow templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading templates...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{template.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                </div>
              </div>
              {template.category && (
                <Badge variant="secondary">{template.category}</Badge>
              )}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Download className="h-4 w-4" />
                  {template.downloads} uses
                </div>
                <Button onClick={() => handleUseTemplate(template.id)}>
                  Use Template
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
