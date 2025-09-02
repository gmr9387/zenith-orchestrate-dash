import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { appBuilderApi, AppTemplate, AppProject, ComponentLibraryItem } from '@/lib/app-builder-api';
import { TemplateGallery } from './TemplateGallery';
import { ComponentLibrary } from './ComponentLibrary';
import { ProjectCanvas } from './ProjectCanvas';
import { LivePreview } from './LivePreview';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, FolderOpen, Settings, Play, Building } from 'lucide-react';

export function AppBuilder() {
  const [projects, setProjects] = useState<AppProject[]>([]);
  const [activeProject, setActiveProject] = useState<AppProject | null>(null);
  const [templates, setTemplates] = useState<AppTemplate[]>([]);
  const [components, setComponents] = useState<ComponentLibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('templates');
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [projectsRes, templatesRes, componentsRes] = await Promise.all([
        appBuilderApi.getProjects(),
        appBuilderApi.getTemplates(),
        appBuilderApi.getComponents()
      ]);
      setProjects(projectsRes.data.projects);
      setTemplates(templatesRes.data.templates);
      setComponents(componentsRes.data.components);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load app builder data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (name: string, description: string, templateId?: string) => {
    try {
      const newProject = await appBuilderApi.createProject({ name, description, templateId });
      setProjects(prev => [newProject.data, ...prev]);
      setActiveProject(newProject.data);
      setActiveTab('canvas');
      toast({
        title: "Success",
        description: "Project created successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive"
      });
    }
  };

  const handleBuildProject = async (projectId: string) => {
    try {
      const buildResult = await appBuilderApi.buildProject(projectId);
      toast({
        title: "Build Started",
        description: `Build ${buildResult.data.buildId} is in progress`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start build",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">App Builder</h1>
          <p className="text-muted-foreground">Build and deploy applications visually</p>
        </div>
        <div className="flex gap-2">
          {activeProject && (
            <>
              <Button
                variant="outline"
                onClick={() => handleBuildProject(activeProject.id)}
                disabled={activeProject.status === 'building'}
              >
                <Building className="w-4 h-4 mr-2" />
                {activeProject.status === 'building' ? 'Building...' : 'Build'}
              </Button>
              <Button
                onClick={() => setActiveTab('preview')}
              >
                <Play className="w-4 h-4 mr-2" />
                Preview
              </Button>
            </>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="components">Components</TabsTrigger>
          <TabsTrigger value="canvas" disabled={!activeProject}>Canvas</TabsTrigger>
          <TabsTrigger value="preview" disabled={!activeProject}>Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="templates">
          <TemplateGallery 
            templates={templates}
            onCreateProject={handleCreateProject}
          />
        </TabsContent>

        <TabsContent value="projects">
          <ProjectList 
            projects={projects}
            onSelectProject={setActiveProject}
            onCreateProject={handleCreateProject}
          />
        </TabsContent>

        <TabsContent value="components">
          <ComponentLibrary components={components} />
        </TabsContent>

        <TabsContent value="canvas">
          {activeProject && (
            <ProjectCanvas 
              project={activeProject}
              components={components}
              onUpdateProject={(updates) => setActiveProject({...activeProject, ...updates})}
            />
          )}
        </TabsContent>

        <TabsContent value="preview">
          {activeProject && (
            <LivePreview project={activeProject} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface ProjectListProps {
  projects: AppProject[];
  onSelectProject: (project: AppProject) => void;
  onCreateProject: (name: string, description: string) => void;
}

function ProjectList({ projects, onSelectProject, onCreateProject }: ProjectListProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim()) {
      onCreateProject(formData.name, formData.description);
      setFormData({ name: '', description: '' });
      setShowCreateForm(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Your Projects</h2>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </Button>
      </div>

      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Create New Project</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Project Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="My Awesome App"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="A brief description of your app"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit">Create Project</Button>
                    <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence>
          {projects.map((project) => (
            <motion.div
              key={project.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              whileHover={{ scale: 1.02 }}
              className="cursor-pointer"
              onClick={() => onSelectProject(project)}
            >
              <Card className="glass-card hover-lift">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <Badge variant={
                      project.status === 'published' ? 'default' :
                      project.status === 'building' ? 'secondary' :
                      project.status === 'error' ? 'destructive' : 'outline'
                    }>
                      {project.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{project.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Updated {new Date(project.updatedAt).toLocaleDateString()}</span>
                    <FolderOpen className="w-4 h-4" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}