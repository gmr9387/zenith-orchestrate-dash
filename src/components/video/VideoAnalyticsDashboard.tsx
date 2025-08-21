import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, Eye, Clock, Star } from 'lucide-react';
import { VideoAnalytics } from '@/lib/video-api';

interface VideoAnalyticsDashboardProps {
  analytics: VideoAnalytics;
}

export const VideoAnalyticsDashboard: React.FC<VideoAnalyticsDashboardProps> = ({ analytics }) => {
  return (
    <div className="space-y-6">
      {/* Views Over Time Chart */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Views Over Time
          </CardTitle>
          <CardDescription>
            Video views trend analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.viewsOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="date" 
                stroke="hsl(var(--muted-foreground))" 
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))" 
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="views" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Performing Videos */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Top Performing Videos
          </CardTitle>
          <CardDescription>
            Your most viewed content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.topVideos.map((video, index) => (
              <div key={video.id} className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center font-bold text-primary-foreground">
                  {index + 1}
                </div>
                
                <div className="flex-1">
                  <h4 className="font-medium">{video.title}</h4>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {video.views.toLocaleString()} views
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {Math.round(video.watchTime / 3600)}h watch time
                    </span>
                  </div>
                </div>
                
                <Badge variant="outline">
                  {((video.watchTime / video.views) / 60).toFixed(1)}m avg
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Watch Time Distribution */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Watch Time Distribution</CardTitle>
          <CardDescription>
            Total watch time by video performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.topVideos.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="title" 
                stroke="hsl(var(--muted-foreground))" 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))" 
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
                formatter={(value: number) => [`${Math.round(value / 3600)}h`, 'Watch Time']}
              />
              <Bar 
                dataKey="watchTime" 
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Key Metrics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Engagement Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Average View Duration</span>
              <span className="font-medium">
                {Math.round(analytics.averageWatchTime / 60)}m {analytics.averageWatchTime % 60}s
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Content Hours</span>
              <span className="font-medium">
                {Math.round(analytics.totalWatchTime / 3600)}h
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">Views per Video</span>
              <span className="font-medium">
                {analytics.totalVideos > 0 ? Math.round(analytics.totalViews / analytics.totalVideos) : 0}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Performance Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Most Viewed Video</span>
              <span className="font-medium">
                {analytics.topVideos[0]?.views.toLocaleString() || 0} views
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">Content Library Size</span>
              <span className="font-medium">{analytics.totalVideos} videos</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Engagement</span>
              <span className="font-medium">
                {(analytics.totalWatchTime / analytics.totalViews / 60).toFixed(1)}m avg
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};