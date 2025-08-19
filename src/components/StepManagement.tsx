import { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Play, FileText, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { tutorialManager, TutorialStep, StepSearchParams } from '@/lib/tutorials';

interface StepManagementProps {
  tutorialId: string;
  onStepUpdate?: () => void;
  className?: string;
}

export const StepManagement = ({ tutorialId, onStepUpdate, className = '' }: StepManagementProps) => {
  const [steps, setSteps] = useState<TutorialStep[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams, setSearchParams] = useState<StepSearchParams>({
    tutorialId,
    page: 1,
    limit: 20,
  });
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingStep, setEditingStep] = useState<TutorialStep | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    type: 'text' as const,
    order: 0,
    duration: 0,
  });

  const loadSteps = async () => {
    setIsLoading(true);
    try {
      const response = await tutorialManager.searchSteps(searchParams);
      setSteps(response.data);
    } catch (error) {
      console.error('Failed to load steps:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSteps();
  }, [searchParams]);

  const handleSearch = (query: string) => {
    setSearchParams(prev => ({ ...prev, query, page: 1 }));
  };

  const handleFilterChange = (key: keyof StepSearchParams, value: any) => {
    setSearchParams(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setSearchParams(prev => ({ ...prev, page }));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      content: '',
      type: 'text',
      order: 0,
      duration: 0,
    });
    setEditingStep(null);
  };

  const handleCreateStep = async () => {
    try {
      await tutorialManager.createStep({
        ...formData,
        tutorialId,
        isCompleted: false,
      });
      
      setIsCreateDialogOpen(false);
      resetForm();
      loadSteps();
      onStepUpdate?.();
    } catch (error) {
      console.error('Failed to create step:', error);
    }
  };

  const handleUpdateStep = async () => {
    if (!editingStep) return;
    
    try {
      await tutorialManager.updateStep(editingStep.id, formData);
      
      setEditingStep(null);
      resetForm();
      loadSteps();
      onStepUpdate?.();
    } catch (error) {
      console.error('Failed to update step:', error);
    }
  };

  const handleDeleteStep = async (stepId: string) => {
    if (!confirm('Are you sure you want to delete this step?')) return;
    
    try {
      await tutorialManager.deleteStep(stepId);
      loadSteps();
      onStepUpdate?.();
    } catch (error) {
      console.error('Failed to delete step:', error);
    }
  };

  const handleEditStep = (step: TutorialStep) => {
    setEditingStep(step);
    setFormData({
      title: step.title,
      description: step.description,
      content: step.content,
      type: step.type,
      order: step.order,
      duration: step.duration || 0,
    });
  };

  const renderStepCard = (step: TutorialStep) => (
    <div key={step.id} className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            Step {step.order}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {step.type}
          </Badge>
          {step.isCompleted && (
            <CheckCircle className="h-4 w-4 text-success" />
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditStep(step)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteStep(step.id)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <h3 className="font-semibold mb-2">{step.title}</h3>
      <p className="text-sm text-muted-foreground mb-3">{step.description}</p>
      
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>{step.duration || 0}s</span>
        </div>
        
        <div className="flex items-center gap-1">
          {step.type === 'video' && <Play className="h-3 w-3" />}
          {step.type === 'text' && <FileText className="h-3 w-3" />}
          <span>{step.type}</span>
        </div>
      </div>
    </div>
  );

  const renderPagination = () => {
    const totalPages = Math.ceil(steps.length / searchParams.limit);
    if (totalPages <= 1) return null;
    
    const currentPage = searchParams.page || 1;
    const pages = [];
    
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    
    return (
      <div className="flex items-center justify-center gap-2 mt-6">
        {pages.map(page => (
          <Button
            key={page}
            variant={page === currentPage ? "default" : "outline"}
            size="sm"
            onClick={() => handlePageChange(page)}
          >
            {page}
          </Button>
        ))}
      </div>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1">
          <h2 className="text-2xl font-bold mb-2">Tutorial Steps</h2>
          <p className="text-muted-foreground">Manage and organize your tutorial content</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Step
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Step</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Step title"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Type</label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="interactive">Interactive</SelectItem>
                      <SelectItem value="quiz">Quiz</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of this step"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Content</label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Step content or instructions"
                  rows={4}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Order</label>
                  <Input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
                    placeholder="0"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Duration (seconds)</label>
                  <Input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                    placeholder="0"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateStep}>
                  Create Step
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search steps..."
            value={searchParams.query || ''}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select
          value={searchParams.type || ''}
          onValueChange={(value) => handleFilterChange('type', value || undefined)}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All types</SelectItem>
            <SelectItem value="text">Text</SelectItem>
            <SelectItem value="video">Video</SelectItem>
            <SelectItem value="interactive">Interactive</SelectItem>
            <SelectItem value="quiz">Quiz</SelectItem>
          </SelectContent>
        </Select>
        
        <Select
          value={searchParams.isCompleted?.toString() || ''}
          onValueChange={(value) => handleFilterChange('isCompleted', value === '' ? undefined : value === 'true')}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All statuses</SelectItem>
            <SelectItem value="true">Completed</SelectItem>
            <SelectItem value="false">Not completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Steps Grid */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-lg p-4 animate-pulse">
                <div className="h-4 bg-muted rounded mb-2" />
                <div className="h-3 bg-muted rounded mb-3" />
                <div className="h-3 bg-muted rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : steps.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {steps.map(renderStepCard)}
            </div>
            {renderPagination()}
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No steps found. Create your first step to get started.
          </div>
        )}
      </div>

      {/* Edit Step Dialog */}
      {editingStep && (
        <Dialog open={!!editingStep} onOpenChange={() => setEditingStep(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Step</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Step title"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Type</label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="interactive">Interactive</SelectItem>
                      <SelectItem value="quiz">Quiz</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of this step"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Content</label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Step content or instructions"
                  rows={4}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Order</label>
                  <Input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
                    placeholder="0"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Duration (seconds)</label>
                  <Input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                    placeholder="0"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingStep(null)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateStep}>
                  Update Step
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};