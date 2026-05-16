import { getAdminClient } from "@config/supabaseAdminClient";
import { HttpError } from "@utils/error";

function isMissingTable(error: unknown): boolean {
  return !!error && typeof error === "object" && "code" in error && (error as { code?: string }).code === "42P01";
}

export async function listBudgets(userId: string) {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("budgets")
    .select("*, category:categories(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (isMissingTable(error)) {
    return [];
  }
  if (error) {
    throw new HttpError(500, "Failed to load budgets");
  }

  return data || [];
}

export async function createBudget(userId: string, payload: Record<string, unknown>) {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("budgets")
    .insert({ ...payload, user_id: userId })
    .select("*, category:categories(*)")
    .single();

  if (isMissingTable(error)) {
    throw new HttpError(500, "Budgets table is not set up yet");
  }
  if (error) {
    throw new HttpError(500, "Failed to create budget");
  }

  return data;
}

export async function getBudgetById(userId: string, id: string) {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("budgets")
    .select("*, category:categories(*)")
    .eq("user_id", userId)
    .eq("id", id)
    .single();

  if (isMissingTable(error)) {
    return null;
  }
  if (error) {
    throw new HttpError(404, "Budget not found");
  }

  return data;
}

export async function updateBudget(userId: string, id: string, payload: Record<string, unknown>) {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("budgets")
    .update(payload)
    .eq("user_id", userId)
    .eq("id", id)
    .select("*, category:categories(*)")
    .single();

  if (isMissingTable(error)) {
    throw new HttpError(500, "Budgets table is not set up yet");
  }
  if (error) {
    throw new HttpError(404, "Budget not found");
  }

  return data;
}

export async function deleteBudget(userId: string, id: string) {
  const supabase = getAdminClient();
  const { error } = await supabase.from("budgets").delete().eq("user_id", userId).eq("id", id);

  if (isMissingTable(error)) {
    throw new HttpError(500, "Budgets table is not set up yet");
  }
  if (error) {
    throw new HttpError(404, "Budget not found");
  }
}

export async function refreshBudgetSpentAndAlerts(userId: string): Promise<void> {
  const supabase = getAdminClient();

  const rpcResult = await supabase.rpc("refresh_budget_spent_and_alerts", { p_user_id: userId });
  if (!rpcResult.error) {
    return;
  }

  const missingFunction =
    rpcResult.error.code === "PGRST202" ||
    rpcResult.error.code === "42883";

  if (!missingFunction) {
    throw new HttpError(500, "Failed to refresh budget spent");
  }

  const { data: budgets, error: budgetsError } = await supabase
    .from("budgets")
    .select("id, user_id, category_id, start_date, end_date")
    .eq("user_id", userId);

  if (budgetsError) {
    throw new HttpError(500, "Failed to recalculate budgets");
  }

  try {
    await Promise.all(
      (budgets || []).map(async (budget) => {
        let txQuery = supabase
          .from("transactions")
          .select("amount")
          .eq("user_id", userId)
          .eq("type", "expense")
          .gte("transaction_date", budget.start_date);

        if (budget.end_date) {
          txQuery = txQuery.lte("transaction_date", budget.end_date);
        }

        if (budget.category_id) {
          txQuery = txQuery.eq("category_id", budget.category_id);
        }

        const { data: txRows, error: txError } = await txQuery;
        if (txError) {
          throw txError;
        }

        const spent = (txRows || []).reduce((sum, row) => sum + Number(row.amount || 0), 0);

        const { error: updateError } = await supabase
          .from("budgets")
          .update({ spent })
          .eq("id", budget.id);

        if (updateError) {
          throw updateError;
        }
      })
    );
  } catch {
    throw new HttpError(500, "Failed to recalculate budgets");
  }
}
