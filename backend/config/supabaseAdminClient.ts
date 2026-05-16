import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { env } from "./env";

if (!env.supabase.url || !env.supabase.serviceRoleKey) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
}

const supabaseUrl = env.supabase.url;
const supabaseServiceRoleKey = env.supabase.serviceRoleKey;

export const supabaseAdmin: SupabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export function getAdminClient(): SupabaseClient {
  return supabaseAdmin;
}
