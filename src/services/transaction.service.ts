/**
 * FinSight — Transaction Service (Backend)
 * CRUD operations for transactions via Supabase
 */
import { getSupabaseServiceClient } from "../config/supabase";
import logger from "../utils/logger";
import {
  Transaction,
  TransactionFilters,
  CreateTransactionInput,
  UpdateTransactionInput,
  PaginatedResponse,
} from "../types";

const supabase = () => getSupabaseServiceClient();

/** List transactions with filters, pagination, and sorting */
export async function listTransactions(
  userId: string,
  filters: TransactionFilters = {}
): Promise<PaginatedResponse<Transaction>> {
  const {
    type,
    category_id,
    date_from,
    date_to,
    amount_min,
    amount_max,
    search,
    page = 1,
    pageSize = 20,
    sortBy = "transaction_date",
    sortOrder = "desc",
  } = filters;

  let query = supabase()
    .from("transactions")
    .select("*, category:categories(*)", { count: "exact" })
    .eq("user_id", userId);

  if (type) query = query.eq("type", type);
  if (category_id) query = query.eq("category_id", category_id);
  if (date_from) query = query.gte("transaction_date", date_from);
  if (date_to) query = query.lte("transaction_date", date_to);
  if (amount_min) query = query.gte("amount", amount_min);
  if (amount_max) query = query.lte("amount", amount_max);
  if (search) {
    query = query.or(`description.ilike.%${search}%,notes.ilike.%${search}%`);
  }

  query = query.order(sortBy, { ascending: sortOrder === "asc" });

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    logger.error("Failed to list transactions", { userId, error: error.message });
    throw error;
  }

  const total = count || 0;

  return {
    success: true,
    data: (data as Transaction[]) || [],
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/** Get a single transaction by ID */
export async function getTransaction(
  userId: string,
  transactionId: string
): Promise<Transaction | null> {
  const { data, error } = await supabase()
    .from("transactions")
    .select("*, category:categories(*)")
    .eq("id", transactionId)
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  return data as Transaction;
}

/** Create a new transaction */
export async function createTransaction(
  userId: string,
  input: CreateTransactionInput
): Promise<Transaction> {
  const { tags, ...transactionData } = input;

  const { data, error } = await supabase()
    .from("transactions")
    .insert({ ...transactionData, user_id: userId })
    .select("*, category:categories(*)")
    .single();

  if (error) {
    logger.error("Failed to create transaction", { userId, error: error.message });
    throw error;
  }

  // Add tags if provided
  if (tags && tags.length > 0) {
    const tagInserts = tags.map((tag_id) => ({ transaction_id: data.id, tag_id }));
    await supabase().from("transaction_tags").insert(tagInserts);
  }

  logger.info("Transaction created", { id: data.id, userId, type: input.type });
  return data as Transaction;
}

/** Update an existing transaction */
export async function updateTransaction(
  userId: string,
  input: UpdateTransactionInput
): Promise<Transaction> {
  const { id, tags, ...updates } = input;

  const { data, error } = await supabase()
    .from("transactions")
    .update(updates)
    .eq("id", id)
    .eq("user_id", userId)
    .select("*, category:categories(*)")
    .single();

  if (error) {
    logger.error("Failed to update transaction", { id, error: error.message });
    throw error;
  }

  if (tags !== undefined) {
    await supabase().from("transaction_tags").delete().eq("transaction_id", id);
    if (tags.length > 0) {
      const tagInserts = tags.map((tag_id) => ({ transaction_id: id, tag_id }));
      await supabase().from("transaction_tags").insert(tagInserts);
    }
  }

  logger.info("Transaction updated", { id, userId });
  return data as Transaction;
}

/** Delete a transaction */
export async function deleteTransaction(
  userId: string,
  transactionId: string
): Promise<void> {
  const { error } = await supabase()
    .from("transactions")
    .delete()
    .eq("id", transactionId)
    .eq("user_id", userId);

  if (error) {
    logger.error("Failed to delete transaction", { id: transactionId, error: error.message });
    throw error;
  }

  logger.info("Transaction deleted", { id: transactionId, userId });
}

/** Get monthly summary for a user */
export async function getMonthlySummary(
  userId: string,
  year: number,
  month: number
): Promise<{ income: number; expenses: number; net: number; count: number }> {
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate =
    month === 12
      ? `${year + 1}-01-01`
      : `${year}-${String(month + 1).padStart(2, "0")}-01`;

  const { data, error } = await supabase()
    .from("transactions")
    .select("type, amount")
    .eq("user_id", userId)
    .gte("transaction_date", startDate)
    .lt("transaction_date", endDate);

  if (error) throw error;

  let income = 0;
  let expenses = 0;
  for (const t of data || []) {
    if (t.type === "income") income += Number(t.amount);
    else expenses += Number(t.amount);
  }

  return { income, expenses, net: income - expenses, count: data?.length || 0 };
}
