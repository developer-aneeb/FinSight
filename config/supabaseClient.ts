import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { env } from "./env";

if (!env.supabase.url || !env.supabase.anonKey) {
  throw new Error("SUPABASE_URL and SUPABASE_ANON_KEY must be set");
}

const supabaseUrl = env.supabase.url;
const supabaseAnonKey = env.supabase.anonKey;

/** Create a Supabase client scoped to a specific user's JWT. */
export function supabaseForUser(token: string): SupabaseClient {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/** Anonymous (public) Supabase client. */
export const supabaseAnon: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export function getClient(): SupabaseClient {
  return supabaseAnon;
}

export function getUserClient(accessToken: string): SupabaseClient {
  return supabaseForUser(accessToken);
}
