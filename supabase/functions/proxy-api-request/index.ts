import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, x-api-key, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.searchParams.get("path") || "/";
    const method = url.searchParams.get("method") || "GET";
    
    const apiKey = req.headers.get("x-api-key");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API key required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verify API key and get user
    const { data: apiKeyData, error: keyError } = await supabaseAdmin
      .from("api_keys")
      .select("*, user_id")
      .eq("prefix", apiKey.split("-")[0])
      .eq("is_active", true)
      .single();

    if (keyError || !apiKeyData) {
      return new Response(JSON.stringify({ error: "Invalid API key" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check rate limit
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000);
    
    const { count } = await supabaseAdmin
      .from("api_requests")
      .select("*", { count: "exact", head: true })
      .eq("api_key_id", apiKeyData.id)
      .gte("created_at", oneMinuteAgo.toISOString());

    if ((count || 0) >= apiKeyData.rate_limit) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get endpoint configuration
    const { data: endpoint, error: endpointError } = await supabaseAdmin
      .from("api_endpoints")
      .select("*")
      .eq("user_id", apiKeyData.user_id)
      .eq("path", path)
      .eq("method", method)
      .eq("is_active", true)
      .single();

    if (endpointError || !endpoint) {
      return new Response(JSON.stringify({ error: "Endpoint not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const startTime = Date.now();

    // Proxy the request
    const targetHeaders: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (endpoint.headers) {
      Object.assign(targetHeaders, endpoint.headers);
    }

    let body;
    if (method !== "GET" && method !== "HEAD") {
      body = await req.text();
    }

    const targetResponse = await fetch(endpoint.target_url, {
      method,
      headers: targetHeaders,
      body,
      signal: AbortSignal.timeout(endpoint.timeout_ms || 30000),
    });

    const responseTime = Date.now() - startTime;
    const responseBody = await targetResponse.text();

    // Log request
    await supabaseAdmin.from("api_requests").insert({
      user_id: apiKeyData.user_id,
      endpoint_id: endpoint.id,
      api_key_id: apiKeyData.id,
      method,
      path,
      status_code: targetResponse.status,
      response_time_ms: responseTime,
      request_size: body?.length || 0,
      response_size: responseBody.length,
      ip_address: req.headers.get("x-forwarded-for") || "unknown",
      user_agent: req.headers.get("user-agent") || "unknown",
    });

    // Update last used timestamp
    await supabaseAdmin
      .from("api_keys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", apiKeyData.id);

    return new Response(responseBody, {
      status: targetResponse.status,
      headers: {
        ...corsHeaders,
        "Content-Type": targetResponse.headers.get("Content-Type") || "application/json",
      },
    });

  } catch (error) {
    console.error("Error in proxy-api-request function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
