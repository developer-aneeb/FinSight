import { getAdminClient } from "@config/supabaseAdminClient";
import { HttpError } from "@utils/error";

export type PipelineInput = {
  lookbackDays: number;
  minCategorySharePct: number;
  minRecurringCount: number;
  maxSuggestions: number;
  commitInsights: boolean;
};

type Recommendation = {
  title: string;
  body: string;
  insightType: "saving_opportunity" | "spending_pattern" | "unusual_spend" | "advice";
  score: number;
  metadata: Record<string, unknown>;
};

export type PipelineRunStatus = "success" | "failed";

export type PipelineRunHistoryItem = {
  id: string;
  status: PipelineRunStatus;
  mode: "dry-run" | "commit";
  lookback_days: number;
  recommendations_count: number;
  persisted_insights: number;
  error_message: string | null;
  started_at: string;
  finished_at: string;
};

export type AnalysisPipelineResult = {
  runAt: string;
  lookbackDays: number;
  stats: {
    transactionsScanned: number;
    expensesScanned: number;
    totalExpense: number;
    normalizedDescriptions: number;
    uniqueNormalizedDescriptions: number;
    categoriesFound: number;
  };
  patterns: {
    topCategories: Array<{ category: string; amount: number; sharePct: number }>;
    recurringMerchants: Array<{ merchant: string; count: number; total: number }>;
    weekdaySpend: Record<string, number>;
  };
  recommendations: Recommendation[];
  persistedInsights: number;
  mode: "dry-run" | "commit";
};

function isMissingTable(error: unknown): boolean {
  return !!error && typeof error === "object" && "code" in error && (error as { code?: string }).code === "42P01";
}

function normalizeDescription(input: unknown): string {
  const raw = String(input || "").toLowerCase();
  return raw
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function safeAmount(value: unknown): number {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount) || amount < 0) return 0;
  return amount;
}

async function persistRecommendations(userId: string, recommendations: Recommendation[]) {
  if (recommendations.length === 0) {
    return 0;
  }

  const supabase = getAdminClient();
  const runId = crypto.randomUUID();

  const rows = recommendations.map((rec) => ({
    user_id: userId,
    title: rec.title,
    body: rec.body,
    insight_type: rec.insightType,
    metadata: {
      ...rec.metadata,
      source: "analysis_pipeline",
      pipeline_run_id: runId,
    },
  }));

  const { error } = await supabase.from("insights").insert(rows);
  if (isMissingTable(error)) {
    throw new HttpError(500, "Insights table is not set up yet");
  }
  if (error) {
    throw new HttpError(500, "Failed to persist pipeline insights");
  }

  return rows.length;
}

