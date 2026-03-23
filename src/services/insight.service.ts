/**
 * FinSight — Insight Service (Backend)
 */
import { getSupabaseServiceClient } from "../config/supabase";
import logger from "../utils/logger";
import { Insight } from "../types";

const supabase = () => getSupabaseServiceClient();

/** List non-dismissed insights for a user */
export async function listInsights(userId: string): Promise<Insight[]> {
  const { data, error } = await supabase()
    .from("insights")
    .select("*")
    .eq("user_id", userId)
    .eq("is_dismissed", false)
    .order("generated_at", { ascending: false })
    .limit(20);

  if (error) {
    logger.error("Failed to list insights", { userId, error: error.message });
    throw error;
  }

  return (data as Insight[]) || [];
}

/** Dismiss an insight */
export async function dismissInsight(
  userId: string,
  insightId: string
): Promise<void> {
  const { error } = await supabase()
    .from("insights")
    .update({ is_dismissed: true })
    .eq("id", insightId)
    .eq("user_id", userId);

  if (error) {
    logger.error("Failed to dismiss insight", { insightId, error: error.message });
    throw error;
  }

  logger.info("Insight dismissed", { insightId });
}
