import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Calendar, TrendingUp } from 'lucide-react';
import { crmApi, Deal } from '@/lib/crm-api';

export const DealTracking: React.FC = () => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDeals();
  }, []);

  const loadDeals = async () => {
    try {
      const response = await crmApi.getDeals({ limit: 50 });
      setDeals(response.data.deals);
    } catch (error) {
      console.error('Failed to load deals:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {deals.map((deal) => (
          <Card key={deal.id} className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg">{deal.title}</CardTitle>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                <span>${deal.value.toLocaleString()}</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Badge>{deal.stage}</Badge>
                <p className="text-sm text-muted-foreground">{deal.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};