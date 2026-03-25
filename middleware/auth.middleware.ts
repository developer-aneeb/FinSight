import { NextRequest } from "next/server";
import { getAdminClient } from "@config/supabaseAdminClient";
import { HttpError } from "@utils/error";

export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

export async function requireUser(req: NextRequest): Promise<AuthUser> {
  const authHeader = req.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    throw new HttpError(401, "Authentication required");
  }

  const token = authHeader.replace("Bearer ", "");
  const supabase = getAdminClient();
  const { data: authData, error: authError } = await supabase.auth.getUser(token);

  if (authError || !authData.user) {
    throw new HttpError(401, "Invalid or expired token");
  }

  let role = "user";

  let { data: userRow, error: userError } = await supabase
    .from("users")
    .select("role_id")
    .eq("id", authData.user.id)
    .single();

  if (userError?.code === "PGRST116") {
    const fullName =
      authData.user.user_metadata && typeof authData.user.user_metadata === "object"
        ? String((authData.user.user_metadata as { full_name?: unknown }).full_name || "")
        : "";

    const { error: upsertError } = await supabase.from("users").upsert(
      {
        id: authData.user.id,
        email: authData.user.email || "",
        full_name: fullName,
        role_id: 1,
      },
      { onConflict: "id" }
    );

    if (upsertError && upsertError.code !== "42P01") {
      throw new HttpError(500, "Failed to initialize user profile");
    }

    const retry = await supabase
      .from("users")
      .select("role_id")
      .eq("id", authData.user.id)
      .single();

    userRow = retry.data;
    userError = retry.error;
  }

  if (!userError && userRow?.role_id) {
    const { data: roleRow } = await supabase.from("roles").select("name").eq("id", userRow.role_id).single();
    if (roleRow?.name) {
      role = roleRow.name;
    }
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
