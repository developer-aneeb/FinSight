import { getAdminClient } from "@config/supabaseAdminClient";
import { createAnomalousSpendAlert, createBudgetThresholdAlerts } from "@modules/alerts/alerts.service";
import { refreshBudgetSpentAndAlerts } from "@modules/budgets/budgets.service";
import { syncTransactionTags } from "@modules/tags/tags.service";
import { HttpError } from "@utils/error";

function isMissingTable(error: unknown): boolean {
  return !!error && typeof error === "object" && "code" in error && (error as { code?: string }).code === "42P01";
}

const DEFAULT_FALLBACK_CATEGORIES: Record<string, { name: string; icon: string; color: string }> = {
  income: { name: "Other Income", icon: "💰", color: "#22C55E" },
  expense: { name: "Other Expense", icon: "📁", color: "#6B7280" },
};

const VALID_RECURRENCES = new Set(["none", "daily", "weekly", "monthly", "yearly"]);

async function validateCategoryOwnership(userId: string, categoryId?: string): Promise<void> {
  if (!categoryId) {
    return;
  }

  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, user_id, is_system")
    .eq("id", categoryId)
    .or(`user_id.eq.${userId},is_system.eq.true`)
    .maybeSingle();

  if (isMissingTable(error)) {
    return;
  }

  if (error || !data) {
    throw new HttpError(400, "Selected category does not exist or is not available for your account.");
  }
}

function validateRecurringState(payload: Record<string, unknown>, current?: { is_recurring?: unknown; recurrence?: unknown }): void {
  const isRecurring =
    typeof payload.is_recurring === "boolean"
      ? payload.is_recurring
      : Boolean(current?.is_recurring);

  const recurrence = String(
    payload.recurrence ?? current?.recurrence ?? "none"
  );

  if (!VALID_RECURRENCES.has(recurrence)) {
    throw new HttpError(400, "Invalid recurrence value.");
  }

  if (isRecurring && recurrence === "none") {
    throw new HttpError(400, "Recurring transactions require a recurrence frequency.");
  }

  if (!isRecurring && recurrence !== "none") {
    throw new HttpError(400, "Recurrence must be 'none' when recurring is disabled.");
  }
}

async function syncBudgetSpent(userId: string): Promise<void> {
  try {
    await refreshBudgetSpentAndAlerts(userId);
  } catch {
    return;
  }
}

async function runPostTransactionSideEffects(userId: string, txType: string, amount: number): Promise<void> {
  await syncBudgetSpent(userId);

  if (txType === "expense") {
    try {
      await createAnomalousSpendAlert(userId, amount);
    } catch {
      // Best-effort alerting should not fail transaction flows
    }
  }

  try {
    await createBudgetThresholdAlerts(userId);
  } catch {
    // Best-effort alerting should not fail transaction flows
  }
}

async function resolveFallbackCategoryId(userId: string, txType: string): Promise<string | undefined> {
  const supabase = getAdminClient();
  const fallback = DEFAULT_FALLBACK_CATEGORIES[txType];
  if (!fallback) {
    return undefined;
  }

  const { data: existing } = await supabase
    .from("categories")
    .select("id")
    .eq("is_system", true)
    .ilike("name", fallback.name)
    .limit(1)
    .maybeSingle();

  if (existing?.id) {
    return String(existing.id);
  }

  const { data: inserted, error } = await supabase
    .from("categories")
    .insert({
      user_id: null,
      is_system: true,
      name: fallback.name,
      icon: fallback.icon,
      color: fallback.color,
    })
    .select("id")
    .single();

  if (!error && inserted?.id) {
    return String(inserted.id);
  }

  if (error?.code === "23505") {
    const { data: retry } = await supabase
      .from("categories")
      .select("id")
      .eq("is_system", true)
      .ilike("name", fallback.name)
      .limit(1)
      .maybeSingle();
    if (retry?.id) {
      return String(retry.id);
    }
  }

  return undefined;
}

export interface TransactionListParams {
  page: number;
  pageSize: number;
  search?: string;
  type?: string;
  categoryId?: string;
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
  tags?: string;
}

