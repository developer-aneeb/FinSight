/**
 * FinSight — Budget Service (Backend)
 */
import { getSupabaseServiceClient } from "../config/supabase";
import logger from "../utils/logger";
import { Budget, CreateBudgetInput, UpdateBudgetInput } from "../types";

const supabase = () => getSupabaseServiceClient();

/** List all budgets for a user */
export async function listBudgets(userId: string): Promise<Budget[]> {
  const { data, error } = await supabase()
    .from("budgets")
    .select("*, category:categories(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    logger.error("Failed to list budgets", { userId, error: error.message });
    throw error;
  }

  return (data as Budget[]) || [];
}

/** Get a single budget */
export async function getBudget(
  userId: string,
  budgetId: string
): Promise<Budget | null> {
  const { data, error } = await supabase()
    .from("budgets")
    .select("*, category:categories(*)")
    .eq("id", budgetId)
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  return data as Budget;
}

/** Create a budget */
export async function createBudget(
  userId: string,
  input: CreateBudgetInput
): Promise<Budget> {
  const { data, error } = await supabase()
    .from("budgets")
    .insert({ ...input, user_id: userId })
    .select("*, category:categories(*)")
    .single();

  if (error) {
    logger.error("Failed to create budget", { userId, error: error.message });
    throw error;
  }

  logger.info("Budget created", { id: data.id, userId, name: input.name });
  return data as Budget;
}

/** Update a budget */
export async function updateBudget(
  userId: string,
  input: UpdateBudgetInput
): Promise<Budget> {
  const { id, ...updates } = input;

  const { data, error } = await supabase()
    .from("budgets")
    .update(updates)
    .eq("id", id)
    .eq("user_id", userId)
    .select("*, category:categories(*)")
    .single();

  if (error) {
    logger.error("Failed to update budget", { id, error: error.message });
    throw error;
  }

  logger.info("Budget updated", { id, userId });
  return data as Budget;
}

/** Delete a budget */
export async function deleteBudget(
  userId: string,
  budgetId: string
): Promise<void> {
  const { error } = await supabase()
    .from("budgets")
    .delete()
    .eq("id", budgetId)
    .eq("user_id", userId);

  if (error) {
    logger.error("Failed to delete budget", { id: budgetId, error: error.message });
    throw error;
  }

  logger.info("Budget deleted", { id: budgetId, userId });
}

/** Get active budgets with usage percentage */
export async function getActiveBudgets(
  userId: string
): Promise<(Budget & { usage_percentage: number })[]> {
  const budgets = await listBudgets(userId);
  return budgets
    .filter((b) => b.is_active)
    .map((b) => ({
      ...b,
      usage_percentage:
        b.amount_limit > 0
          ? Math.round((b.spent / b.amount_limit) * 100)
          : 0,
    }));
}
