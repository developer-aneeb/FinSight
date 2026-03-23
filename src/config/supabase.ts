/**
 * FinSight — Supabase Client Configuration
 * Server-side Supabase client with service role key
 * and user-scoped client for RLS enforcement
 */
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import config from "./index";

/** Service-role client — bypasses RLS (for admin operations) */
let serviceClient: SupabaseClient | null = null;

export function getSupabaseServiceClient(): SupabaseClient {
  if (!serviceClient) {
    if (!config.supabase.url || !config.supabase.serviceRoleKey) {
      throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
    }
    serviceClient = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return serviceClient;
}

/** User-scoped client — respects RLS via JWT token */
export function getSupabaseUserClient(accessToken: string): SupabaseClient {
  return createClient(config.supabase.url, config.supabase.anonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

/** Anon client (for auth operations like signUp / signIn) */
let anonClient: SupabaseClient | null = null;

export function getSupabaseAnonClient(): SupabaseClient {
  if (!anonClient) {
    anonClient = createClient(config.supabase.url, config.supabase.anonKey);
  }
  return anonClient;
}
