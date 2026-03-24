import { getAdminClient } from "@config/supabaseAdminClient";
import type { UserProfile } from "./user.types";

export async function listUsers(page: number, pageSize: number): Promise<{ data: UserProfile[]; total: number }> {
  const offset = (page - 1) * pageSize;
  const supabase = getAdminClient();

  const { count } = await supabase.from("profiles").select("*", { count: "exact", head: true });

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, avatar_url, created_at, updated_at")
    .order("created_at", { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (error) throw error;

  return {
    data: (data || []) as UserProfile[],
    total: count || 0,
  };
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = getAdminClient();
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
  if (error) return null;
  return data as UserProfile;
}
