import { getAdminClient } from "@config/supabaseAdminClient";
import { HttpError } from "@utils/error";

const DEFAULT_SYSTEM_CATEGORIES = [
  { name: "Salary", icon: "💼", color: "#10B981", is_system: true, user_id: null },
  { name: "Freelance", icon: "🧾", color: "#059669", is_system: true, user_id: null },
  { name: "Investments", icon: "📈", color: "#0EA5E9", is_system: true, user_id: null },
  { name: "Other Income", icon: "💰", color: "#22C55E", is_system: true, user_id: null },
  { name: "Groceries", icon: "🛒", color: "#3B82F6", is_system: true, user_id: null },
  { name: "Utilities", icon: "💡", color: "#F59E0B", is_system: true, user_id: null },
  { name: "Transport", icon: "🚗", color: "#8B5CF6", is_system: true, user_id: null },
  { name: "Dining", icon: "🍽️", color: "#EF4444", is_system: true, user_id: null },
  { name: "Health", icon: "🏥", color: "#14B8A6", is_system: true, user_id: null },
  { name: "Education", icon: "📚", color: "#6366F1", is_system: true, user_id: null },
  { name: "Shopping", icon: "🛍️", color: "#EC4899", is_system: true, user_id: null },
  { name: "Entertainment", icon: "🎬", color: "#F97316", is_system: true, user_id: null },
  { name: "Rent", icon: "🏠", color: "#84CC16", is_system: true, user_id: null },
  { name: "Savings", icon: "🏦", color: "#06B6D4", is_system: true, user_id: null },
  { name: "Other Expense", icon: "📁", color: "#6B7280", is_system: true, user_id: null },
];

function isMissingTable(error: unknown): boolean {
  return !!error && typeof error === "object" && "code" in error && (error as { code?: string }).code === "42P01";
}

async function ensureSystemCategories() {
  const supabase = getAdminClient();
  const { count, error } = await supabase
    .from("categories")
    .select("id", { count: "exact", head: true })
    .eq("is_system", true);

  if (isMissingTable(error)) {
    return;
  }

  if (error) {
    throw new HttpError(500, "Failed to verify categories");
  }

  if ((count || 0) > 0) {
    return;
  }

  const { error: seedError } = await supabase
    .from("categories")
    .insert(DEFAULT_SYSTEM_CATEGORIES);

  if (isMissingTable(seedError)) {
    return;
  }

  if (seedError && seedError.code !== "23505") {
    throw new HttpError(500, "Failed to initialize categories");
  }
}

export async function listCategories(userId: string) {
  await ensureSystemCategories();

  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .or(`user_id.eq.${userId},is_system.eq.true`)
    .order("name", { ascending: true });

  if (isMissingTable(error)) {
    return [];
  }
  if (error) {
    throw new HttpError(500, "Failed to load categories");
  }

  return data || [];
}

export async function createCategory(userId: string, payload: Record<string, unknown>) {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("categories")
    .insert({ ...payload, user_id: userId, is_system: false })
    .select("*")
    .single();

  if (isMissingTable(error)) {
    throw new HttpError(500, "Categories table is not set up yet");
  }
  if (error) {
    throw new HttpError(500, "Failed to create category");
  }

  return data;
}

export async function updateCategory(userId: string, id: string, payload: Record<string, unknown>) {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("categories")
    .update(payload)
    .eq("id", id)
    .eq("user_id", userId)
    .eq("is_system", false)
    .select("*")
    .single();

  if (isMissingTable(error)) {
    throw new HttpError(500, "Categories table is not set up yet");
  }
  if (error) {
    throw new HttpError(404, "Category not found");
  }

  return data;
}

export async function deleteCategory(userId: string, id: string) {
  const supabase = getAdminClient();
  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)
    .eq("is_system", false);

  if (isMissingTable(error)) {
    throw new HttpError(500, "Categories table is not set up yet");
  }
  if (error) {
    throw new HttpError(404, "Category not found");
  }
}
