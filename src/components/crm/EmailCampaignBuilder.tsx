import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { emailCampaignApi } from '@/lib/crm-advanced-api';
import { Mail, Send, Save, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export function EmailCampaignBuilder() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    content: '',
    recipients: []
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      const data = await emailCampaignApi.getCampaigns();
      setCampaigns(data || []);
    } catch (error: any) {
      toast({ title: 'Error loading campaigns', description: error.message, variant: 'destructive' });
    }
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        await emailCampaignApi.updateCampaign(editingId, formData);
        toast({ title: 'Campaign updated' });
      } else {
        await emailCampaignApi.createCampaign(formData);
        toast({ title: 'Campaign created' });
      }
      setFormData({ name: '', subject: '', content: '', recipients: [] });
      setEditingId(null);
      loadCampaigns();
    } catch (error: any) {
      toast({ title: 'Error saving campaign', description: error.message, variant: 'destructive' });
    }
  };

  const handleSend = async (id: string) => {
    if (!confirm('Send this campaign to all recipients?')) return;
    try {
      await emailCampaignApi.sendCampaign(id);
      toast({ title: 'Campaign sent successfully' });
      loadCampaigns();
    } catch (error: any) {
      toast({ title: 'Error sending campaign', description: error.message, variant: 'destructive' });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      draft: 'secondary',
      scheduled: 'default',
      sending: 'default',
      sent: 'default'
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Mail className="h-5 w-5" />
            {editingId ? 'Edit Campaign' : 'Create Campaign'}
          </h3>
          
          <div className="space-y-4">
            <div>
              <Label>Campaign Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Q1 Newsletter"
              />
            </div>

            <div>
              <Label>Email Subject</Label>
              <Input
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Your monthly update"
              />
            </div>

            <div>
              <Label>Email Content</Label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Write your email content here..."
                rows={8}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave} className="flex-1">
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </Button>
              {editingId && (
                <Button onClick={() => {
                  setEditingId(null);
                  setFormData({ name: '', subject: '', content: '', recipients: [] });
                }} variant="outline">
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Campaigns</h3>
          {campaigns.map((campaign) => (
            <Card key={campaign.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold">{campaign.name}</h4>
                  <p className="text-sm text-muted-foreground">{campaign.subject}</p>
                </div>
                {getStatusBadge(campaign.status)}
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Sent</p>
                  <p className="font-semibold">{campaign.stats?.sent || 0}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Opened</p>
                  <p className="font-semibold">{campaign.stats?.opened || 0}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Clicked</p>
                  <p className="font-semibold">{campaign.stats?.clicked || 0}</p>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingId(campaign.id);
                    setFormData({
                      name: campaign.name,
                      subject: campaign.subject,
                      content: campaign.content,
                      recipients: campaign.recipients
                    });
                  }}
                >
                  Edit
                </Button>
                {campaign.status === 'draft' && (
                  <Button
                    size="sm"
                    onClick={() => handleSend(campaign.id)}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
