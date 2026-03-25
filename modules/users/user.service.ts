import { getAdminClient } from "@config/supabaseAdminClient";
import type { UserProfile } from "./user.types";

export async function listUsers(page: number, pageSize: number): Promise<{ data: UserProfile[]; total: number }> {
  const offset = (page - 1) * pageSize;
  const supabase = getAdminClient();

  const { count } = await supabase.from("users").select("*", { count: "exact", head: true });

  const { data, error } = await supabase
    .from("users")
    .select("id, email, full_name, avatar_url, created_at, updated_at, role_id")
    .order("created_at", { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (error) throw error;

  const roleIds = Array.from(new Set((data || []).map((item) => item.role_id).filter(Boolean)));
  const roleMap = new Map<number, string>();

  if (roleIds.length) {
    const { data: rolesData } = await supabase.from("roles").select("id, name").in("id", roleIds);
    for (const role of rolesData || []) {
      roleMap.set(role.id as number, role.name as string);
    }
  }

  const mapped = (data || []).map((row) => ({
    id: row.id,
    email: row.email,
    full_name: row.full_name,
    role: roleMap.get(row.role_id as number) || "user",
    avatar_url: row.avatar_url,
    created_at: row.created_at,
    updated_at: row.updated_at,
  })) as UserProfile[];

  return {
    data: mapped,
    total: count || 0,
  };
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = getAdminClient();
  const { data, error } = await supabase.from("users").select("*").eq("id", userId).single();
  if (error) return null;

  const { data: roleRow } = data?.role_id
    ? await supabase.from("roles").select("name").eq("id", data.role_id).single()
    : { data: null };

  return {
    ...data,
    role: (roleRow?.name as string) || "user",
  } as UserProfile;
}
