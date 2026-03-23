/**
 * FinSight — Alert Service (Backend)
 */
import { getSupabaseServiceClient } from "../config/supabase";
import logger from "../utils/logger";
import { Alert, AlertStatus } from "../types";

const supabase = () => getSupabaseServiceClient();

/** List alerts for a user, optionally filtered by status */
export async function listAlerts(
  userId: string,
  status?: AlertStatus
): Promise<Alert[]> {
  let query = supabase()
    .from("alerts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) {
    logger.error("Failed to list alerts", { userId, error: error.message });
    throw error;
  }

  return (data as Alert[]) || [];
}

/** Update alert status */
export async function updateAlertStatus(
  userId: string,
  alertId: string,
  status: AlertStatus
): Promise<void> {
  const { error } = await supabase()
    .from("alerts")
    .update({ status })
    .eq("id", alertId)
    .eq("user_id", userId);

  if (error) {
    logger.error("Failed to update alert", { alertId, error: error.message });
    throw error;
  }

  logger.info("Alert updated", { alertId, status });
}
