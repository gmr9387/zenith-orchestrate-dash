import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { tutorialTemplateApi } from '@/lib/tutorial-advanced-api';
import { Search, Download, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function TemplateMarketplace({ onUseTemplate }: { onUseTemplate?: (template: any) => void }) {
  const [templates, setTemplates] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const data = await tutorialTemplateApi.getPublicTemplates();
      setTemplates(data || []);
    } catch (error: any) {
      toast({ title: 'Error loading templates', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.description?.toLowerCase().includes(search.toLowerCase()) ||
    t.tags?.some((tag: string) => tag.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
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
              {template.thumbnail_url && (
                <img
                  src={template.thumbnail_url}
                  alt={template.title}
                  className="w-full h-40 object-cover rounded-lg"
                />
              )}
              <div>
                <h3 className="font-semibold text-lg">{template.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {template.tags?.map((tag: string) => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Download className="h-4 w-4" />
                    {template.downloads}
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-current" />
                    {template.rating.toFixed(1)}
                  </span>
                </div>
                <Button onClick={() => onUseTemplate?.(template)}>
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
