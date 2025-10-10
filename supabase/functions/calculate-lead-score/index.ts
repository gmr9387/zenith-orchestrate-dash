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
    const { contactId } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get contact info
    const { data: contact } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', contactId)
      .single();

    // Get related deals
    const { data: deals } = await supabase
      .from('deals')
      .select('*')
      .eq('contact_id', contactId);

    // Get activities
    const { data: activities } = await supabase
      .from('activities')
      .select('*')
      .eq('contact_id', contactId);

    // Calculate score based on various factors
    let score = 0;
    const factors: any = {};

    // Contact completeness (0-20 points)
    const completenessScore = [
      contact?.email,
      contact?.phone,
      contact?.company_name,
      contact?.address
    ].filter(Boolean).length * 5;
    score += completenessScore;
    factors.completeness = completenessScore;

    // Deal value (0-30 points)
    const totalDealValue = deals?.reduce((sum, deal) => sum + (Number(deal.amount) || 0), 0) || 0;
    const dealScore = Math.min(30, Math.floor(totalDealValue / 1000) * 5);
    score += dealScore;
    factors.dealValue = dealScore;

    // Engagement (0-30 points)
    const activityCount = activities?.length || 0;
    const engagementScore = Math.min(30, activityCount * 2);
    score += engagementScore;
    factors.engagement = engagementScore;

    // Recency (0-20 points)
    const recentActivities = activities?.filter(a => {
      const daysSince = (Date.now() - new Date(a.created_at).getTime()) / (1000 * 60 * 60 * 24);
      return daysSince <= 30;
    }) || [];
    const recencyScore = Math.min(20, recentActivities.length * 5);
    score += recencyScore;
    factors.recency = recencyScore;

    // Upsert lead score
    const { data: leadScore, error } = await supabase
      .from('lead_scores')
      .upsert({
        contact_id: contactId,
        score,
        factors,
        last_calculated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ leadScore }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error calculating lead score:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
