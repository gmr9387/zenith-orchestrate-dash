import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { tutorialAnalyticsApi } from '@/lib/tutorial-advanced-api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Users, TrendingUp, Clock } from 'lucide-react';

export function AnalyticsDashboard({ tutorialId }: { tutorialId: string }) {
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [completionRate, setCompletionRate] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [tutorialId]);

  const loadAnalytics = async () => {
    try {
      const [data, rate] = await Promise.all([
        tutorialAnalyticsApi.getAnalytics(tutorialId),
        tutorialAnalyticsApi.getCompletionRate(tutorialId)
      ]);
      setAnalytics(data || []);
      setCompletionRate(rate);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const uniqueViews = new Set(analytics.filter(a => a.event_type === 'view').map(a => a.session_id)).size;
  const completions = analytics.filter(a => a.event_type === 'complete').length;
  const avgTimePerStep = analytics.reduce((acc, curr, idx, arr) => {
    if (idx === 0) return acc;
    const prevTime = new Date(arr[idx - 1].created_at).getTime();
    const currTime = new Date(curr.created_at).getTime();
    return acc + (currTime - prevTime) / 1000;
  }, 0) / Math.max(analytics.length - 1, 1);

  const stepDropoff = analytics
    .filter(a => a.event_type === 'drop_off')
    .reduce((acc: any, curr) => {
      const step = curr.step_index || 0;
      acc[step] = (acc[step] || 0) + 1;
      return acc;
    }, {});

  const dropoffData = Object.entries(stepDropoff).map(([step, count]) => ({
    step: `Step ${step}`,
    dropoffs: count
  }));

  if (loading) return <div className="text-center py-8">Loading analytics...</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Unique Views</p>
              <p className="text-2xl font-bold">{uniqueViews}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/10 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Completion Rate</p>
              <p className="text-2xl font-bold">{(completionRate * 100).toFixed(1)}%</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <Activity className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Completions</p>
              <p className="text-2xl font-bold">{completions}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-500/10 rounded-lg">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Time/Step</p>
              <p className="text-2xl font-bold">{avgTimePerStep.toFixed(0)}s</p>
            </div>
          </div>
        </Card>
      </div>

      {dropoffData.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Drop-off Points</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dropoffData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="step" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="dropoffs" fill="hsl(var(--destructive))" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  );
}
