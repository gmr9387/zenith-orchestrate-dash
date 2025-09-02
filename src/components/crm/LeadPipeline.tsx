import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  Plus, 
  DollarSign, 
  Calendar, 
  User, 
  TrendingUp,
  Target,
  Clock,
  Filter,
  Search,
  MoreHorizontal
} from 'lucide-react';
import { crmApi, Lead } from '@/lib/crm-api';

interface PipelineStage {
  id: string;
  name: string;
  color: string;
  leads: Lead[];
}

export const LeadPipeline: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);

  const stages: PipelineStage[] = [
    { id: 'new', name: 'New Leads', color: 'bg-blue-500', leads: [] },
    { id: 'qualified', name: 'Qualified', color: 'bg-yellow-500', leads: [] },
    { id: 'proposal', name: 'Proposal', color: 'bg-orange-500', leads: [] },
    { id: 'negotiation', name: 'Negotiation', color: 'bg-purple-500', leads: [] },
    { id: 'closed-won', name: 'Closed Won', color: 'bg-green-500', leads: [] },
    { id: 'closed-lost', name: 'Closed Lost', color: 'bg-red-500', leads: [] },
  ];

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    try {
      setLoading(true);
      const response = await crmApi.getLeads({ limit: 100 });
      setLeads(response.data.leads);
    } catch (error) {
      console.error('Failed to load leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateLeadStage = async (leadId: string, newStage: string) => {
    try {
      await crmApi.updateLead(leadId, { stage: newStage as Lead['stage'] });
      loadLeads();
    } catch (error) {
      console.error('Failed to update lead stage:', error);
    }
  };

  const getLeadsByStage = (stage: string) => {
    return leads.filter(lead => lead.stage === stage);
  };

  const getStageValue = (stage: string) => {
    const stageLeads = getLeadsByStage(stage);
    return stageLeads.reduce((sum, lead) => sum + lead.value, 0);
  };

  const getTotalPipelineValue = () => {
    return leads.reduce((sum, lead) => sum + lead.value, 0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const onDragStart = (lead: Lead) => {
    setDraggedLead(lead);
  };

  const onDragEnd = (targetStage: string) => {
    if (draggedLead && draggedLead.stage !== targetStage) {
      handleUpdateLeadStage(draggedLead.id, targetStage);
    }
    setDraggedLead(null);
  };

  return (
    <div className="space-y-6">
      {/* Pipeline Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pipeline</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(getTotalPipelineValue())}</div>
            <p className="text-xs text-muted-foreground">
              {leads.length} active leads
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {leads.length > 0 ? Math.round((getLeadsByStage('closed-won').length / leads.length) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Deal Size</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(leads.length > 0 ? getTotalPipelineValue() / leads.length : 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all stages
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Leads</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getLeadsByStage('new').length + getLeadsByStage('qualified').length}</div>
            <p className="text-xs text-muted-foreground">
              Need attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 overflow-x-auto min-h-[600px]">
        {stages.map((stage) => {
          const stageLeads = getLeadsByStage(stage.id);
          const stageValue = getStageValue(stage.id);

          return (
            <div
              key={stage.id}
              className="min-w-[280px]"
            >
              <Card className="glass-card h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                      <CardTitle className="text-sm">{stage.name}</CardTitle>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {stageLeads.length}
                    </Badge>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    {formatCurrency(stageValue)}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3 pb-4">
                  <AnimatePresence>
                    {stageLeads.map((lead) => (
                       <motion.div
                        key={lead.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                        drag
                        onDragStart={() => onDragStart(lead)}
                        onDragEnd={() => onDragEnd(stage.id)}
                        className="cursor-move"
                      >
                        <Card className="glass-card hover-lift border-l-4 border-l-primary">
                          <CardContent className="p-4 space-y-3">
                            <div className="flex items-start justify-between">
                              <h4 className="font-medium text-sm leading-tight">
                                {lead.title}
                              </h4>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-3 w-3" />
                              </Button>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Avatar className="w-6 h-6">
                                <AvatarFallback className="text-xs">
                                  {lead.contact.firstName.charAt(0)}{lead.contact.lastName.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs text-muted-foreground truncate">
                                {lead.contact.firstName} {lead.contact.lastName}
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-medium">{formatCurrency(lead.value)}</span>
                              <span className="text-muted-foreground">
                                {formatDate(lead.expectedCloseDate)}
                              </span>
                            </div>
                            
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span>Probability</span>
                                <span>{lead.probability}%</span>
                              </div>
                              <Progress value={lead.probability} className="h-1" />
                            </div>
                            
                            <div className="flex gap-2 text-xs">
                              <Badge variant="outline" className="text-xs">
                                {lead.source}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  
                  {stageLeads.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <div className="text-sm">No leads in this stage</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card className="glass-card">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Lead
            </Button>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline">
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};