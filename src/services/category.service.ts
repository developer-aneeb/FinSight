/**
 * FinSight — Category & Tag Service (Backend)
 */
import { getSupabaseServiceClient } from "../config/supabase";
import logger from "../utils/logger";
import { Category, Tag } from "../types";

const supabase = () => getSupabaseServiceClient();

// ─── Categories ─────────────────────────────────────────────

/** List categories (system + user's own) */
export async function listCategories(userId: string): Promise<Category[]> {
  const { data, error } = await supabase()
    .from("categories")
    .select("*")
    .or(`is_system.eq.true,user_id.eq.${userId}`)
    .order("is_system", { ascending: false })
    .order("name");

  if (error) {
    logger.error("Failed to list categories", { error: error.message });
    throw error;
  }

  return (data as Category[]) || [];
}

/** Create a custom category */
export async function createCategory(
  userId: string,
  input: { name: string; icon?: string; color?: string; parent_id?: string | null }
): Promise<Category> {
  const { data, error } = await supabase()
    .from("categories")
    .insert({ ...input, user_id: userId })
    .select()
    .single();

  if (error) throw error;
  logger.info("Category created", { id: data.id, userId });
  return data as Category;
}

/** Update a category (only user's own) */
export async function updateCategory(
  userId: string,
  categoryId: string,
  updates: Partial<{ name: string; icon: string; color: string }>
): Promise<Category> {
  const { data, error } = await supabase()
    .from("categories")
    .update(updates)
    .eq("id", categoryId)
    .eq("user_id", userId)
    .eq("is_system", false)
    .select()
    .single();

  if (error) throw error;
  return data as Category;
}

/** Delete a custom category */
export async function deleteCategory(
  userId: string,
  categoryId: string
): Promise<void> {
  const { error } = await supabase()
    .from("categories")
    .delete()
    .eq("id", categoryId)
    .eq("user_id", userId)
    .eq("is_system", false);

  if (error) throw error;
  logger.info("Category deleted", { id: categoryId, userId });
}

// ─── Tags ────────────────────────────────────────────────────

/** List user's tags */
export async function listTags(userId: string): Promise<Tag[]> {
  const { data, error } = await supabase()
    .from("tags")
    .select("*")
    .eq("user_id", userId)
    .order("name");

  if (error) throw error;
  return (data as Tag[]) || [];
}

/** Create a tag */
export async function createTag(
  userId: string,
  input: { name: string; color?: string }
): Promise<Tag> {
  const { data, error } = await supabase()
    .from("tags")
    .insert({ ...input, user_id: userId })
    .select()
    .single();

  if (error) throw error;
  return data as Tag;
}

/** Delete a tag */
export async function deleteTag(userId: string, tagId: string): Promise<void> {
  const { error } = await supabase()
    .from("tags")
    .delete()
    .eq("id", tagId)
    .eq("user_id", userId);

  if (error) throw error;
}
