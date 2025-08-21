import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/auth';
import { 
  Code, 
  Layout, 
  Palette, 
  Play,
  Download,
  Eye,
  Plus,
  Settings,
  Smartphone,
  Monitor,
  Tablet,
  Globe,
  Zap,
  Calendar
} from 'lucide-react';

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  thumbnail: string;
  components: any[];
}

interface Project {
  id: string;
  name: string;
  description: string;
  templateId: string;
  templateName: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface Component {
  id: string;
  name: string;
  type: string;
  category: string;
  props: any;
  code: string;
}

const AppBuilder: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [components, setComponents] = useState<Component[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('templates');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadAppBuilderData();
  }, []);

  const loadAppBuilderData = async () => {
    try {
      setLoading(true);
      
      // Load templates, projects, and components
      const [templatesRes, projectsRes, componentsRes] = await Promise.all([
        apiClient.get('/app-builder/templates'),
        apiClient.get('/app-builder/projects'),
        apiClient.get('/app-builder/components')
      ]);

      setTemplates(templatesRes.data || []);
      setProjects(projectsRes.data || []);
      setComponents(componentsRes.data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load app builder data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (templateId: string, name: string, description: string) => {
    try {
      const response = await apiClient.post('/app-builder/projects', {
        name,
        description,
        templateId
      });
      
      toast({
        title: "Success",
        description: "Project created successfully",
      });
      
      loadAppBuilderData();
      return response.data;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive",
      });
    }
  };

  const buildProject = async (projectId: string) => {
    try {
      const response = await apiClient.post(`/app-builder/projects/${projectId}/build`);
      
      toast({
        title: "Success",
        description: "Project built successfully",
      });
      
      return response.data;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to build project",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">App Builder</h1>
          <p className="text-gray-600">Create and deploy custom applications</p>
        </div>
        <Button className="bg-purple-600 hover:bg-purple-700">
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </Button>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="projects">My Projects</TabsTrigger>
          <TabsTrigger value="components">Components</TabsTrigger>
          <TabsTrigger value="builder">Builder</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <Card key={template.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-full h-32 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center mb-4">
                    <Layout className="w-12 h-12 text-purple-600" />
                  </div>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">{template.category}</Badge>
                    <Button 
                      size="sm"
                      onClick={() => setSelectedTemplate(template)}
                    >
                      Use Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card key={project.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                      <CardDescription>{project.description}</CardDescription>
                    </div>
                    <Badge variant={project.status === 'published' ? 'default' : 'secondary'}>
                      {project.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <Layout className="w-4 h-4 mr-2" />
                      {project.templateName}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      {new Date(project.updatedAt).toLocaleDateString()}
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4 mr-2" />
                        Preview
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => buildProject(project.id)}
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        Build
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="components" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {components.map((component) => (
              <Card key={component.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="w-full h-16 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-lg flex items-center justify-center mb-2">
                    <Code className="w-6 h-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-sm">{component.name}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <Badge variant="outline" className="text-xs">
                    {component.type}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="builder" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Visual App Builder</CardTitle>
              <CardDescription>Drag and drop components to build your app</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-12 gap-4 h-96">
                {/* Component Palette */}
                <div className="col-span-3 border rounded-lg p-4">
                  <h3 className="font-semibold mb-3">Components</h3>
                  <div className="space-y-2">
                    <div className="p-2 border rounded cursor-pointer hover:bg-gray-50">
                      <div className="flex items-center">
                        <Layout className="w-4 h-4 mr-2" />
                        <span className="text-sm">Container</span>
                      </div>
                    </div>
                    <div className="p-2 border rounded cursor-pointer hover:bg-gray-50">
                      <div className="flex items-center">
                        <Code className="w-4 h-4 mr-2" />
                        <span className="text-sm">Button</span>
                      </div>
                    </div>
                    <div className="p-2 border rounded cursor-pointer hover:bg-gray-50">
                      <div className="flex items-center">
                        <Input className="w-4 h-4 mr-2" />
                        <span className="text-sm">Input</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Canvas */}
                <div className="col-span-6 border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">Canvas</h3>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        <Smartphone className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Tablet className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Monitor className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="h-80 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <Layout className="w-12 h-12 mx-auto mb-2" />
                      <p>Drag components here to build your app</p>
                    </div>
                  </div>
                </div>

                {/* Properties Panel */}
                <div className="col-span-3 border rounded-lg p-4">
                  <h3 className="font-semibold mb-3">Properties</h3>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm">Width</Label>
                      <Input placeholder="100%" />
                    </div>
                    <div>
                      <Label className="text-sm">Height</Label>
                      <Input placeholder="auto" />
                    </div>
                    <div>
                      <Label className="text-sm">Background</Label>
                      <Input placeholder="#ffffff" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Project Dialog */}
      <Dialog open={!!selectedTemplate} onOpenChange={() => setSelectedTemplate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Create a new project using the {selectedTemplate?.name} template
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="project-name">Project Name</Label>
              <Input id="project-name" placeholder="My Awesome App" />
            </div>
            <div>
              <Label htmlFor="project-description">Description</Label>
              <Textarea 
                id="project-description" 
                placeholder="Describe your project..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedTemplate(null)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (selectedTemplate) {
                  createProject(selectedTemplate.id, "New Project", "Project description");
                  setSelectedTemplate(null);
                }
              }}
            >
              Create Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AppBuilder;