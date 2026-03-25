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