export async function runAnalysisPipeline(userId: string, input: PipelineInput) {
  const supabase = getAdminClient();

  const since = new Date();
  since.setDate(since.getDate() - input.lookbackDays);

  const { data, error } = await supabase
    .from("transactions")
    .select("id, type, amount, description, transaction_date, category:categories(name)")
    .eq("user_id", userId)
    .gte("transaction_date", since.toISOString().slice(0, 10));

  if (isMissingTable(error)) {
    throw new HttpError(500, "Transactions table is not set up yet");
  }
  if (error || !data) {
    throw new HttpError(500, "Failed to run analysis pipeline");
  }

  const expenses = data.filter((tx) => tx.type === "expense");
  const normalizedDescriptions = expenses.map((tx) => normalizeDescription(tx.description));

  const categoryTotals = new Map<string, number>();
  const merchantCounts = new Map<string, { count: number; total: number }>();
  const weekdaySpend = new Map<string, number>([
    ["Sun", 0],
    ["Mon", 0],
    ["Tue", 0],
    ["Wed", 0],
    ["Thu", 0],
    ["Fri", 0],
    ["Sat", 0],
  ]);

  let totalExpense = 0;

  for (const tx of expenses) {
    const amount = safeAmount(tx.amount);
    totalExpense += amount;

    const categoryName = String((tx.category as { name?: string } | null)?.name || "Uncategorized");
    categoryTotals.set(categoryName, (categoryTotals.get(categoryName) || 0) + amount);

    const normalized = normalizeDescription(tx.description);
    if (normalized.length >= 3) {
      const current = merchantCounts.get(normalized) || { count: 0, total: 0 };
      current.count += 1;
      current.total += amount;
      merchantCounts.set(normalized, current);
    }

    const dayIndex = new Date(String(tx.transaction_date)).getDay();
    const dayKey = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dayIndex] || "Sun";
    weekdaySpend.set(dayKey, (weekdaySpend.get(dayKey) || 0) + amount);
  }

  const topCategories = Array.from(categoryTotals.entries())
    .map(([category, amount]) => ({
      category,
      amount,
      sharePct: totalExpense > 0 ? Number(((amount / totalExpense) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  const recurringMerchants = Array.from(merchantCounts.entries())
    .filter(([, value]) => value.count >= input.minRecurringCount)
    .map(([merchant, value]) => ({ merchant, count: value.count, total: Number(value.total.toFixed(2)) }))
    .sort((a, b) => b.count - a.count || b.total - a.total)
    .slice(0, 10);

  const recommendations: Recommendation[] = [];

  const dominantCategory = topCategories[0];
  if (dominantCategory && dominantCategory.sharePct >= input.minCategorySharePct) {
    recommendations.push({
      title: `High concentration in ${dominantCategory.category}`,
      body: `${dominantCategory.category} represents ${dominantCategory.sharePct}% of your recent expenses. Setting a tighter budget here can improve savings quickly.`,
      insightType: "spending_pattern",
      score: dominantCategory.sharePct,
      metadata: dominantCategory,
    });
  }

  const topRecurring = recurringMerchants[0];
  if (topRecurring) {
    recommendations.push({
      title: "Recurring spend opportunity",
      body: `You spent ${topRecurring.total.toFixed(0)} across ${topRecurring.count} recurring '${topRecurring.merchant}' transactions. Review if this can be reduced or optimized.`,
      insightType: "saving_opportunity",
      score: topRecurring.total,
      metadata: topRecurring,
    });
  }

  const weekdayEntries = Array.from(weekdaySpend.entries()).sort((a, b) => b[1] - a[1]);
  if (weekdayEntries.length > 0 && weekdayEntries[0][1] > 0) {
    recommendations.push({
      title: `Peak spend day: ${weekdayEntries[0][0]}`,
      body: `Your highest spending tends to happen on ${weekdayEntries[0][0]}. Planning a daily cap for that day can reduce monthly leakage.`,
      insightType: "advice",
      score: weekdayEntries[0][1],
      metadata: {
        day: weekdayEntries[0][0],
        amount: Number(weekdayEntries[0][1].toFixed(2)),
      },
    });
  }

  const sortedRecommendations = recommendations
    .sort((a, b) => b.score - a.score)
    .slice(0, input.maxSuggestions);

  const persistedCount = input.commitInsights
    ? await persistRecommendations(userId, sortedRecommendations)
    : 0;

  return {
    runAt: new Date().toISOString(),
    lookbackDays: input.lookbackDays,
    stats: {
      transactionsScanned: data.length,
      expensesScanned: expenses.length,
      totalExpense: Number(totalExpense.toFixed(2)),
      normalizedDescriptions: normalizedDescriptions.filter(Boolean).length,
      uniqueNormalizedDescriptions: new Set(normalizedDescriptions.filter(Boolean)).size,
      categoriesFound: topCategories.length,
    },
    patterns: {
      topCategories,
      recurringMerchants,
      weekdaySpend: Object.fromEntries(weekdaySpend),
    },
    recommendations: sortedRecommendations,
    persistedInsights: persistedCount,
    mode: input.commitInsights ? "commit" : "dry-run",
  } satisfies AnalysisPipelineResult;
}

export async function createPipelineRunLog(
  userId: string,
  input: PipelineInput,
  status: PipelineRunStatus,
  startedAtIso: string,
  result?: AnalysisPipelineResult,
  errorMessage?: string
) {
  const supabase = getAdminClient();

  const row = {
    user_id: userId,
    status,
    mode: input.commitInsights ? "commit" : "dry-run",
    lookback_days: input.lookbackDays,
    recommendations_count: result?.recommendations.length ?? 0,
    persisted_insights: result?.persistedInsights ?? 0,
    error_message: errorMessage?.slice(0, 400) || null,
    started_at: startedAtIso,
    finished_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("pipeline_runs").insert(row);
  if (isMissingTable(error)) {
    return;
  }
}

export async function listPipelineRunHistory(userId: string, limit = 10): Promise<PipelineRunHistoryItem[]> {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from("pipeline_runs")
    .select("id, status, mode, lookback_days, recommendations_count, persisted_insights, error_message, started_at, finished_at")
    .eq("user_id", userId)
    .order("started_at", { ascending: false })
    .limit(limit);

  if (isMissingTable(error)) {
    return [];
  }
  if (error) {
    throw new HttpError(500, "Failed to load pipeline run history");
  }

  return (data || []) as PipelineRunHistoryItem[];
}
