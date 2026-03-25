import { getAdminClient } from "@config/supabaseAdminClient";
import { HttpError } from "@utils/error";

function isMissingTable(error: unknown): boolean {
  return !!error && typeof error === "object" && "code" in error && (error as { code?: string }).code === "42P01";
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
    countQuery = countQuery.ilike("description", `%${params.search}%`);
    dataQuery = dataQuery.ilike("description", `%${params.search}%`);
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

  const total = count || 0;
  return {
    data: data || [],
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
  const { data, error } = await supabase
    .from("transactions")
    .insert({ ...payload, user_id: userId })
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

  return data;
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

  return data;
}

export async function updateTransaction(userId: string, id: string, payload: Record<string, unknown>) {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("transactions")
    .update(payload)
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

  return data;
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
}
