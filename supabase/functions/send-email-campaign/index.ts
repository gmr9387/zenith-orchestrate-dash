import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { campaignId } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from('email_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (campaignError) throw campaignError;

    // Update campaign status
    await supabase
      .from('email_campaigns')
      .update({ 
        status: 'sending',
        sent_at: new Date().toISOString()
      })
      .eq('id', campaignId);

    // Get recipient contacts
    const recipientIds = campaign.recipients;
    const { data: contacts } = await supabase
      .from('contacts')
      .select('*')
      .in('id', recipientIds);

    // In a production environment, you would integrate with an email service here
    // For now, we'll simulate sending
    console.log(`Sending campaign "${campaign.name}" to ${contacts?.length || 0} recipients`);

    // Update stats
    await supabase
      .from('email_campaigns')
      .update({ 
        status: 'sent',
        stats: {
          sent: contacts?.length || 0,
          opened: 0,
          clicked: 0
        }
      })
      .eq('id', campaignId);

    return new Response(JSON.stringify({ 
      success: true,
      recipients: contacts?.length || 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error sending campaign:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
