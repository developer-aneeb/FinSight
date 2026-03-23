/**
 * FinSight — Auth Service (Backend)
 */
import { getSupabaseAnonClient, getSupabaseServiceClient } from "../config/supabase";
import logger from "../utils/logger";
import { LoginCredentials, SignupCredentials, Profile } from "../types";

/** Sign up a new user */
export async function signUp(credentials: SignupCredentials) {
  const supabase = getSupabaseAnonClient();

  const { data, error } = await supabase.auth.signUp({
    email: credentials.email,
    password: credentials.password,
    options: {
      data: { full_name: credentials.full_name },
    },
  });

  if (error) {
    logger.error("Signup failed", { error: error.message });
    throw error;
  }

  logger.info("User signed up", { userId: data.user?.id });
  return data;
}

/** Sign in with email/password */
export async function signIn(credentials: LoginCredentials) {
  const supabase = getSupabaseAnonClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  });

  if (error) {
    logger.error("Login failed", { error: error.message });
    throw error;
  }

  logger.info("User logged in", { userId: data.user?.id });
  return data;
}

/** Sign out a user */
export async function signOut(accessToken: string) {
  const supabase = getSupabaseAnonClient();
  // Admin-sign-out via service client for token invalidation
  const { error } = await supabase.auth.admin.signOut(accessToken);
  if (error) {
    // Fallback: non-admin signout
    await supabase.auth.signOut();
  }
}

/** Get profile by user ID */
export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    logger.error("Failed to fetch profile", { userId, error: error.message });
    return null;
  }

  return data as Profile;
}

/** Update user profile */
export async function updateProfile(
  userId: string,
  updates: Partial<Pick<Profile, "full_name" | "avatar_url" | "preferred_currency" | "language">>
): Promise<Profile> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select()
    .single();

  if (error) throw error;
  return data as Profile;
}

/** Request password reset email */
export async function resetPassword(email: string, redirectTo: string) {
  const supabase = getSupabaseAnonClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) throw error;
}
