import { getAdminClient } from "@config/supabaseAdminClient";
import { HttpError } from "@utils/error";
import env from "@config/env";
import OpenAI from "openai";

export type InsightsGenerationStatus = "reused_previous" | "regenerated_new";

export interface InsightsGenerationResult {
  status: InsightsGenerationStatus;
  message: string;
  insights: unknown[];
  inputSignature: string;
}

function isMissingTable(error: unknown): boolean {
  return !!error && typeof error === "object" && "code" in error && (error as { code?: string }).code === "42P01";
}

function normalizeInsightType(input: unknown): string {
  const type = String(input || "").trim().toLowerCase();
  const allowed = new Set([
    "saving_opportunity",
    "unusual_spend",
    "spending_pattern",
    "budget_warning",
    "advice",
  ]);
  return allowed.has(type) ? type : "advice";
}

function buildTransactionsSignature(
  rows: Array<{
    id?: string | null;
    type?: string | null;
    amount?: number | string | null;
    transaction_date?: string | null;
    description?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
  }>
): string {
  const normalized = rows
    .map((row) => {
      const amount = Number(row.amount || 0).toFixed(2);
      return [
        String(row.id || ""),
        String(row.type || ""),
        amount,
        String(row.transaction_date || ""),
        String(row.description || "").trim().toLowerCase(),
        String(row.created_at || ""),
        String(row.updated_at || ""),
      ].join("|");
    })
    .sort();

  let hash = 0;
  const input = normalized.join("||");
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }

  return `txsig_${rows.length}_${hash.toString(16)}`;
}

async function getLatestInsightSignature(userId: string): Promise<string | null> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("insights")
    .select("metadata, generated_at")
    .eq("user_id", userId)
    .eq("is_dismissed", false)
    .order("generated_at", { ascending: false })
    .limit(30);

  if (isMissingTable(error) || error || !data) {
    return null;
  }

  for (const row of data as Array<{ metadata?: Record<string, unknown> }>) {
    const metadata = row.metadata || {};
    const source = String(metadata.source || "");
    if (!["openai", "rules", "insight_engine"].includes(source)) {
      continue;
    }

    const signature = metadata.inputSignature;
    if (typeof signature === "string" && signature.length > 0) {
      return signature;
    }
  }

  return null;
}

async function dismissPreviousGeneratedInsights(userId: string): Promise<void> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("insights")
    .select("id, metadata")
    .eq("user_id", userId)
    .eq("is_dismissed", false)
    .order("generated_at", { ascending: false })
    .limit(100);

  if (isMissingTable(error) || error || !data || data.length === 0) {
    return;
  }

  const ids = (data as Array<{ id?: string; metadata?: Record<string, unknown> }>)
    .filter((row) => {
      const source = String(row.metadata?.source || "");
      return ["openai", "rules", "insight_engine"].includes(source);
    })
    .map((row) => row.id)
    .filter((id): id is string => Boolean(id));

  if (ids.length === 0) {
    return;
  }

  await supabase
    .from("insights")
    .update({ is_dismissed: true, dismissed_at: new Date().toISOString() })
    .in("id", ids)
    .eq("user_id", userId);
}

export async function listInsights(userId: string, limit = 10) {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("insights")
    .select("*")
    .eq("user_id", userId)
    .eq("is_dismissed", false)
    .order("generated_at", { ascending: false })
    .limit(limit);

  if (isMissingTable(error)) {
    return [];
  }
  if (error) {
    throw new HttpError(500, "Failed to load insights");
  }

  return data || [];
}

async function upsertInsightForToday(
  userId: string,
  title: string,
  body: string,
  insightType: string,
  metadata: Record<string, unknown>
): Promise<void> {
  const supabase = getAdminClient();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { data: existing } = await supabase
    .from("insights")
    .select("id")
    .eq("user_id", userId)
    .eq("title", title)
    .gte("generated_at", startOfDay.toISOString())
    .limit(1);

  if ((existing || []).length > 0) {
    const first = existing?.[0];
    if (first?.id) {
      await supabase
        .from("insights")
        .update({
          body,
          insight_type: insightType,
          metadata,
          is_dismissed: false,
          dismissed_at: null,
          generated_at: new Date().toISOString(),
        })
        .eq("id", first.id)
        .eq("user_id", userId);
      return;
    }
  }

  await supabase.from("insights").insert({
    user_id: userId,
    title,
    body,
    insight_type: insightType,
    metadata,
  });
}

