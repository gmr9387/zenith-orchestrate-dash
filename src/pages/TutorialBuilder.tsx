import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import TutorialSearch from '../components/TutorialSearch';
import StepManagement from '../components/StepManagement';
import StorageConfig from '../components/StorageConfig';
import { BookOpen, Users, TrendingUp, Settings } from 'lucide-react';

const TutorialBuilder: React.FC = () => {
  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Tutorial Builder
        </h1>
        <p className="text-gray-600">
          Create, manage, and optimize your tutorials with powerful tools
        </p>
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
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89%</div>
            <p className="text-xs text-muted-foreground">
              +5% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Tutorial Management</CardTitle>
          <CardDescription>
            Manage your tutorials, steps, and storage configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="tutorials" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="tutorials" className="flex items-center space-x-2">
                <BookOpen className="h-4 w-4" />
                <span>Tutorials</span>
                <Badge variant="secondary">24</Badge>
              </TabsTrigger>
              <TabsTrigger value="steps" className="flex items-center space-x-2">
                <BookOpen className="h-4 w-4" />
                <span>Steps</span>
                <Badge variant="secondary">156</Badge>
              </TabsTrigger>
              <TabsTrigger value="storage" className="flex items-center space-x-2">
                <Settings className="h-4 w-4" />
                <span>Storage</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tutorials" className="mt-6">
              <TutorialSearch />
            </TabsContent>

            <TabsContent value="steps" className="mt-6">
              <StepManagement />
            </TabsContent>

            <TabsContent value="storage" className="mt-6">
              <StorageConfig />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </>
  );
};

export default TutorialBuilder;