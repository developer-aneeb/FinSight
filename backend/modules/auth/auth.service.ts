import { getClient, getUserClient } from "@config/supabaseClient";
import { getAdminClient } from "@config/supabaseAdminClient";
import type { LoginCredentials, SignupCredentials, Profile } from "@customTypes/index";
import logger from "@utils/logger";
import { HttpError } from "@utils/error";

interface SupabaseLikeError {
  message?: string;
  status?: number;
  code?: string;
}

let defaultRoleIdCache: number | null | undefined;

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

async function ensureUserProfileRow(userId: string, email: string, fullName = ""): Promise<void> {
  const supabase = getAdminClient();
  const defaultRoleId = await getDefaultRoleId();

  const payload: {
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
    payload.role_id = defaultRoleId;
  }

  const { error: upsertError } = await supabase
    .from("users")
    .upsert(payload, { onConflict: "id", ignoreDuplicates: true });
  if (upsertError && upsertError.code !== "42P01") {
    throw new HttpError(500, "Unable to initialize user profile");
  }
}

async function getRoleByUserId(userId: string): Promise<Profile["role"]> {
  const supabase = getAdminClient();

  const { data: userRow, error: userError } = await supabase
    .from("users")
    .select("role:roles(name)")
    .eq("id", userId)
    .maybeSingle();

  const roleRelation = userRow?.role as unknown;
  const roleRecord = Array.isArray(roleRelation)
    ? (roleRelation[0] as { name?: string } | undefined)
    : (roleRelation as { name?: string } | undefined);

  if (!userError && roleRecord?.name === "admin") {
    return "admin";
  }

  return "user";
}

function toHttpError(error: SupabaseLikeError, fallbackMessage: string): HttpError {
  const message = (error.message || "").toLowerCase();

  if (message.includes("invalid login credentials")) {
    return new HttpError(401, "Invalid email or password");
  }

  if (message.includes("email not confirmed")) {
    return new HttpError(403, "Please confirm your email before logging in");
  }

  if (message.includes("user already registered") || message.includes("already been registered")) {
    return new HttpError(409, "Email is already registered");
  }

  if (typeof error.status === "number" && error.status >= 400 && error.status < 500) {
    return new HttpError(error.status, error.message || fallbackMessage);
  }

  logger.error("Supabase auth error", { message: error.message, status: error.status, code: error.code });
  return new HttpError(500, fallbackMessage);
}

export async function signUp(credentials: SignupCredentials) {
  const supabase = getClient();
  const { data, error } = await supabase.auth.signUp({
    email: credentials.email,
    password: credentials.password,
    options: { data: { full_name: credentials.full_name } },
  });

  if (error) {
    throw toHttpError(error, "Unable to create account at the moment");
  }

  return data;
}

export async function signIn(credentials: LoginCredentials) {
  const supabase = getClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  });

  if (error) {
    throw toHttpError(error, "Unable to sign in at the moment");
  }

  if (data.user?.id) {
    const fullName =
      data.user.user_metadata && typeof data.user.user_metadata === "object"
        ? String((data.user.user_metadata as { full_name?: unknown }).full_name || "")
        : "";

    void ensureUserProfileRow(data.user.id, data.user.email || credentials.email, fullName).catch((profileError) => {
      logger.warn("Login profile bootstrap failed", {
        userId: data.user?.id,
        message: profileError instanceof Error ? profileError.message : String(profileError),
      });
    });
  }

  const metadataRole =
    data.user?.app_metadata && typeof data.user.app_metadata === "object"
      ? String((data.user.app_metadata as { role?: unknown }).role || "")
      : "";
  const role = metadataRole === "admin" ? "admin" : "user";

  return {
    ...data,
    role,
  };
}

export async function signOut(accessToken: string) {
  const supabase = getAdminClient();
  const { error } = await supabase.auth.admin.signOut(accessToken);
  if (error) {
    throw toHttpError(error, "Unable to sign out at the moment");
  }
}

export async function resetPassword(email: string, redirectTo: string) {
  const supabase = getClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) {
    throw toHttpError(error, "Unable to send password reset email");
  }
}

export async function updatePassword(accessToken: string, password: string) {
  const supabase = getUserClient(accessToken);
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    throw toHttpError(error, "Unable to update password");
  }
}

export async function refreshSession(refreshToken: string) {
  const supabase = getClient();
  const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });
  if (error) {
    throw toHttpError(error, "Unable to refresh session");
  }
  return data;
}

export async function resendSignupConfirmation(email: string) {
  const supabase = getClient();
  const { error } = await supabase.auth.resend({ type: "signup", email });
  if (error) {
    throw toHttpError(error, "Unable to resend confirmation email");
  }
}

export async function confirmSignup(tokenHash: string) {
  const supabase = getClient();
  const { data, error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: "signup",
  });
  if (error) {
    throw toHttpError(error, "Invalid or expired confirmation link");
  }
  return data;
}

export async function getProfile(userId: string, fallbackEmail = ""): Promise<Profile | null> {
  const supabase = getAdminClient();

  let { data, error } = await supabase
    .from("users")
    .select("id, email, full_name, phone, address, preferred_currency, created_at, updated_at, role:roles(name)")
    .eq("id", userId)
    .maybeSingle();

  if ((!data || error?.code === "PGRST116") && fallbackEmail) {
    await ensureUserProfileRow(userId, fallbackEmail, "");

    const retry = await supabase
      .from("users")
      .select("id, email, full_name, phone, address, preferred_currency, created_at, updated_at, role:roles(name)")
      .eq("id", userId)
      .maybeSingle();

    data = retry.data;
    error = retry.error;
  }

  if (error || !data) {
    return null;
  }

  const roleRelation = data.role as unknown;
  const roleRecord = Array.isArray(roleRelation)
    ? (roleRelation[0] as { name?: string } | undefined)
    : (roleRelation as { name?: string } | undefined);
  const role = roleRecord?.name === "admin" ? "admin" : "user";

  return {
    id: data.id,
    email: data.email,
    full_name: data.full_name,
    phone: data.phone,
    address: data.address,
    preferred_currency: data.preferred_currency,
    role,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

export async function updateProfile(
  userId: string,
  updates: Partial<Pick<Profile, "full_name" | "phone" | "address" | "preferred_currency">>
): Promise<Profile> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", userId)
    .select("id, email, full_name, phone, address, preferred_currency, created_at, updated_at, role_id")
    .single();

  if (error || !data) {
    throw new HttpError(500, "Unable to update profile");
  }

  const role = await getRoleByUserId(userId);

  return {
    id: data.id,
    email: data.email,
    full_name: data.full_name,
    phone: data.phone,
    address: data.address,
    preferred_currency: data.preferred_currency,
    role,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}
