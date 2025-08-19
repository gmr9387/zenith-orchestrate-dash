import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TutorialSearch } from '@/components/TutorialSearch';
import { StepManagement } from '@/components/StepManagement';
import { StorageConfig } from '@/components/StorageConfig';
import { Tutorial, TutorialStep } from '@/lib/tutorials';
import { Video, Settings, Search, Plus, Play, Users, TrendingUp } from 'lucide-react';

const TutorialBuilder = () => {
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);
  const [activeTab, setActiveTab] = useState('search');

  const handleTutorialSelect = (tutorial: Tutorial) => {
    setSelectedTutorial(tutorial);
    setActiveTab('steps');
  };

  const handleStepUpdate = () => {
    // Refresh tutorial data if needed
    if (selectedTutorial) {
      // You could reload the tutorial data here
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                Tutorial Builder
              </div>
              <Badge variant="secondary" className="text-xs">
                AI-Powered
              </Badge>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Tutorial
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Video className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Tutorials</p>
                  <p className="text-2xl font-bold">1,847</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-success/10 rounded-lg">
                  <Play className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Sessions</p>
                  <p className="text-2xl font-bold">89</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-warning/10 rounded-lg">
                  <Users className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Learners</p>
                  <p className="text-2xl font-bold">12.4K</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Rating</p>
                  <p className="text-2xl font-bold">4.8</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Browse Tutorials
            </TabsTrigger>
            <TabsTrigger 
              value="steps" 
              className="flex items-center gap-2"
              disabled={!selectedTutorial}
            >
              <Play className="h-4 w-4" />
              Manage Steps
            </TabsTrigger>
            <TabsTrigger value="storage" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Storage Config
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Browse Tutorials Tab */}
          <TabsContent value="search" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Browse Tutorials</h2>
              <p className="text-muted-foreground">
                Search and discover tutorials from the community or create your own
              </p>
            </div>
            
            <TutorialSearch onTutorialSelect={handleTutorialSelect} />
          </TabsContent>

          {/* Manage Steps Tab */}
          <TabsContent value="steps" className="space-y-6">
            {selectedTutorial ? (
              <>
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">{selectedTutorial.title}</h2>
                    <p className="text-muted-foreground mb-4">{selectedTutorial.description}</p>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <Badge variant="secondary">{selectedTutorial.difficulty}</Badge>
                      <Badge variant="outline">{selectedTutorial.category}</Badge>
                      <span className="text-muted-foreground">
                        {selectedTutorial.estimatedDuration} min • {selectedTutorial.steps.length} steps
                      </span>
                    </div>
                  </div>
                  
                  <Button variant="outline" onClick={() => setActiveTab('search')}>
                    Back to Search
                  </Button>
                </div>
                
                <StepManagement 
                  tutorialId={selectedTutorial.id} 
                  onStepUpdate={handleStepUpdate}
                />
              </>
            ) : (
              <div className="text-center py-12">
                <Video className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Tutorial Selected</h3>
                <p className="text-muted-foreground mb-4">
                  Select a tutorial from the Browse tab to manage its steps
                </p>
                <Button onClick={() => setActiveTab('search')}>
                  Browse Tutorials
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Storage Configuration Tab */}
          <TabsContent value="storage" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Storage Configuration</h2>
              <p className="text-muted-foreground">
                Configure your S3-compatible storage for tutorial media and file uploads
              </p>
            </div>
            
            <StorageConfig />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Tutorial Analytics</h2>
              <p className="text-muted-foreground">
                Track performance and engagement metrics for your tutorials
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Popular Tutorials</CardTitle>
                  <CardDescription>
                    Your most viewed and highest-rated content
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                        <div className="w-12 h-8 bg-primary/20 rounded border border-primary/30 flex items-center justify-center">
                          <Play className="h-3 w-3 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium">Tutorial {i}</div>
                          <div className="text-xs text-muted-foreground">
                            {Math.floor(Math.random() * 1000) + 100} views • {Math.floor(Math.random() * 5) + 1} min
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {Math.floor(Math.random() * 5) + 1}.{Math.floor(Math.random() * 10)}★
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Learning Progress</CardTitle>
                  <CardDescription>
                    Completion rates and learner engagement
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Overall Completion</span>
                      <span className="text-lg font-bold text-success">78%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-success h-2 rounded-full" style={{ width: '78%' }}></div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Avg. Time to Complete</span>
                      <span className="text-lg font-bold">12.4 min</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Active Learners</span>
                      <span className="text-lg font-bold text-primary">234</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default TutorialBuilder;