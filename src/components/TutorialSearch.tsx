import { useState, useEffect } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight, Play, Clock, Star, Eye, Plus, MoreHorizontal, Edit, Trash2, EyeOff, Globe, Lock } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { tutorialManager, TutorialSearchParams, TutorialSearchResponse, Tutorial } from '../lib/tutorials';
import { TutorialForm } from './TutorialForm';

interface TutorialSearchProps {
  onTutorialSelect?: (tutorial: Tutorial) => void;
  className?: string;
}

export const TutorialSearch = ({ onTutorialSelect, className = '' }: TutorialSearchProps) => {
  const [searchParams, setSearchParams] = useState<TutorialSearchParams>({
    query: '',
    page: 1,
    limit: 12,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  
  const [searchResults, setSearchResults] = useState<TutorialSearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);

  const performSearch = async () => {
    setIsLoading(true);
    try {
      const results = await tutorialManager.searchTutorials(searchParams);
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
      // You could add toast notification here
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    performSearch();
  }, [searchParams]);

  const handleSearch = (query: string) => {
    setSearchParams(prev => ({ ...prev, query, page: 1 }));
  };

  const handleFilterChange = (key: keyof TutorialSearchParams, value: any) => {
    setSearchParams(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setSearchParams(prev => ({ ...prev, page }));
  };

  const handleTutorialClick = (tutorial: Tutorial) => {
    onTutorialSelect?.(tutorial);
  };

  const handleTutorialSave = (tutorial: Tutorial) => {
    // Refresh search results after creating/updating
    performSearch();
  };

  const handleDeleteTutorial = async (tutorialId: string) => {
    if (!confirm('Are you sure you want to delete this tutorial? This action cannot be undone.')) {
      return;
    }

    try {
      await tutorialManager.deleteTutorial(tutorialId);
      performSearch(); // Refresh results
    } catch (error) {
      console.error('Failed to delete tutorial:', error);
      alert('Failed to delete tutorial. Please try again.');
    }
  };

  const handlePublishToggle = async (tutorial: Tutorial) => {
    try {
      if (tutorial.isPublished) {
        await tutorialManager.unpublishTutorial(tutorial._id!);
      } else {
        await tutorialManager.publishTutorial(tutorial._id!);
      }
      performSearch(); // Refresh results
    } catch (error) {
      console.error('Failed to toggle publish status:', error);
      alert('Failed to update tutorial status. Please try again.');
    }
  };

  const renderTutorialCard = (tutorial: Tutorial) => (
    <div
      key={tutorial._id}
      className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-all duration-200 cursor-pointer group relative"
      onClick={() => handleTutorialClick(tutorial)}
    >
      {/* Action Menu */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => {
              e.stopPropagation();
              setSelectedTutorial(tutorial);
            }}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => {
              e.stopPropagation();
              handlePublishToggle(tutorial);
            }}>
              {tutorial.isPublished ? (
                <>
                  <EyeOff className="mr-2 h-4 w-4" />
                  Unpublish
                </>
              ) : (
                <>
                  <Eye className="mr-2 h-4 w-4" />
                  Publish
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteTutorial(tutorial._id!);
              }}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Thumbnail */}
      <div className="aspect-video bg-muted rounded-md mb-3 flex items-center justify-center overflow-hidden">
        {tutorial.thumbnailUrl ? (
          <img
            src={tutorial.thumbnailUrl}
            alt={tutorial.title}
            className="w-full h-full object-cover rounded-md group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
            <Play className="h-8 w-8 text-blue-400" />
          </div>
        )}
      </div>
      
      {/* Status Badge */}
      <div className="flex items-center gap-2 mb-2">
        {tutorial.isPublished ? (
          <Badge variant="default" className="text-xs">
            <Eye className="mr-1 h-3 w-3" />
            Published
          </Badge>
        ) : (
          <Badge variant="secondary" className="text-xs">
            <EyeOff className="mr-1 h-3 w-3" />
            Draft
          </Badge>
        )}
        
        {tutorial.isPublic ? (
          <Badge variant="outline" className="text-xs">
            <Globe className="mr-1 h-3 w-3" />
            Public
          </Badge>
        ) : (
          <Badge variant="outline" className="text-xs">
            <Lock className="mr-1 h-3 w-3" />
            Private
          </Badge>
        )}
      </div>
      
      {/* Title and Description */}
      <h3 className="font-semibold text-sm mb-2 line-clamp-2 group-hover:text-primary transition-colors">
        {tutorial.title}
      </h3>
      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
        {tutorial.description}
      </p>
      
      {/* Tags */}
      {tutorial.tags && tutorial.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {tutorial.tags.slice(0, 3).map((tag, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {tutorial.tags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{tutorial.tags.length - 3}
            </Badge>
          )}
        </div>
      )}
      
      {/* Category and Difficulty */}
      <div className="flex items-center gap-2 mb-3">
        <Badge variant="secondary" className="text-xs">
          {tutorial.difficulty}
        </Badge>
        <Badge variant="outline" className="text-xs">
          {tutorial.category}
        </Badge>
      </div>
      
      {/* Stats */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>{tutorial.estimatedDuration}m</span>
        </div>
        <div className="flex items-center gap-1">
          <Star className="h-3 w-3 fill-current" />
          <span>{tutorial.rating?.average?.toFixed(1) || '0.0'}</span>
        </div>
        <div className="flex items-center gap-1">
          <Eye className="h-3 w-3" />
          <span>{tutorial.viewCount || 0}</span>
        </div>
      </div>

      {/* Steps Count */}
      <div className="mt-2 pt-2 border-t border-border">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{tutorial.steps?.length || 0} steps</span>
          <span className="text-primary font-medium">
            {tutorial.completionStats?.completionRate ? 
              `${Math.round(tutorial.completionStats.completionRate)}% completion` : 
              'New'
            }
          </span>
        </div>
      </div>
    </div>
  );

  const renderPagination = () => {
    if (!searchResults?.pagination) return null;
    
    const { page, totalPages } = searchResults.pagination;
    const pages = [];
    
    // Show max 5 pages around current page
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, page + 2);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return (
      <div className="flex items-center justify-center gap-2 mt-8">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        {start > 1 && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(1)}
            >
              1
            </Button>
            {start > 2 && <span className="px-2">...</span>}
          </>
        )}
        
        {pages.map(pageNum => (
          <Button
            key={pageNum}
            variant={pageNum === page ? "default" : "outline"}
            size="sm"
            onClick={() => handlePageChange(pageNum)}
          >
            {pageNum}
          </Button>
        ))}
        
        {end < totalPages && (
          <>
            {end < totalPages - 1 && <span className="px-2">...</span>}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(totalPages)}
            >
              {totalPages}
            </Button>
          </>
        )}
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(page + 1)}
          disabled={page >= totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Search Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tutorials..."
              value={searchParams.query}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
          </Button>
        </div>
        
        <TutorialForm onSave={handleTutorialSave} />
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-muted/30 border border-border rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select
                value={searchParams.category || ''}
                onValueChange={(value) => handleFilterChange('category', value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All categories</SelectItem>
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
              <label className="text-sm font-medium">Difficulty</label>
              <Select
                value={searchParams.difficulty || ''}
                onValueChange={(value) => handleFilterChange('difficulty', value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All difficulties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All difficulties</SelectItem>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Sort By</label>
              <Select
                value={searchParams.sortBy || 'createdAt'}
                onValueChange={(value) => handleFilterChange('sortBy', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="createdAt">Date Created</SelectItem>
                  <SelectItem value="updatedAt">Date Updated</SelectItem>
                  <SelectItem value="rating">Rating</SelectItem>
                  <SelectItem value="viewCount">Views</SelectItem>
                  <SelectItem value="estimatedDuration">Duration</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Order</label>
              <Select
                value={searchParams.sortOrder || 'desc'}
                onValueChange={(value) => handleFilterChange('sortOrder', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Ascending</SelectItem>
                  <SelectItem value="desc">Descending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="published-only"
                checked={searchParams.isPublished === true}
                onCheckedChange={(checked) => 
                  handleFilterChange('isPublished', checked ? true : undefined)
                }
              />
              <label htmlFor="published-only" className="text-sm">
                Published only
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="public-only"
                checked={searchParams.isPublic === true}
                onCheckedChange={(checked) => 
                  handleFilterChange('isPublic', checked ? true : undefined)
                }
              />
              <label htmlFor="public-only" className="text-sm">
                Public only
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Search Results */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-lg p-4 animate-pulse">
                <div className="aspect-video bg-muted rounded-md mb-3" />
                <div className="h-4 bg-muted rounded mb-2" />
                <div className="h-3 bg-muted rounded mb-3" />
                <div className="h-3 bg-muted rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : searchResults ? (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {((searchResults.pagination.page - 1) * searchResults.pagination.limit) + 1} to{' '}
                {Math.min(searchResults.pagination.page * searchResults.pagination.limit, searchResults.pagination.total)} of{' '}
                {searchResults.pagination.total} tutorials
              </p>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {searchResults.tutorials.filter(t => t.isPublished).length} published
                </span>
                <span className="text-sm text-muted-foreground">
                  {searchResults.tutorials.filter(t => !t.isPublished).length} drafts
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {searchResults.tutorials.map(renderTutorialCard)}
            </div>
            
            {renderPagination()}
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No tutorials found. Try adjusting your search criteria or create your first tutorial!
          </div>
        )}
      </div>

      {/* Edit Tutorial Dialog */}
      {selectedTutorial && (
        <TutorialForm
          tutorial={selectedTutorial}
          mode="edit"
          onSave={handleTutorialSave}
          onCancel={() => setSelectedTutorial(null)}
        />
      )}
    </div>
  );
};