export async function listTransactions(userId: string, params: TransactionListParams) {
  const supabase = getAdminClient();
  const offset = (params.page - 1) * params.pageSize;

  let countQuery = supabase.from("transactions").select("id", { count: "exact", head: true }).eq("user_id", userId);
  let dataQuery = supabase
    .from("transactions")
    .select("*, category:categories(*)")
    .eq("user_id", userId)
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(offset, offset + params.pageSize - 1);

  if (params.type) {
    countQuery = countQuery.eq("type", params.type);
    dataQuery = dataQuery.eq("type", params.type);
  }
  if (params.categoryId) {
    countQuery = countQuery.eq("category_id", params.categoryId);
    dataQuery = dataQuery.eq("category_id", params.categoryId);
  }
  if (params.dateFrom) {
    countQuery = countQuery.gte("transaction_date", params.dateFrom);
    dataQuery = dataQuery.gte("transaction_date", params.dateFrom);
  }
  if (params.dateTo) {
    countQuery = countQuery.lte("transaction_date", params.dateTo);
    dataQuery = dataQuery.lte("transaction_date", params.dateTo);
  }
  if (typeof params.amountMin === "number") {
    countQuery = countQuery.gte("amount", params.amountMin);
    dataQuery = dataQuery.gte("amount", params.amountMin);
  }
  if (typeof params.amountMax === "number") {
    countQuery = countQuery.lte("amount", params.amountMax);
    dataQuery = dataQuery.lte("amount", params.amountMax);
  }
  if (params.search) {
    const sanitizedSearch = params.search.replace(/,/g, " ").trim();
    countQuery = countQuery.or(`description.ilike.%${sanitizedSearch}%,notes.ilike.%${sanitizedSearch}%`);
    dataQuery = dataQuery.or(`description.ilike.%${sanitizedSearch}%,notes.ilike.%${sanitizedSearch}%`);
  }

  if (params.tags) {
    const tagsArray = params.tags.split(",").map(t => t.trim()).filter(Boolean);
    if (tagsArray.length > 0) {
      const { data: tagPairs, error: tagFilterError } = await supabase
        .from("transaction_tags")
        .select("transaction_id, tags!inner(name, user_id)")
        .eq("tags.user_id", userId)
        .in("tags.name", tagsArray);

      if (isMissingTable(tagFilterError)) {
        return {
          data: [],
          pagination: { total: 0, page: params.page, pageSize: params.pageSize, totalPages: 0 },
        };
      }

      if (tagFilterError) {
        throw new HttpError(500, "Failed to filter transactions by tags");
      }
        
      const matchingIds = Array.from(
        new Set((tagPairs || []).map((p) => String((p as { transaction_id?: string }).transaction_id || "")).filter(Boolean))
      );
      if (matchingIds.length > 0) {
        countQuery = countQuery.in("id", matchingIds);
        dataQuery = dataQuery.in("id", matchingIds);
      } else {
        return {
          data: [],
          pagination: { total: 0, page: params.page, pageSize: params.pageSize, totalPages: 0 },
        };
      }
    }
  }

  const [{ count, error: countError }, { data, error: dataError }] = await Promise.all([countQuery, dataQuery]);

  if (isMissingTable(countError) || isMissingTable(dataError)) {
    return {
      data: [],
      pagination: {
        total: 0,
        page: params.page,
        pageSize: params.pageSize,
        totalPages: 0,
      },
    };
  }

  if (countError || dataError) {
    throw new HttpError(500, "Failed to load transactions");
  }

  const transactionRows = (data || []) as Array<Record<string, unknown>>;
  const transactionIds = transactionRows.map((row) => String(row.id || "")).filter(Boolean);

  const tagsByTransactionId = new Map<string, Array<{ id: string; name: string; color: string }>>();

  if (transactionIds.length) {
    const { data: tagRows } = await supabase
      .from("transaction_tags")
      .select("transaction_id, tag:tags(id, name, color)")
      .in("transaction_id", transactionIds);

    for (const row of (tagRows || []) as Array<{ transaction_id?: string; tag?: { id?: string; name?: string; color?: string } }>) {
      const txId = String(row.transaction_id || "");
      if (!txId || !row.tag?.id) {
        continue;
      }

      const existing = tagsByTransactionId.get(txId) || [];
      existing.push({
        id: String(row.tag.id),
        name: String(row.tag.name || ""),
        color: String(row.tag.color || "#3B82F6"),
      });
      tagsByTransactionId.set(txId, existing);
    }
  }

  const enrichedData = transactionRows.map((row) => ({
    ...row,
    tags: tagsByTransactionId.get(String(row.id || "")) || [],
  }));

  const total = count || 0;
  return {
    data: enrichedData,
    pagination: {
      total,
      page: params.page,
      pageSize: params.pageSize,
      totalPages: Math.ceil(total / params.pageSize),
    },
  };
}

