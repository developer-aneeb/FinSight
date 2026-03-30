import { getAdminClient } from "@config/supabaseAdminClient";
import { HttpError } from "@utils/error";

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

interface CreateAlertInput {
  user_id: string;
  title: string;
  message: string;
  severity: AlertRow["severity"];
  related_budget_id?: string | null;
}

const periodicSummaryGuard = new Map<string, number>();
const PERIODIC_SUMMARY_INTERVAL_MS = 60_000;

function startOfTodayIso(): string {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now.toISOString();
}

function startOfWeekIso(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 6 : day - 1;
  now.setDate(now.getDate() - diff);
  now.setHours(0, 0, 0, 0);
  return now.toISOString();
}

async function alertExistsRecently(userId: string, title: string, sinceIso: string, relatedBudgetId?: string | null) {
  const supabase = getAdminClient();

  let query = supabase
    .from("alerts")
    .select("id")
    .eq("user_id", userId)
    .eq("title", title)
    .gte("created_at", sinceIso)
    .limit(1);

  if (relatedBudgetId) {
    query = query.eq("related_budget_id", relatedBudgetId);
  }

  const { data, error } = await query;
  if (error) {
    return false;
  }

  return (data || []).length > 0;
}

export async function createAlert(input: CreateAlertInput): Promise<AlertRow | null> {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from("alerts")
    .insert({
      user_id: input.user_id,
      title: input.title,
      message: input.message,
      severity: input.severity,
      status: "unread",
      related_budget_id: input.related_budget_id || null,
    })
    .select("id, user_id, title, message, severity, status, related_budget_id, created_at")
    .single();

  if (error || !data) {
    return null;
  }

  return data as AlertRow;
}

export async function createBudgetThresholdAlerts(userId: string): Promise<void> {
  const supabase = getAdminClient();
  const { data: budgets, error } = await supabase
    .from("budgets")
    .select("id, name, amount_limit, spent, is_active")
    .eq("user_id", userId)
    .eq("is_active", true);

  if (error || !budgets) {
    return;
  }

  const todayIso = startOfTodayIso();

  for (const budget of budgets) {
    const limit = Number(budget.amount_limit || 0);
    const spent = Number(budget.spent || 0);

    if (limit <= 0) {
      continue;
    }

    const usage = spent / limit;
    if (usage < 0.75) {
      continue;
    }

    let severity: AlertRow["severity"] = "info";
    if (usage >= 1) {
      severity = "critical";
    } else if (usage >= 0.9) {
      severity = "warning";
    }

    const title = `Budget Alert: ${budget.name}`;
    const percent = Math.round(usage * 100);
    const message =
      usage >= 1
        ? `Your budget '${budget.name}' is exceeded (${percent}%).`
        : `Your budget '${budget.name}' has reached ${percent}% usage.`;

    const exists = await alertExistsRecently(userId, title, todayIso, String(budget.id));
    if (exists) {
      continue;
    }

    await createAlert({
      user_id: userId,
      title,
      message,
      severity,
      related_budget_id: String(budget.id),
    });
  }
}

export async function createAnomalousSpendAlert(userId: string, amount: number): Promise<void> {
  if (!Number.isFinite(amount) || amount <= 0) {
    return;
  }

  const supabase = getAdminClient();
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const { data, error } = await supabase
    .from("transactions")
    .select("amount")
    .eq("user_id", userId)
    .eq("type", "expense")
    .gte("transaction_date", since.toISOString().slice(0, 10));

  if (error || !data || data.length < 5) {
    return;
  }

  const avg = data.reduce((sum, row) => sum + Number(row.amount || 0), 0) / data.length;
  if (avg <= 0 || amount < avg * 1.8) {
    return;
  }

  const title = "Anomalous spend detected";
  const todayIso = startOfTodayIso();
  const exists = await alertExistsRecently(userId, title, todayIso);
  if (exists) {
    return;
  }

  await createAlert({
    user_id: userId,
    title,
    message: `A recent expense of ${amount.toFixed(2)} is much higher than your 30-day average (${avg.toFixed(2)}).`,
    severity: "warning",
  });
}

export async function ensurePeriodicSummaryAlerts(userId: string): Promise<void> {
  const nowMs = Date.now();
  const lastRun = periodicSummaryGuard.get(userId);
  if (lastRun && nowMs - lastRun < PERIODIC_SUMMARY_INTERVAL_MS) {
    return;
  }
  periodicSummaryGuard.set(userId, nowMs);

  const supabase = getAdminClient();
  const todayIso = startOfTodayIso();
  const weekIso = startOfWeekIso();

  const todayDate = todayIso.slice(0, 10);
  const { data: weekTx } = await supabase
    .from("transactions")
    .select("type, amount, transaction_date")
    .eq("user_id", userId)
    .gte("transaction_date", weekIso.slice(0, 10));

  const todayTx = (weekTx || []).filter(
    (entry) => String((entry as { transaction_date?: string }).transaction_date || "").slice(0, 10) >= todayDate
  );

  const dailyExists = await alertExistsRecently(userId, "Daily Summary", todayIso);
  if (!dailyExists) {
    const dailyIncome = (todayTx || [])
      .filter((entry) => entry.type === "income")
      .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
    const dailyExpense = (todayTx || [])
      .filter((entry) => entry.type === "expense")
      .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);

    await createAlert({
      user_id: userId,
      title: "Daily Summary",
      message: `Today: income ${dailyIncome.toFixed(2)}, expenses ${dailyExpense.toFixed(2)}, net ${(dailyIncome - dailyExpense).toFixed(2)}.`,
      severity: "info",
    });
  }

  const weeklyExists = await alertExistsRecently(userId, "Weekly Summary", weekIso);
  if (!weeklyExists) {
    const weeklyIncome = (weekTx || [])
      .filter((entry) => entry.type === "income")
      .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
    const weeklyExpense = (weekTx || [])
      .filter((entry) => entry.type === "expense")
      .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);

    await createAlert({
      user_id: userId,
      title: "Weekly Summary",
      message: `This week: income ${weeklyIncome.toFixed(2)}, expenses ${weeklyExpense.toFixed(2)}, net ${(weeklyIncome - weeklyExpense).toFixed(2)}.`,
      severity: "info",
    });
  }
}

export async function listAlerts(userId: string, limit = 200): Promise<AlertRow[]> {
  const supabase = getAdminClient();

  try {
    await ensurePeriodicSummaryAlerts(userId);
  } catch {
    // Alert summary creation is best effort and must not break list response
  }

  const { data, error } = await supabase
    .from("alerts")
    .select("id, user_id, title, message, severity, status, related_budget_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error?.code === "42P01") {
    return [];
  }

  if (error || !data) {
    throw new HttpError(500, "Failed to load alerts");
  }

  return data as AlertRow[];
}

export async function updateAlertStatus(
  userId: string,
  alertId: string,
  status: AlertRow["status"]
): Promise<AlertRow | null> {
  const supabase = getAdminClient();

  if (!alertId) {
    return null;
  }

  if (!(["unread", "read", "dismissed"] as const).includes(status)) {
    throw new HttpError(400, "Invalid alert status");
  }

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
