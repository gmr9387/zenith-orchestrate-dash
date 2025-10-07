import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { videoId } = await req.json();
    
    const authHeader = req.headers.get("Authorization")!;
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Processing video:", videoId);

    // Update video status to processing
    const { error: updateError } = await supabase
      .from("videos")
      .update({ status: "processing" })
      .eq("id", videoId)
      .eq("user_id", user.id);

    if (updateError) {
      throw updateError;
    }

    // Simulate video processing (thumbnail generation, transcoding, etc.)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Update video to ready status
    const { data: video, error: finalError } = await supabase
      .from("videos")
      .update({ 
        status: "ready",
        hls_url: `https://stream.example.com/${videoId}/playlist.m3u8`
      })
      .eq("id", videoId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (finalError) {
      throw finalError;
    }

    console.log("Video processed successfully:", videoId);

    return new Response(JSON.stringify(video), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in process-video function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
