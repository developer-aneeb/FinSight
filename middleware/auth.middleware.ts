import { NextRequest } from "next/server";
import { getAdminClient } from "@config/supabaseAdminClient";
import { HttpError } from "@utils/error";
import { getBearerToken } from "@modules/auth/tokens";

export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

export async function requireUser(req: NextRequest): Promise<AuthUser> {
  const token = getBearerToken(req);

  if (!token) {
    throw new HttpError(401, "Authentication required");
  }

  const supabase = getAdminClient();
  const { data: authData, error: authError } = await supabase.auth.getUser(token);

  if (authError || !authData.user) {
    throw new HttpError(401, "Invalid or expired token");
  }

  let role = "user";

  let { data: userRow, error: userError } = await supabase
    .from("users")
    .select("role:roles(name)")
    .eq("id", authData.user.id)
    .single();

  if (userError?.code === "PGRST116") {
    const { data: defaultRole } = await supabase
      .from("roles")
      .select("id")
      .eq("name", "user")
      .maybeSingle();

    const fullName =
      authData.user.user_metadata && typeof authData.user.user_metadata === "object"
        ? String((authData.user.user_metadata as { full_name?: unknown }).full_name || "")
        : "";

    const insertPayload: {
      id: string;
      email: string;
      full_name: string;
      role_id?: number;
    } = {
      id: authData.user.id,
      email: authData.user.email || "",
      full_name: fullName,
    };

    if (typeof defaultRole?.id === "number") {
      insertPayload.role_id = defaultRole.id;
    }

    const { error: upsertError } = await supabase.from("users").upsert(
      insertPayload,
      { onConflict: "id" }
    );

    if (upsertError && upsertError.code !== "42P01") {
      throw new HttpError(500, "Failed to initialize user profile");
    }

    const retry = await supabase
      .from("users")
      .select("role:roles(name)")
      .eq("id", authData.user.id)
      .single();

    userRow = retry.data;
    userError = retry.error;
  }

  const roleRelation = userRow?.role as unknown;
  const roleRecord = Array.isArray(roleRelation)
    ? (roleRelation[0] as { name?: string } | undefined)
    : (roleRelation as { name?: string } | undefined);
  const roleName = roleRecord?.name;

  if (!userError && roleName) {
    role = roleName;
  }

  return {
    id: authData.user.id,
    email: authData.user.email || "",
    role,
  };
}

export async function requireAdminUser(req: NextRequest): Promise<AuthUser> {
  const user = await requireUser(req);

  if (user.role !== "admin") {
    throw new HttpError(403, "Admin access required");
  }

  return user;
}

export async function requireStandardUser(req: NextRequest): Promise<AuthUser> {
  const user = await requireUser(req);

  if (user.role === "admin") {
    throw new HttpError(403, "User access required");
  }

  return user;
}
