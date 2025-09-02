import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ComponentLibraryItem } from '@/lib/app-builder-api';
import { Search, Code, Eye } from 'lucide-react';

interface ComponentLibraryProps {
  components: ComponentLibraryItem[];
}

export function ComponentLibrary({ components }: ComponentLibraryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedComponent, setSelectedComponent] = useState<ComponentLibraryItem | null>(null);

  const categories = Array.from(new Set(components.map(c => c.category)));

  const filteredComponents = components.filter(component =>
    component.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    component.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    component.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const componentsByCategory = categories.reduce((acc, category) => {
    acc[category] = filteredComponents.filter(c => c.category === category);
    return acc;
  }, {} as Record<string, ComponentLibraryItem[]>);

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search components..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Tabs defaultValue={categories[0]} className="space-y-4">
            <TabsList className="grid grid-cols-3 lg:grid-cols-6">
              {categories.slice(0, 6).map(category => (
                <TabsTrigger key={category} value={category} className="text-xs">
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>

            {categories.map(category => (
              <TabsContent key={category} value={category}>
                <div className="grid gap-4 md:grid-cols-2">
                  <AnimatePresence>
                    {componentsByCategory[category]?.map((component) => (
                      <motion.div
                        key={component.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        whileHover={{ scale: 1.02 }}
                        className="cursor-pointer"
                        onClick={() => setSelectedComponent(component)}
                      >
                        <Card className="glass-card hover-lift">
                          <div className="aspect-video relative overflow-hidden rounded-t-lg">
                            <img
                              src={component.thumbnail}
                              alt={component.name}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-2 right-2">
                              <Badge variant="secondary">{component.category}</Badge>
                            </div>
                          </div>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base">{component.name}</CardTitle>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {component.description}
                            </p>
                          </CardHeader>
                          <CardContent>
                            <div className="flex flex-wrap gap-1">
                              {component.tags.slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {component.tags.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{component.tags.length - 3}
                                </Badge>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>

        <div className="lg:col-span-1">
          {selectedComponent ? (
            <ComponentDetails component={selectedComponent} />
          ) : (
            <Card className="glass-card">
              <CardContent className="flex items-center justify-center h-64 text-muted-foreground">
                <div className="text-center">
                  <Eye className="w-8 h-8 mx-auto mb-2" />
                  <p>Select a component to view details</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

interface ComponentDetailsProps {
  component: ComponentLibraryItem;
}

function ComponentDetails({ component }: ComponentDetailsProps) {
  const [activeTab, setActiveTab] = useState('preview');

  return (
    <Card className="glass-card h-fit">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {component.name}
          <Badge variant="secondary">{component.category}</Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">{component.description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="code">Code</TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="space-y-4">
            {component.examples.map((example, index) => (
              <div key={index} className="space-y-2">
                <h4 className="font-medium">{example.name}</h4>
                <div className="border rounded-lg p-4 bg-background">
                  <div dangerouslySetInnerHTML={{ __html: example.preview }} />
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="code" className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Code className="w-4 h-4" />
                Component Code
              </h4>
              <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
                <code>{component.code}</code>
              </pre>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Props</h4>
              <div className="space-y-2">
                {component.props.map((prop, index) => (
                  <div key={index} className="border rounded p-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono">{prop.name}</code>
                      <Badge variant="outline" className="text-xs">{prop.type}</Badge>
                      {prop.required && <Badge variant="destructive" className="text-xs">required</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">{prop.description}</p>
                    {prop.default && (
                      <p className="text-xs">
                        <span className="text-muted-foreground">Default:</span>{' '}
                        <code>{String(prop.default)}</code>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="pt-2">
          <h4 className="font-medium mb-2">Tags</h4>
          <div className="flex flex-wrap gap-1">
            {component.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}