export async function createTransaction(userId: string, payload: Record<string, unknown>) {
  const supabase = getAdminClient();
  validateRecurringState(payload);
  const txType = String(payload.type || "");

  const insertPayload = { ...payload };
  delete insertPayload.tags;

  if (!insertPayload.category_id && (txType === "income" || txType === "expense")) {
    insertPayload.category_id = await resolveFallbackCategoryId(userId, txType);
  }

  await validateCategoryOwnership(
    userId,
    typeof insertPayload.category_id === "string" ? insertPayload.category_id : undefined
  );

  const tags = Array.isArray(payload.tags)
    ? payload.tags.map((tag) => String(tag))
    : undefined;

  const { data, error } = await supabase
    .from("transactions")
    .insert({ ...insertPayload, user_id: userId })
    .select("*, category:categories(*)")
    .single();

  if (isMissingTable(error)) {
    throw new HttpError(500, "Transactions table is not set up yet");
  }
  if (error) {
    if (error.code === "23503") {
      if ((error.message || "").includes("user_id")) {
        throw new HttpError(400, "User profile is not initialized. Please sign out and sign in again.");
      }
      if ((error.message || "").includes("category_id")) {
        throw new HttpError(400, "Selected category does not exist. Please refresh categories and try again.");
      }
      if ((error.message || "").includes("recurrence")) {
        throw new HttpError(400, "Invalid recurrence value for transaction.");
      }
      if ((error.message || "").includes("type")) {
        throw new HttpError(400, "Invalid transaction type.");
      }
    }

    if (error.code === "23514") {
      throw new HttpError(400, "Transaction data failed validation rules.");
    }

    throw new HttpError(500, "Failed to create transaction");
  }

  if (tags) {
    await syncTransactionTags(userId, String(data.id), tags);
  }

  await runPostTransactionSideEffects(userId, String(data.type || ""), Number(data.amount || 0));

  const { data: loaded } = await supabase
    .from("transactions")
    .select("*, category:categories(*)")
    .eq("id", data.id)
    .eq("user_id", userId)
    .single();

  const { data: tagRows } = await supabase
    .from("transaction_tags")
    .select("tag:tags(id, name, color)")
    .eq("transaction_id", data.id);

  return {
    ...(loaded || data),
    tags: (tagRows || [])
      .map((row) => row.tag)
      .filter(Boolean),
  };
}

export async function getTransactionById(userId: string, id: string) {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("transactions")
    .select("*, category:categories(*)")
    .eq("user_id", userId)
    .eq("id", id)
    .single();

  if (isMissingTable(error)) {
    return null;
  }
  if (error) {
    throw new HttpError(404, "Transaction not found");
  }

  const { data: tagRows } = await supabase
    .from("transaction_tags")
    .select("tag:tags(id, name, color)")
    .eq("transaction_id", id);

  return {
    ...data,
    tags: (tagRows || [])
      .map((row) => row.tag)
      .filter(Boolean),
  };
}

export async function updateTransaction(userId: string, id: string, payload: Record<string, unknown>) {
  const supabase = getAdminClient();
  const { data: existing, error: existingError } = await supabase
    .from("transactions")
    .select("id, is_recurring, recurrence")
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle();

  if (isMissingTable(existingError)) {
    throw new HttpError(500, "Transactions table is not set up yet");
  }

  if (existingError || !existing) {
    throw new HttpError(404, "Transaction not found");
  }

  validateRecurringState(payload, existing);
  await validateCategoryOwnership(userId, typeof payload.category_id === "string" ? payload.category_id : undefined);

  const tags = Array.isArray(payload.tags)
    ? payload.tags.map((tag) => String(tag))
    : undefined;

  const updatePayload = { ...payload };
  delete updatePayload.tags;

  const { data, error } = await supabase
    .from("transactions")
    .update(updatePayload)
    .eq("user_id", userId)
    .eq("id", id)
    .select("*, category:categories(*)")
    .single();

  if (isMissingTable(error)) {
    throw new HttpError(500, "Transactions table is not set up yet");
  }
  if (error) {
    throw new HttpError(404, "Transaction not found");
  }

  if (tags) {
    await syncTransactionTags(userId, id, tags);
  }

  await runPostTransactionSideEffects(userId, String(data.type || ""), Number(data.amount || 0));

  const { data: tagRows } = await supabase
    .from("transaction_tags")
    .select("tag:tags(id, name, color)")
    .eq("transaction_id", id);

  return {
    ...data,
    tags: (tagRows || [])
      .map((row) => row.tag)
      .filter(Boolean),
  };
}

export async function deleteTransaction(userId: string, id: string) {
  const supabase = getAdminClient();
  const { error } = await supabase.from("transactions").delete().eq("user_id", userId).eq("id", id);

  if (isMissingTable(error)) {
    throw new HttpError(500, "Transactions table is not set up yet");
  }
  if (error) {
    throw new HttpError(404, "Transaction not found");
  }

  await runPostTransactionSideEffects(userId, "expense", 0);
}
