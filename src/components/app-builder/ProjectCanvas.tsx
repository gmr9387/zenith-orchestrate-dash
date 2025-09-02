import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AppProject, ComponentConfig, ComponentLibraryItem } from '@/lib/app-builder-api';
import { Layers, Settings, Trash2, Plus } from 'lucide-react';

interface ProjectCanvasProps {
  project: AppProject;
  components: ComponentLibraryItem[];
  onUpdateProject: (updates: Partial<AppProject>) => void;
}

export function ProjectCanvas({ project, components, onUpdateProject }: ProjectCanvasProps) {
  const [selectedComponent, setSelectedComponent] = useState<ComponentConfig | null>(null);
  const [draggedLibraryComponent, setDraggedLibraryComponent] = useState<ComponentLibraryItem | null>(null);

  const handleDragStart = (component: ComponentLibraryItem) => {
    setDraggedLibraryComponent(component);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedLibraryComponent) {
      const newComponent: ComponentConfig = {
        id: Date.now().toString(),
        type: draggedLibraryComponent.type,
        name: draggedLibraryComponent.name,
        props: {},
        styles: {}
      };
      
      const updatedComponents = [...project.components, newComponent];
      onUpdateProject({ components: updatedComponents });
      setDraggedLibraryComponent(null);
    }
  };

  const handleDeleteComponent = (componentId: string) => {
    const updatedComponents = project.components.filter(c => c.id !== componentId);
    onUpdateProject({ components: updatedComponents });
    if (selectedComponent?.id === componentId) {
      setSelectedComponent(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
      {/* Component Library Sidebar */}
      <div className="lg:col-span-1">
        <Card className="glass-card h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Components
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 overflow-y-auto">
            {components.slice(0, 10).map((component) => (
              <motion.div
                key={component.id}
                draggable
                onDragStart={() => handleDragStart(component)}
                whileHover={{ scale: 1.02 }}
                className="p-3 border rounded-lg cursor-move bg-background hover:bg-accent"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center">
                    <Layers className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{component.name}</p>
                    <p className="text-xs text-muted-foreground">{component.category}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Canvas Area */}
      <div className="lg:col-span-2">
        <Card className="glass-card h-full">
          <CardHeader>
            <CardTitle>Canvas</CardTitle>
          </CardHeader>
          <CardContent className="h-full">
            <div
              className="border-2 border-dashed border-muted-foreground/20 rounded-lg h-full p-4 relative"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
            >
              {project.components.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <Layers className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">Empty Canvas</h3>
                    <p className="text-sm">Drag components from the library to start building</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {project.components.map((component) => (
                    <motion.div
                      key={component.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => setSelectedComponent(component)}
                      className={`p-4 border rounded-lg cursor-pointer bg-background ${
                        selectedComponent?.id === component.id 
                          ? 'border-primary ring-2 ring-primary/20' 
                          : 'hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Layers className="w-4 h-4 text-primary" />
                          <span className="font-medium">{component.name}</span>
                          <span className="text-xs text-muted-foreground">({component.type})</span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteComponent(component.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="mt-2 p-2 bg-muted rounded text-xs">
                        Component placeholder - {component.name}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Properties Panel */}
      <div className="lg:col-span-1">
        <Card className="glass-card h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Properties
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedComponent ? (
              <ComponentProperties 
                component={selectedComponent}
                onUpdate={(updates) => {
                  const updatedComponents = project.components.map(c =>
                    c.id === selectedComponent.id ? { ...c, ...updates } : c
                  );
                  onUpdateProject({ components: updatedComponents });
                  setSelectedComponent({ ...selectedComponent, ...updates });
                }}
              />
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <Settings className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Select a component to edit properties</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface ComponentPropertiesProps {
  component: ComponentConfig;
  onUpdate: (updates: Partial<ComponentConfig>) => void;
}

function ComponentProperties({ component, onUpdate }: ComponentPropertiesProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-medium mb-2">Component: {component.name}</h3>
        <p className="text-sm text-muted-foreground">Type: {component.type}</p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium">Name</label>
          <input
            type="text"
            value={component.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
          />
        </div>

        <div>
          <label className="text-sm font-medium">CSS Classes</label>
          <input
            type="text"
            placeholder="Add custom classes"
            className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Custom Styles</label>
          <textarea
            placeholder="Add custom CSS"
            rows={4}
            className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
          />
        </div>
      </div>

      <div className="pt-4 border-t">
        <h4 className="font-medium text-sm mb-2">Actions</h4>
        <div className="space-y-2">
          <Button size="sm" variant="outline" className="w-full">
            Duplicate Component
          </Button>
          <Button size="sm" variant="outline" className="w-full">
            Export Component
          </Button>
        </div>
      </div>
    </div>
  );
}