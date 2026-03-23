// supabase/functions/aggregate-insights/index.ts
// Supabase Edge Function: Generates insights for a user based on their spending
// Deploy: supabase functions deploy aggregate-insights

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SpendingByCategory {
  category_name: string;
  total: number;
  prev_total: number;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get user from auth header
    const authHeader = req.headers.get("Authorization")!;
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split("T")[0];
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      .toISOString()
      .split("T")[0];

    // Get current month spending by category
    const { data: currentSpending } = await supabase.rpc("get_spending_by_category", {
      p_user_id: user.id,
      p_start_date: currentMonthStart,
      p_end_date: now.toISOString().split("T")[0],
    });

    // Get previous month spending by category
    const { data: prevSpending } = await supabase.rpc("get_spending_by_category", {
      p_user_id: user.id,
      p_start_date: prevMonthStart,
      p_end_date: currentMonthStart,
    });

    const insights: Array<{
      title: string;
      body: string;
      insight_type: string;
      metadata: Record<string, unknown>;
    }> = [];

    // Compare current vs previous month spending per category
    if (currentSpending && prevSpending) {
      const prevMap = new Map(
        (prevSpending as SpendingByCategory[]).map((s) => [s.category_name, s.total])
      );

      for (const cat of currentSpending as SpendingByCategory[]) {
        const prev = prevMap.get(cat.category_name) || 0;
        if (prev > 0) {
          const changePct = Math.round(((cat.total - prev) / prev) * 100);
          if (changePct > 20) {
            insights.push({
              title: `${cat.category_name} spending spike`,
              body: `Your ${cat.category_name} spending increased by ${changePct}% compared to last month.`,
              insight_type: "spending_pattern",
              metadata: { category: cat.category_name, change_pct: changePct },
            });
          } else if (changePct < -20) {
            insights.push({
              title: `${cat.category_name} spending reduced`,
              body: `Great job! Your ${cat.category_name} spending decreased by ${Math.abs(changePct)}%.`,
              insight_type: "positive_trend",
              metadata: { category: cat.category_name, change_pct: changePct },
            });
          }
        }
      }
    }

    // Store insights
    if (insights.length > 0) {
      const insightRows = insights.map((i) => ({
        user_id: user.id,
        ...i,
      }));

      await supabase.from("insights").insert(insightRows);
    }

    return new Response(
      JSON.stringify({
        success: true,
        generated: insights.length,
        insights,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
