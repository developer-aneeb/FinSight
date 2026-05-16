import { NextRequest } from "next/server";
import { getAdminClient } from "@config/supabaseAdminClient";
import { HttpError } from "@utils/error";
import { getBearerToken } from "@modules/auth/tokens";

export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

const AUTH_CACHE_TTL_MS = 30_000;
const ROLE_CACHE_TTL_MS = 5 * 60_000;
const tokenCache = new Map<string, { user: AuthUser; expiresAt: number }>();
const tokenInFlight = new Map<string, Promise<AuthUser>>();
const roleCache = new Map<string, { role: string; expiresAt: number }>();
let defaultRoleIdCache: number | null | undefined;

function getUserFullName(authUser: { user_metadata?: unknown }): string {
  if (!authUser.user_metadata || typeof authUser.user_metadata !== "object") {
    return "";
  }

  return String((authUser.user_metadata as { full_name?: unknown }).full_name || "");
}

async function getDefaultRoleId(): Promise<number | null> {
  if (defaultRoleIdCache !== undefined) {
    return defaultRoleIdCache;
  }

  const supabase = getAdminClient();
  const { data: defaultRole } = await supabase
    .from("roles")
    .select("id")
    .eq("name", "user")
    .maybeSingle();

  defaultRoleIdCache = typeof defaultRole?.id === "number" ? defaultRole.id : null;
  return defaultRoleIdCache;
}

async function resolveRole(userId: string, email: string, fullName: string): Promise<string> {
  const now = Date.now();
  const cached = roleCache.get(userId);
  if (cached && cached.expiresAt > now) {
    return cached.role;
  }

  const supabase = getAdminClient();
  let { data: userRow, error: userError } = await supabase
    .from("users")
    .select("role:roles(name)")
    .eq("id", userId)
    .single();

  if (userError?.code === "PGRST116") {
    const defaultRoleId = await getDefaultRoleId();
    const insertPayload: {
      id: string;
      email: string;
      full_name: string;
      role_id?: number;
    } = {
      id: userId,
      email,
      full_name: fullName,
    };

    if (typeof defaultRoleId === "number") {
      insertPayload.role_id = defaultRoleId;
    }

    const { error: upsertError } = await supabase
      .from("users")
      .upsert(insertPayload, { onConflict: "id" });

    if (upsertError && upsertError.code !== "42P01") {
      throw new HttpError(500, "Failed to initialize user profile");
    }

    const retry = await supabase
      .from("users")
      .select("role:roles(name)")
      .eq("id", userId)
      .single();

    userRow = retry.data;
    userError = retry.error;
  }

  const roleRelation = userRow?.role as unknown;
  const roleRecord = Array.isArray(roleRelation)
    ? (roleRelation[0] as { name?: string } | undefined)
    : (roleRelation as { name?: string } | undefined);
  const resolvedRole = !userError && roleRecord?.name ? roleRecord.name : "user";

  roleCache.set(userId, {
    role: resolvedRole,
    expiresAt: now + ROLE_CACHE_TTL_MS,
  });

  return resolvedRole;
}

async function resolveAuthUser(token: string): Promise<AuthUser> {
  const supabase = getAdminClient();
  const { data: authData, error: authError } = await supabase.auth.getUser(token);

  if (authError || !authData.user) {
    throw new HttpError(401, "Invalid or expired token");
  }

  const userId = authData.user.id;
  const email = authData.user.email || "";
  const fullName = getUserFullName(authData.user);
  const role = await resolveRole(userId, email, fullName);

  return {
    id: userId,
    email,
    role,
  };
}

function cleanupAuthCache(now: number): void {
  if (tokenCache.size > 500) {
    for (const [token, entry] of tokenCache.entries()) {
      if (entry.expiresAt <= now) {
        tokenCache.delete(token);
      }
    }
  }
}

export async function requireUser(req: NextRequest): Promise<AuthUser> {
  const token = getBearerToken(req);

  if (!token) {
    throw new HttpError(401, "Authentication required");
  }

  const now = Date.now();
  cleanupAuthCache(now);

  const cached = tokenCache.get(token);
  if (cached && cached.expiresAt > now) {
    return cached.user;
  }

  const existingInFlight = tokenInFlight.get(token);
  if (existingInFlight) {
    return existingInFlight;
  }

  const resolvePromise = resolveAuthUser(token)
    .then((user) => {
      tokenCache.set(token, {
        user,
        expiresAt: Date.now() + AUTH_CACHE_TTL_MS,
      });
      return user;
    })
    .finally(() => {
      tokenInFlight.delete(token);
    });

  tokenInFlight.set(token, resolvePromise);
  return resolvePromise;
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
