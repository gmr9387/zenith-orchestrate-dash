import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  BarChart3, TrendingUp, Users, BookOpen, Eye, Clock,
  Download, Filter, Calendar, Target, Activity, Award
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { toast } from '@/components/ui/sonner';

interface ReportMetrics {
  totalUsers: number;
  activeUsers: number;
  totalTutorials: number;
  completionRate: number;
  averageTime: number;
  revenue: number;
  growth: {
    users: number;
    tutorials: number;
    revenue: number;
  };
}

interface TutorialAnalytics {
  id: string;
  title: string;
  views: number;
  completions: number;
  averageTime: number;
  rating: number;
  dropoffRate: number;
}

interface UserAnalytics {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  retentionRate: number;
  topRegions: Array<{ region: string; count: number }>;
}

const Reports: React.FC = () => {
  const [metrics, setMetrics] = useState<ReportMetrics | null>(null);
  const [tutorialAnalytics, setTutorialAnalytics] = useState<TutorialAnalytics[]>([]);
  const [userAnalytics, setUserAnalytics] = useState<UserAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');
  const [reportType, setReportType] = useState('overview');

  useEffect(() => {
    loadReportData();
  }, [dateRange]);

  const loadReportData = async () => {
    try {
      setLoading(true);
      
      // Load metrics
      const metricsResponse = await apiClient.get(`/reports/metrics?range=${dateRange}`);
      if (metricsResponse.success && metricsResponse.data) {
        setMetrics(metricsResponse.data as ReportMetrics);
      }

      // Load tutorial analytics
      const tutorialResponse = await apiClient.get(`/reports/tutorials?range=${dateRange}`);
      if (tutorialResponse.success && tutorialResponse.data) {
        setTutorialAnalytics(tutorialResponse.data as TutorialAnalytics[]);
      }

      // Load user analytics
      const userResponse = await apiClient.get(`/reports/users?range=${dateRange}`);
      if (userResponse.success && userResponse.data) {
        setUserAnalytics(userResponse.data as UserAnalytics);
      }
    } catch (error) {
      console.error('Failed to load report data:', error);
      toast('Failed to load reports', { description: 'Please try again later' });
      
      // Mock data for development
      setMetrics({
        totalUsers: 1234,
        activeUsers: 892,
        totalTutorials: 156,
        completionRate: 78.5,
        averageTime: 847,
        revenue: 45670,
        growth: { users: 12, tutorials: 8, revenue: 23 }
      });
      
      setTutorialAnalytics([
        { id: '1', title: 'Getting Started Guide', views: 2456, completions: 1987, averageTime: 12.5, rating: 4.8, dropoffRate: 8.2 },
        { id: '2', title: 'Advanced Features', views: 1876, completions: 1234, averageTime: 18.7, rating: 4.6, dropoffRate: 15.3 },
        { id: '3', title: 'Integration Setup', views: 1543, completions: 987, averageTime: 25.4, rating: 4.4, dropoffRate: 22.1 }
      ]);
      
      setUserAnalytics({
        totalUsers: 1234,
        activeUsers: 892,
        newUsers: 156,
        retentionRate: 84.2,
        topRegions: [
          { region: 'North America', count: 567 },
          { region: 'Europe', count: 345 },
          { region: 'Asia Pacific', count: 234 }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async () => {
    try {
      const response = await apiClient.get(`/reports/export?type=${reportType}&range=${dateRange}`);
      if (response.success) {
        // Create download link
        const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `zilliance-report-${reportType}-${dateRange}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast('Report exported successfully');
      }
    } catch (error) {
      toast('Export failed', { description: 'Please try again later' });
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-white/10 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-white/10 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Advanced Reports</h1>
            <p className="text-purple-200">Comprehensive analytics and insights for your platform</p>
          </div>
          
          <div className="flex gap-3">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40 bg-white/10 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
            
            <Button onClick={exportReport} variant="outline" className="border-white/20 text-white hover:bg-white/10">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Key Metrics Grid */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="glass-card border-purple-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-purple-200 flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  Total Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{metrics.totalUsers.toLocaleString()}</div>
                <div className="flex items-center text-sm text-green-400">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +{metrics.growth.users}% vs last period
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-purple-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-purple-200 flex items-center">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Tutorials Created
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{metrics.totalTutorials}</div>
                <div className="flex items-center text-sm text-green-400">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +{metrics.growth.tutorials}% vs last period
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-purple-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-purple-200 flex items-center">
                  <Target className="w-4 h-4 mr-2" />
                  Completion Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{metrics.completionRate}%</div>
                <Progress value={metrics.completionRate} className="mt-2" />
              </CardContent>
            </Card>

            <Card className="glass-card border-purple-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-purple-200 flex items-center">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{formatCurrency(metrics.revenue)}</div>
                <div className="flex items-center text-sm text-green-400">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +{metrics.growth.revenue}% vs last period
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Detailed Analytics Tabs */}
        <Tabs value={reportType} onValueChange={setReportType} className="space-y-6">
          <TabsList className="bg-white/10 border-white/20">
            <TabsTrigger value="overview" className="data-[state=active]:bg-white/20">Overview</TabsTrigger>
            <TabsTrigger value="tutorials" className="data-[state=active]:bg-white/20">Tutorial Analytics</TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-white/20">User Analytics</TabsTrigger>
            <TabsTrigger value="engagement" className="data-[state=active]:bg-white/20">Engagement</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="glass-card border-purple-500/20">
                <CardHeader>
                  <CardTitle className="text-purple-200">Performance Summary</CardTitle>
                  <CardDescription className="text-purple-300">Key platform metrics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-purple-200">Active Users</span>
                    <span className="text-white font-semibold">{metrics?.activeUsers}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-purple-200">Avg. Session Time</span>
                    <span className="text-white font-semibold">{formatTime(metrics?.averageTime || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-purple-200">Success Rate</span>
                    <Badge variant="outline" className="text-green-400 border-green-400">
                      {metrics?.completionRate}%
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-purple-500/20">
                <CardHeader>
                  <CardTitle className="text-purple-200">Quick Actions</CardTitle>
                  <CardDescription className="text-purple-300">Generate detailed reports</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start" variant="outline">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Generate Usage Report
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Users className="w-4 h-4 mr-2" />
                    User Behavior Analysis
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Award className="w-4 h-4 mr-2" />
                    Performance Insights
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tutorials" className="space-y-6">
            <Card className="glass-card border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-purple-200">Tutorial Performance</CardTitle>
                <CardDescription className="text-purple-300">Detailed analytics for each tutorial</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tutorialAnalytics.map((tutorial) => (
                    <div key={tutorial.id} className="border border-white/10 rounded-lg p-4 hover:border-purple-400/40 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-semibold text-white">{tutorial.title}</h4>
                        <Badge variant="outline" className="text-yellow-400 border-yellow-400">
                          ★ {tutorial.rating}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div>
                          <div className="text-purple-300">Views</div>
                          <div className="text-white font-semibold">{tutorial.views.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-purple-300">Completions</div>
                          <div className="text-white font-semibold">{tutorial.completions.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-purple-300">Avg. Time</div>
                          <div className="text-white font-semibold">{formatTime(tutorial.averageTime)}</div>
                        </div>
                        <div>
                          <div className="text-purple-300">Completion Rate</div>
                          <div className="text-white font-semibold">
                            {Math.round((tutorial.completions / tutorial.views) * 100)}%
                          </div>
                        </div>
                        <div>
                          <div className="text-purple-300">Drop-off Rate</div>
                          <div className="text-white font-semibold">{tutorial.dropoffRate}%</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            {userAnalytics && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="glass-card border-purple-500/20">
                  <CardHeader>
                    <CardTitle className="text-purple-200">User Statistics</CardTitle>
                    <CardDescription className="text-purple-300">User base insights</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-purple-200">Total Users</span>
                      <span className="text-white font-semibold">{userAnalytics.totalUsers.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-purple-200">Active Users</span>
                      <span className="text-white font-semibold">{userAnalytics.activeUsers.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-purple-200">New Users</span>
                      <span className="text-white font-semibold">{userAnalytics.newUsers.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-purple-200">Retention Rate</span>
                      <Badge variant="outline" className="text-green-400 border-green-400">
                        {userAnalytics.retentionRate}%
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card border-purple-500/20">
                  <CardHeader>
                    <CardTitle className="text-purple-200">Top Regions</CardTitle>
                    <CardDescription className="text-purple-300">User distribution by region</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {userAnalytics.topRegions.map((region, index) => (
                      <div key={region.region} className="flex justify-between items-center">
                        <span className="text-purple-200">{region.region}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-white/10 rounded-full h-2">
                            <div 
                              className="bg-purple-400 h-2 rounded-full"
                              style={{ width: `${(region.count / userAnalytics.totalUsers) * 100}%` }}
                            />
                          </div>
                          <span className="text-white font-semibold w-12 text-right">{region.count}</span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="engagement" className="space-y-6">
            <Card className="glass-card border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-purple-200">Engagement Metrics</CardTitle>
                <CardDescription className="text-purple-300">User interaction and engagement data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white mb-2">4.7</div>
                    <div className="text-purple-200">Avg. Rating</div>
                    <div className="text-sm text-purple-400">+0.3 vs last period</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white mb-2">23m</div>
                    <div className="text-purple-200">Avg. Session</div>
                    <div className="text-sm text-purple-400">+2m vs last period</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white mb-2">67%</div>
                    <div className="text-purple-200">Return Rate</div>
                    <div className="text-sm text-purple-400">+8% vs last period</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Reports;