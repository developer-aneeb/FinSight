import { getClient } from "@config/supabaseClient";
import { getAdminClient } from "@config/supabaseAdminClient";
import type { LoginCredentials, SignupCredentials, Profile } from "@customTypes/index";
import logger from "@utils/logger";

export async function signUp(credentials: SignupCredentials) {
  const supabase = getClient();
  const { data, error } = await supabase.auth.signUp({
    email: credentials.email,
    password: credentials.password,
    options: { data: { full_name: credentials.full_name } },
  });

  if (error) {
    logger.error("Signup failed", { error: error.message });
    throw error;
  }

  return data;
}

export async function signIn(credentials: LoginCredentials) {
  const supabase = getClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  });

  if (error) throw error;
  return data;
}

export async function signOut(accessToken: string) {
  const supabase = getAdminClient();
  const { error } = await supabase.auth.admin.signOut(accessToken);
  if (error) throw error;
}

export async function resetPassword(email: string, redirectTo: string) {
  const supabase = getClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) throw error;
}

export async function refreshSession(refreshToken: string) {
  const supabase = getClient();
  const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });
  if (error) throw error;
  return data;
}

export async function resendSignupConfirmation(email: string) {
  const supabase = getClient();
  const { error } = await supabase.auth.resend({ type: "signup", email });
  if (error) throw error;
}

export async function confirmSignup(tokenHash: string) {
  const supabase = getClient();
  const { data, error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: "signup",
  });
  if (error) throw error;
  return data;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = getAdminClient();
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
  if (error) return null;
  return data as Profile;
}

export async function updateProfile(
  userId: string,
  updates: Partial<Pick<Profile, "full_name" | "avatar_url" | "preferred_currency" | "language">>
): Promise<Profile> {
  const supabase = getAdminClient();
  const { data, error } = await supabase.from("profiles").update(updates).eq("id", userId).select().single();
  if (error) throw error;
  return data as Profile;
}
