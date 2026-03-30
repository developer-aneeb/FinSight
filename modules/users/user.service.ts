import { getAdminClient } from "@config/supabaseAdminClient";
import type { UserProfile } from "./user.types";
import { HttpError } from "@utils/error";

interface CreateUserByAdminInput {
  email: string;
  password: string;
  full_name: string;
  role: "user" | "admin";
}

interface UpdateUserByAdminInput {
  email?: string;
  full_name?: string;
  role?: "user" | "admin";
  is_active?: boolean;
}

async function getRoleIdByName(roleName: "user" | "admin"): Promise<number> {
  const supabase = getAdminClient();
  const { data, error } = await supabase.from("roles").select("id").eq("name", roleName).single();

  if (error || !data?.id) {
    throw new HttpError(400, "Invalid role selected");
  }

  return data.id as number;
}

async function mapUserWithRole(userId: string): Promise<UserProfile> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, email, full_name, preferred_currency, created_at, updated_at, role_id, is_active")
    .eq("id", userId)
    .single();

  if (error || !data) {
    throw new HttpError(404, "User not found");
  }

  const { data: roleRow } = data.role_id
    ? await supabase.from("roles").select("name").eq("id", data.role_id).single()
    : { data: null };

  return {
    id: data.id,
    email: data.email,
    full_name: data.full_name,
    role: (roleRow?.name as string) || "user",
    is_active: data.is_active,
    preferred_currency: data.preferred_currency,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

export async function listUsers(
  page: number,
  pageSize: number,
  search?: string
): Promise<{ data: UserProfile[]; total: number }> {
  const offset = (page - 1) * pageSize;
  const supabase = getAdminClient();

  let countQuery = supabase.from("users").select("id", { count: "exact", head: true });
  let dataQuery = supabase
    .from("users")
    .select("id, email, full_name, created_at, updated_at, role_id, is_active")
    .order("created_at", { ascending: false })
    .range(offset, offset + pageSize - 1);

  const normalizedSearch = search?.trim();
  if (normalizedSearch) {
    const safeSearch = normalizedSearch.replace(/[,%]/g, "");
    const orQuery = `email.ilike.%${safeSearch}%,full_name.ilike.%${safeSearch}%`;
    countQuery = countQuery.or(orQuery);
    dataQuery = dataQuery.or(orQuery);
  }

  const [{ count, error: countError }, { data, error }] = await Promise.all([countQuery, dataQuery]);

  if (countError || error) {
    throw countError || error;
  }

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
    is_active: row.is_active,
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
    is_active: data?.is_active,
  } as UserProfile;
}

export async function updateUserRole(userId: string, roleName: "user" | "admin"): Promise<UserProfile> {
  const supabase = getAdminClient();

  const { data: roleRow, error: roleError } = await supabase
    .from("roles")
    .select("id, name")
    .eq("name", roleName)
    .single();

  if (roleError || !roleRow?.id) {
    throw new Error("Invalid role selected");
  }

  const { data, error } = await supabase
    .from("users")
    .update({ role_id: roleRow.id })
    .eq("id", userId)
    .select("id, email, full_name, preferred_currency, created_at, updated_at, role_id, is_active")
    .single();

  if (error || !data) {
    throw error || new Error("Unable to update user role");
  }

  return {
    id: data.id,
    email: data.email,
    full_name: data.full_name,
    role: roleName,
    is_active: data.is_active,
    preferred_currency: data.preferred_currency,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

export async function createUserByAdmin(input: CreateUserByAdminInput): Promise<UserProfile> {
  const supabase = getAdminClient();
  const roleId = await getRoleIdByName(input.role);

  const { data: createdUser, error: createError } = await supabase.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: { full_name: input.full_name },
  });

  if (createError || !createdUser.user?.id) {
    throw new HttpError(400, createError?.message || "Unable to create user");
  }

  const userId = createdUser.user.id;

  const { error: upsertError } = await supabase.from("users").upsert(
    {
      id: userId,
      email: input.email,
      full_name: input.full_name,
      role_id: roleId,
      is_active: true,
    },
    { onConflict: "id" }
  );

  if (upsertError) {
    await supabase.auth.admin.deleteUser(userId).catch(() => undefined);
    throw new HttpError(500, "Unable to persist user profile");
  }

  return mapUserWithRole(userId);
}

export async function updateUserByAdmin(userId: string, input: UpdateUserByAdminInput): Promise<UserProfile> {
  const supabase = getAdminClient();

  const updates: Record<string, unknown> = {};
  if (input.email !== undefined) updates.email = input.email;
  if (input.full_name !== undefined) updates.full_name = input.full_name;
  if (input.is_active !== undefined) updates.is_active = input.is_active;
  if (input.role !== undefined) {
    updates.role_id = await getRoleIdByName(input.role);
  }

  if (Object.keys(updates).length === 0) {
    throw new HttpError(400, "No fields provided for update");
  }

  const { error: profileError } = await supabase.from("users").update(updates).eq("id", userId);
  if (profileError) {
    throw new HttpError(500, "Unable to update user profile");
  }

  if (input.email !== undefined || input.full_name !== undefined) {
    const authUpdates: Record<string, unknown> = {};
    if (input.email !== undefined) authUpdates.email = input.email;
    if (input.full_name !== undefined) authUpdates.user_metadata = { full_name: input.full_name };

    const { error: authError } = await supabase.auth.admin.updateUserById(userId, authUpdates);
    if (authError) {
      throw new HttpError(500, authError.message || "Unable to update auth user");
    }
  }

  return mapUserWithRole(userId);
}

export async function deleteUserByAdmin(userId: string): Promise<void> {
  const supabase = getAdminClient();

  const { error } = await supabase.auth.admin.deleteUser(userId);
  if (error) {
    throw new HttpError(500, error.message || "Unable to delete user");
  }
}
