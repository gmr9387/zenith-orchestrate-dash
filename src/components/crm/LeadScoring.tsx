import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { leadScoringApi } from '@/lib/crm-advanced-api';
import { TrendingUp, Award, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

export function LeadScoring() {
  const [topLeads, setTopLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadTopLeads();
  }, []);

  const loadTopLeads = async () => {
    try {
      const data = await leadScoringApi.getTopLeads(20);
      setTopLeads(data || []);
    } catch (error: any) {
      toast({ title: 'Error loading leads', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Hot Lead';
    if (score >= 50) return 'Warm Lead';
    return 'Cold Lead';
  };

  if (loading) return <div className="text-center py-8">Loading lead scores...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Award className="h-6 w-6" />
          Lead Scoring
        </h2>
        <Button onClick={loadTopLeads} variant="outline">
          Refresh Scores
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/10 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Hot Leads</p>
              <p className="text-2xl font-bold">
                {topLeads.filter(l => l.score >= 80).length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-500/10 rounded-lg">
              <TrendingUp className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Warm Leads</p>
              <p className="text-2xl font-bold">
                {topLeads.filter(l => l.score >= 50 && l.score < 80).length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Leads</p>
              <p className="text-2xl font-bold">{topLeads.length}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="p-6 space-y-4">
          <h3 className="font-semibold text-lg">Top Leads</h3>
          <div className="space-y-3">
            {topLeads.map((lead) => (
              <div key={lead.id} className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-semibold">
                        {lead.contacts?.first_name} {lead.contacts?.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {lead.contacts?.email}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${getScoreColor(lead.score)}`}>
                        {lead.score}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {getScoreLabel(lead.score)}
                      </p>
                    </div>
                  </div>
                  <Progress value={lead.score} className="h-2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
