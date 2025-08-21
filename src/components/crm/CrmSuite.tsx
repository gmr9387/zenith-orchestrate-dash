import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  UserPlus, 
  TrendingUp, 
  DollarSign,
  Target,
  Activity,
  Calendar,
  Phone,
  Mail,
  Plus
} from 'lucide-react';
import { crmApi, CrmMetrics } from '@/lib/crm-api';
import { ContactManagement } from './ContactManagement';
import { LeadPipeline } from './LeadPipeline';
import { DealTracking } from './DealTracking';
import { ActivityFeed } from './ActivityFeed';

export const CrmSuite: React.FC = () => {
  const [metrics, setMetrics] = useState<CrmMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const response = await crmApi.getMetrics();
      setMetrics(response.data);
    } catch (error) {
      console.error('Failed to load CRM metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">CRM Suite</h1>
          <p className="text-muted-foreground">
            Manage contacts, leads, and deals with powerful automation
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline">
            <UserPlus className="mr-2 h-4 w-4" />
            Add Contact
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Lead
          </Button>
        </div>
      </div>

      {/* Metrics Overview */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalContacts.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Active relationships
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Leads</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalLeads}</div>
              <p className="text-xs text-muted-foreground">
                {(metrics.conversionRate * 100).toFixed(1)}% conversion rate
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${metrics.pipelineValue.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                ${metrics.averageDealSize.toLocaleString()} avg deal
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.activitiesThisWeek}</div>
              <p className="text-xs text-muted-foreground">
                Activities completed
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main CRM Interface */}
      <Tabs defaultValue="contacts" className="space-y-4">
        <TabsList className="glass-card">
          <TabsTrigger value="contacts" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Contacts
          </TabsTrigger>
          <TabsTrigger value="leads" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Leads
          </TabsTrigger>
          <TabsTrigger value="deals" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Deals
          </TabsTrigger>
          <TabsTrigger value="activities" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Activities
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contacts">
          <ContactManagement />
        </TabsContent>

        <TabsContent value="leads">
          <LeadPipeline />
        </TabsContent>

        <TabsContent value="deals">
          <DealTracking />
        </TabsContent>

        <TabsContent value="activities">
          <ActivityFeed />
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common CRM tasks and shortcuts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4">
              <Phone className="h-6 w-6" />
              <span className="text-sm">Log Call</span>
            </Button>
            
            <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4">
              <Mail className="h-6 w-6" />
              <span className="text-sm">Send Email</span>
            </Button>
            
            <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4">
              <Calendar className="h-6 w-6" />
              <span className="text-sm">Schedule Meeting</span>
            </Button>
            
            <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4">
              <TrendingUp className="h-6 w-6" />
              <span className="text-sm">View Reports</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};