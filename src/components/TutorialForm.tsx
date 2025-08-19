import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, Plus, Edit, Save } from 'lucide-react';
import { tutorialManager, Tutorial } from '../lib/tutorials';

interface TutorialFormProps {
  tutorial?: Tutorial;
  onSave?: (tutorial: Tutorial) => void;
  onCancel?: () => void;
  mode?: 'create' | 'edit';
  trigger?: React.ReactNode;
}

export const TutorialForm: React.FC<TutorialFormProps> = ({
  tutorial,
  onSave,
  onCancel,
  mode = 'create',
  trigger
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'business' as const,
    difficulty: 'beginner' as const,
    estimatedDuration: 30,
    tags: '',
    isPublished: false,
    isPublic: true,
  });

  useEffect(() => {
    if (tutorial && mode === 'edit') {
      setFormData({
        title: tutorial.title,
        description: tutorial.description,
        category: tutorial.category,
        difficulty: tutorial.difficulty,
        estimatedDuration: tutorial.estimatedDuration,
        tags: tutorial.tags.join(', '),
        isPublished: tutorial.isPublished || false,
        isPublic: tutorial.isPublic || true,
      });
    }
  }, [tutorial, mode]);

  const handleInputChange = (key: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const tutorialData = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        steps: [],
      };

      let result: Tutorial;

      if (mode === 'create') {
        result = await tutorialManager.createTutorial(tutorialData);
        setSuccess('Tutorial created successfully!');
      } else {
        if (!tutorial?._id) throw new Error('Tutorial ID is required for editing');
        result = await tutorialManager.updateTutorial(tutorial._id, tutorialData);
        setSuccess('Tutorial updated successfully!');
      }

      // Clear success message after 2 seconds
      setTimeout(() => {
        setSuccess('');
        if (onSave) {
          onSave(result);
        }
        setIsOpen(false);
      }, 2000);

    } catch (error) {
      console.error('Failed to save tutorial:', error);
      setError(error instanceof Error ? error.message : 'Failed to save tutorial');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    setIsOpen(false);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'business',
      difficulty: 'beginner',
      estimatedDuration: 30,
      tags: '',
      isPublished: false,
      isPublic: true,
    });
    setError('');
    setSuccess('');
  };

  const defaultTrigger = mode === 'create' ? (
    <Button>
      <Plus className="mr-2 h-4 w-4" />
      Create Tutorial
    </Button>
  ) : (
    <Button variant="outline" size="sm">
      <Edit className="mr-2 h-4 w-4" />
      Edit
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild onClick={() => resetForm()}>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create New Tutorial' : 'Edit Tutorial'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter tutorial title"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe what this tutorial covers"
              rows={3}
              required
            />
          </div>

          {/* Category and Difficulty */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value: any) => handleInputChange('category', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="development">Development</SelectItem>
                  <SelectItem value="design">Design</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty *</Label>
              <Select
                value={formData.difficulty}
                onValueChange={(value: any) => handleInputChange('difficulty', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Duration and Tags */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Estimated Duration (minutes) *</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                max="480"
                value={formData.estimatedDuration}
                onChange={(e) => handleInputChange('estimatedDuration', parseInt(e.target.value) || 30)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => handleInputChange('tags', e.target.value)}
                placeholder="tag1, tag2, tag3"
              />
              <p className="text-xs text-muted-foreground">
                Separate tags with commas
              </p>
            </div>
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Settings</Label>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isPublished"
                checked={formData.isPublished}
                onChange={(e) => handleInputChange('isPublished', e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="isPublished" className="text-sm">
                Publish immediately
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isPublic"
                checked={formData.isPublic}
                onChange={(e) => handleInputChange('isPublic', e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="isPublic" className="text-sm">
                Make public
              </Label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            
            <Button
              type="submit"
              disabled={isLoading || !formData.title || !formData.description}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === 'create' ? 'Creating...' : 'Saving...'}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {mode === 'create' ? 'Create Tutorial' : 'Save Changes'}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};