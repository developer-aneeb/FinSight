import { getAdminClient } from "@config/supabaseAdminClient";

export interface AlertRow {
  id: string;
  user_id: string;
  title: string;
  message: string;
  severity: "info" | "warning" | "critical";
  status: "unread" | "read" | "dismissed";
  related_budget_id: string | null;
  created_at: string;
}

export async function listAlerts(userId: string): Promise<AlertRow[]> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("alerts")
    .select("id, user_id, title, message, severity, status, related_budget_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data as AlertRow[];
}

export async function updateAlertStatus(
  userId: string,
  alertId: string,
  status: AlertRow["status"]
): Promise<AlertRow | null> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("alerts")
    .update({ status })
    .eq("id", alertId)
    .eq("user_id", userId)
    .select("id, user_id, title, message, severity, status, related_budget_id, created_at")
    .single();

  if (error || !data) {
    return null;
  }

  return data as AlertRow;
}