export async function generateInsights(userId: string): Promise<InsightsGenerationResult> {
  const supabase = getAdminClient();

  const since = new Date();
  since.setDate(since.getDate() - 30);

  const { data: transactions, error } = await supabase
    .from("transactions")
    .select("id, type, amount, transaction_date, description, created_at, updated_at, category:categories(name)")
    .eq("user_id", userId)
    .gte("transaction_date", since.toISOString().slice(0, 10));

  if (isMissingTable(error)) {
    return {
      status: "reused_previous",
      message: "Insights storage is not available right now. Showing previous insights.",
      insights: [],
      inputSignature: "",
    };
  }
  if (error || !transactions) {
    throw new HttpError(500, "Failed to generate insights");
  }

  const inputSignature = buildTransactionsSignature(
    transactions as Array<{
      id?: string | null;
      type?: string | null;
      amount?: number | string | null;
      transaction_date?: string | null;
      description?: string | null;
      created_at?: string | null;
      updated_at?: string | null;
    }>
  );

  const previousSignature = await getLatestInsightSignature(userId);
  if (previousSignature && previousSignature === inputSignature) {
    const insights = await listInsights(userId, 10);
    return {
      status: "reused_previous",
      message: "No new transactions detected, showing previous insights.",
      insights,
      inputSignature,
    };
  }

  let hasDismissedPrevious = false;
  let generatedCount = 0;

  const persistInsight = async (
    title: string,
    body: string,
    insightType: string,
    metadata: Record<string, unknown>
  ) => {
    if (!hasDismissedPrevious) {
      await dismissPreviousGeneratedInsights(userId);
      hasDismissedPrevious = true;
    }

    await upsertInsightForToday(userId, title, body, insightType, metadata);
    generatedCount += 1;
  };

  const income = transactions
    .filter((entry) => entry.type === "income")
    .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);

  const expenses = transactions
    .filter((entry) => entry.type === "expense")
    .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);

  // Generate AI-powered insights if OpenAI is configured
  if (env.openAiApiKey) {
    try {
      const openai = new OpenAI({ apiKey: env.openAiApiKey });
      
      const prompt = `
You are an expert personal finance AI assistant for the FinSight app.
Based on the user's last 30 days of transactions, generate 2-3 personalized financial insights.
Income: ${income}
Expenses: ${expenses}
Transactions summary: ${JSON.stringify(transactions.map(t => ({ 
  type: t.type, 
  amount: t.amount, 
  category: (t.category as any)?.name || 'Other',
  date: t.transaction_date 
})).slice(0, 50))} // Sending up to 50 recent txs

Guidelines:
- Act strictly as a personal finance assistant for FinSight.
- Analyze spending patterns.
- Suggest saving opportunities.
- Detect any unexpected outliers.
- Provide actionable, polite advice.
- IF A QUERY IS UNRELATED TO FINANCE OR THIS APP, IGNORE IT OR RETURN EMPTY. Do not generate non-finance insights.

Respond strictly with a JSON object having an "insights" array like this:
{
  "insights": [
    {
      "title": "Short catchy title",
      "body": "Clear advice (1-2 sentences)",
      "insightType": "saving_opportunity" | "unusual_spend" | "spending_pattern" | "budget_warning" | "advice"
    }
  ]
}
`;

      const aiResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      });

      const resultText = aiResponse.choices[0]?.message?.content;
      if (resultText) {
        const parsed = JSON.parse(resultText);
        const aiInsights = Array.isArray(parsed) ? parsed : (parsed.insights || parsed.data || []);
        
        for (const ai of aiInsights) {
          if (ai.title && ai.body && ai.insightType) {
            await persistInsight(ai.title, ai.body, normalizeInsightType(ai.insightType), {
              source: "openai",
              inputSignature,
              transactionCount: transactions.length,
            });
          }
        }
        if (generatedCount > 0) {
          const insights = await listInsights(userId, 10);
          return {
            status: "regenerated_new",
            message: "New transactions detected. Insights were recalculated.",
            insights,
            inputSignature,
          };
        }
      }
    } catch (aiError) {
      console.error("OpenAI Insights generation failed:", aiError);
      // Fallback to rule-based insights silently
    }
  }

  // -------------------------------------------------------------
  // Rule-based deterministic insights fallback/supplement
  // -------------------------------------------------------------

  if (transactions.length === 0) {
    await persistInsight(
      "Welcome to FinSight!",
      "Log your first transaction or link your accounts to start getting personalized financial insights.",
      "advice",
      {
        source: "rules",
        inputSignature,
        transactionCount: transactions.length,
      }
    );
    const insights = await listInsights(userId, 10);
    return {
      status: "regenerated_new",
      message: "New transactions detected. Insights were recalculated.",
      insights,
      inputSignature,
    };
  }

  // 1. Extreme risk message (Cashflow check)
  if (expenses > income && income > 0) {
    await persistInsight(
      "Spending exceeds income",
      `In the last 30 days, your expenses (${expenses.toFixed(2)}) exceeded your income (${income.toFixed(2)}). Consider identifying cutbacks to avoid debt.`,
      "advice",
      { source: "rules", inputSignature, transactionCount: transactions.length, income, expenses }
    );
  }

  // 2. Zero income recorded (Missing entry alerts)
  if (expenses > 0 && income === 0) {
    await persistInsight(
      "Zero income recorded",
      `You have ${expenses.toFixed(2)} in expenses but no income recorded for the last 30 days. Make sure to log your income to keep your balance accurate.`,
      "advice",
      { source: "rules", inputSignature, transactionCount: transactions.length, expenses }
    );
  }

  // 3. Category concentration and unusual spend
  const categorySpend = new Map();
  let largestTx = null;

  for (const tx of transactions) {
    if (tx.type !== "expense") continue;

    const categoryName = String((tx.category as { name?: string } | null)?.name || "Uncategorized");
    categorySpend.set(categoryName, (categorySpend.get(categoryName) || 0) + Number(tx.amount || 0));

    // Detect largest transaction for outlier processing
    if (!largestTx || Number(tx.amount) > Number(largestTx.amount)) {
      largestTx = tx;
    }
  }

  let topCategory = "";
  let topAmount = 0;
  for (const [name, amount] of categorySpend.entries()) {
    if (amount > topAmount) {
      topAmount = amount;
      topCategory = name;
    }
  }

  // Category concentration logic
  if (expenses > 0 && topAmount / expenses >= 0.35) {
    const share = Math.round((topAmount / expenses) * 100);
    await persistInsight(
      "Top spending concentration",
      `${topCategory} contributes ${share}% of your monthly expenses. Setting a tighter budget here can improve your overall savings.`,
      "spending_pattern",
      {
        source: "rules",
        inputSignature,
        transactionCount: transactions.length,
        category: topCategory,
        share,
        amount: topAmount,
      }
    );
  }

  // Transaction Outliers (Unexpected spend)
  if (largestTx && expenses > 0 && Number(largestTx.amount) > expenses * 0.4) {
    const txAmountStr = Number(largestTx.amount).toFixed(2);
    await persistInsight(
      "Large transaction detected",
      `A single transaction of ${txAmountStr} makes up over 40% of your recent expenses. Ensure this aligns with your budget rules.`,
      "unusual_spend",
      {
        source: "rules",
        inputSignature,
        transactionCount: transactions.length,
        amount: largestTx.amount,
        description: largestTx.description,
      }
    );
  }

  // 4. Saving Metrics & Opportunities
  if (income > 0) {
    const savingsRate = ((income - expenses) / income) * 100;

    if (expenses <= income * 0.5) {
      await persistInsight(
        "Excellent savings rate!",
        `You saved ${savingsRate.toFixed(0)}% of your income over the last 30 days! Outstanding work.`,
        "saving_opportunity",
        { source: "rules", inputSignature, transactionCount: transactions.length, savingsRate }
      );
    } else if (savingsRate > 0 && savingsRate < 20) {
      await persistInsight(
        "Low savings rate",
        `Your savings rate is ${savingsRate.toFixed(1)}%. Aim for at least 20% by cutting back on discretionary spending.`,
        "advice",
        { source: "rules", inputSignature, transactionCount: transactions.length, savingsRate }
      );
    }
  }

  if (generatedCount === 0) {
    const insights = await listInsights(userId, 10);
    return {
      status: "reused_previous",
      message: "New transactions were detected, but no strong new patterns were found. Showing previous insights.",
      insights,
      inputSignature,
    };
  }

  const insights = await listInsights(userId, 10);
  return {
    status: "regenerated_new",
    message: "New transactions detected. Insights were recalculated.",
    insights,
    inputSignature,
  };
}

export async function dismissInsight(userId: string, id: string) {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("insights")
    .update({ is_dismissed: true, dismissed_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("id", id)
    .select("id")
    .single();

  if (isMissingTable(error)) {
    throw new HttpError(500, "Insights table is not set up yet");
  }
  if (error || !data) {
    throw new HttpError(404, "Insight not found");
  }
}