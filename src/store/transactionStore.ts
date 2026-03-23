/**
 * FinSight — Transaction Store (Zustand)
 * Client-side cache for transaction data
 */
import { create } from "zustand";
import type { Transaction, TransactionFilters } from "@/types";

interface TransactionStore {
  transactions: Transaction[];
  total: number;
  isLoading: boolean;
  filters: TransactionFilters;
  setTransactions: (transactions: Transaction[], total: number) => void;
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (id: string, updated: Transaction) => void;
  removeTransaction: (id: string) => void;
  setFilters: (filters: Partial<TransactionFilters>) => void;
  resetFilters: () => void;
  setLoading: (loading: boolean) => void;
}

const defaultFilters: TransactionFilters = {
  page: 1,
  pageSize: 20,
  sortBy: "transaction_date",
  sortOrder: "desc",
};

export const useTransactionStore = create<TransactionStore>((set) => ({
  transactions: [],
  total: 0,
  isLoading: false,
  filters: { ...defaultFilters },

  setTransactions: (transactions, total) =>
    set({ transactions, total, isLoading: false }),

  addTransaction: (transaction) =>
    set((state) => ({
      transactions: [transaction, ...state.transactions],
      total: state.total + 1,
    })),

  updateTransaction: (id, updated) =>
    set((state) => ({
      transactions: state.transactions.map((t) =>
        t.id === id ? updated : t
      ),
    })),

  removeTransaction: (id) =>
    set((state) => ({
      transactions: state.transactions.filter((t) => t.id !== id),
      total: state.total - 1,
    })),

  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters, page: newFilters.page ?? 1 },
    })),

  resetFilters: () => set({ filters: { ...defaultFilters } }),

  setLoading: (isLoading) => set({ isLoading }),
}));
