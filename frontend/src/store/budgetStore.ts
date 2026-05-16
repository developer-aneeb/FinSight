/**
 * FinSight — Budget Store (Zustand)
 */
import { create } from "zustand";
import type { Budget } from "@/types";

interface BudgetStore {
  budgets: Budget[];
  isLoading: boolean;
  setBudgets: (budgets: Budget[]) => void;
  addBudget: (budget: Budget) => void;
  updateBudget: (id: string, updated: Budget) => void;
  removeBudget: (id: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useBudgetStore = create<BudgetStore>((set) => ({
  budgets: [],
  isLoading: false,

  setBudgets: (budgets) => set({ budgets, isLoading: false }),

  addBudget: (budget) =>
    set((state) => ({ budgets: [budget, ...state.budgets] })),

  updateBudget: (id, updated) =>
    set((state) => ({
      budgets: state.budgets.map((b) => (b.id === id ? updated : b)),
    })),

  removeBudget: (id) =>
    set((state) => ({
      budgets: state.budgets.filter((b) => b.id !== id),
    })),

  setLoading: (isLoading) => set({ isLoading }),
}));
