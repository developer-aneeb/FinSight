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

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", authData.user.id).single();

  return {
    id: authData.user.id,
    email: authData.user.email || "",
    role: profile?.role || "user",
  };
}

export async function requireAdminUser(req: NextRequest): Promise<AuthUser> {
  const user = await requireUser(req);

  if (user.role !== "admin") {
    throw new HttpError(403, "Admin access required");
  }

  return user;
}
