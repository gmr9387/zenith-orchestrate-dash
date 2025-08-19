import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { TutorialSearch } from '../components/TutorialSearch';
import { StepManagement } from '../components/StepManagement';
import { StorageConfig } from '../components/StorageConfig';
import WorkflowEngine from '../components/WorkflowEngine';
import VideoPlatform from '../components/VideoPlatform';
import ApiGateway from '../components/ApiGateway';
import { 
  BookOpen, 
  Users, 
  TrendingUp, 
  Settings, 
  Workflow,
  Video,
  Code,
  Zap,
  Target,
  Crown,
  Star,
  Award
} from 'lucide-react';

const TutorialBuilder: React.FC = () => {
  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Enterprise Tutorial Builder
        </h1>
        <p className="text-gray-600">
          Professional-grade platform for creating, managing, and optimizing tutorials with enterprise features
        </p>
      </div>

      {/* Enterprise Features Overview */}
      <div className="mb-8">
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Crown className="h-6 w-6" />
              Enterprise Features
            </CardTitle>
            <CardDescription>
              Zilliance provides enterprise-grade tools that rival the best in the industry
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 border border-primary/20 rounded-lg bg-white/50">
                <Workflow className="h-8 w-8 mx-auto mb-2 text-primary" />
                <h3 className="font-semibold text-sm mb-1">Workflow Engine</h3>
                <p className="text-xs text-muted-foreground">
                  Rivals Zapier & Integromat
                </p>
              </div>
              
              <div className="text-center p-4 border border-primary/20 rounded-lg bg-white/50">
                <Video className="h-8 w-8 mx-auto mb-2 text-primary" />
                <h3 className="font-semibold text-sm mb-1">Video Platform</h3>
                <p className="text-xs text-muted-foreground">
                  Rivals Vimeo & YouTube
                </p>
              </div>
              
              <div className="text-center p-4 border border-primary/20 rounded-lg bg-white/50">
                <Code className="h-8 w-8 mx-auto mb-2 text-primary" />
                <h3 className="font-semibold text-sm mb-1">API Gateway</h3>
                <p className="text-xs text-muted-foreground">
                  Rivals Postman & Insomnia
                </p>
              </div>
              
              <div className="text-center p-4 border border-primary/20 rounded-lg bg-white/50">
                <Zap className="h-8 w-8 mx-auto mb-2 text-primary" />
                <h3 className="font-semibold text-sm mb-1">Smart Automation</h3>
                <p className="text-xs text-muted-foreground">
                  AI-powered workflows
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tutorials</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">
              +2 from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Steps</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">
              +12 from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Workflows</CardTitle>
            <Workflow className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">
              +3 from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Video Assets</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">47</div>
            <p className="text-xs text-muted-foreground">
              +15 from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Enterprise Platform</CardTitle>
          <CardDescription>
            Access all enterprise features for professional tutorial creation and management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="tutorials" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="tutorials" className="flex items-center space-x-2">
                <BookOpen className="h-4 w-4" />
                <span>Tutorials</span>
                <Badge variant="secondary">24</Badge>
              </TabsTrigger>
              <TabsTrigger value="steps" className="flex items-center space-x-2">
                <Target className="h-4 w-4" />
                <span>Steps</span>
                <Badge variant="secondary">156</Badge>
              </TabsTrigger>
              <TabsTrigger value="workflows" className="flex items-center space-x-2">
                <Workflow className="h-4 w-4" />
                <span>Workflows</span>
                <Badge variant="secondary">8</Badge>
              </TabsTrigger>
              <TabsTrigger value="videos" className="flex items-center space-x-2">
                <Video className="h-4 w-4" />
                <span>Videos</span>
                <Badge variant="secondary">47</Badge>
              </TabsTrigger>
              <TabsTrigger value="api" className="flex items-center space-x-2">
                <Code className="h-4 w-4" />
                <span>API</span>
                <Badge variant="secondary">12</Badge>
              </TabsTrigger>
              <TabsTrigger value="storage" className="flex items-center space-x-2">
                <Settings className="h-4 w-4" />
                <span>Storage</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tutorials" className="mt-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">Tutorial Management</h3>
                <p className="text-muted-foreground">
                  Create, edit, and manage your tutorial content with enterprise-grade tools
                </p>
              </div>
              <TutorialSearch />
            </TabsContent>

            <TabsContent value="steps" className="mt-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">Step Management</h3>
                <p className="text-muted-foreground">
                  Organize and structure your tutorial steps for optimal learning experience
                </p>
              </div>
              <StepManagement />
            </TabsContent>

            <TabsContent value="workflows" className="mt-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">Workflow Automation</h3>
                <p className="text-muted-foreground">
                  Build powerful automation workflows that rival Zapier and Integromat
                </p>
              </div>
              <WorkflowEngine />
            </TabsContent>

            <TabsContent value="videos" className="mt-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">Video Platform</h3>
                <p className="text-muted-foreground">
                  Professional video hosting and streaming platform with enterprise features
                </p>
              </div>
              <VideoPlatform />
            </TabsContent>

            <TabsContent value="api" className="mt-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">API Gateway</h3>
                <p className="text-muted-foreground">
                  Advanced API testing and management platform for developers
                </p>
              </div>
              <ApiGateway />
            </TabsContent>

            <TabsContent value="storage" className="mt-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">Storage Configuration</h3>
                <p className="text-muted-foreground">
                  Configure S3-compatible storage for your media assets
                </p>
              </div>
              <StorageConfig />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Enterprise Benefits */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Why Choose Zilliance Enterprise?
            </CardTitle>
            <CardDescription>
              See how we stack up against the competition
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 border rounded-lg">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Workflow className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-2">vs. Zapier/Integromat</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  More powerful workflow engine with visual builder and advanced automation
                </p>
                <Badge variant="default">Winner</Badge>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Video className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold mb-2">vs. Vimeo/YouTube</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Better analytics, monetization, and enterprise features
                </p>
                <Badge variant="default">Winner</Badge>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Code className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold mb-2">vs. Postman/Insomnia</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Integrated API testing with workflow automation and better collaboration
                </p>
                <Badge variant="default">Winner</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default TutorialBuilder;