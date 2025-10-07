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
    const { workflowId, triggerData } = await req.json();
    
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

    console.log("Executing workflow:", workflowId);

    // Get workflow configuration
    const { data: workflow, error: workflowError } = await supabase
      .from("workflows")
      .select("*")
      .eq("id", workflowId)
      .eq("user_id", user.id)
      .single();

    if (workflowError || !workflow) {
      return new Response(JSON.stringify({ error: "Workflow not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const startTime = Date.now();

    // Create execution record
    const { data: execution, error: executionError } = await supabase
      .from("workflow_executions")
      .insert({
        workflow_id: workflowId,
        user_id: user.id,
        status: "running",
        trigger_data: triggerData || {},
      })
      .select()
      .single();

    if (executionError) {
      throw executionError;
    }

    try {
      // Execute workflow steps (simplified example)
      const config = workflow.config as any;
      const results: any[] = [];

      for (const step of config.steps || []) {
        console.log(`Executing step: ${step.name}`);
        
        // Simulate step execution
        await new Promise(resolve => setTimeout(resolve, 500));
        
        results.push({
          stepId: step.id,
          stepName: step.name,
          status: "completed",
          output: { message: `Step ${step.name} completed` },
        });
      }

      const endTime = Date.now();

      // Update execution as completed
      const { data: completedExecution, error: updateError } = await supabase
        .from("workflow_executions")
        .update({
          status: "completed",
          result_data: { steps: results },
          completed_at: new Date().toISOString(),
          duration_ms: endTime - startTime,
        })
        .eq("id", execution.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      // Update workflow last run time
      await supabase
        .from("workflows")
        .update({ last_run_at: new Date().toISOString() })
        .eq("id", workflowId);

      console.log("Workflow executed successfully:", workflowId);

      return new Response(JSON.stringify(completedExecution), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } catch (stepError: any) {
      console.error("Workflow execution error:", stepError);

      // Update execution as failed
      await supabase
        .from("workflow_executions")
        .update({
          status: "failed",
          error_message: stepError.message,
          completed_at: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        })
        .eq("id", execution.id);

      throw stepError;
    }

  } catch (error) {
    console.error("Error in execute-workflow function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
