/**
 * FinSight — Filter Store (Zustand)
 * Centralized search/filter state for the UI
 */
import { create } from "zustand";
import type { TransactionType } from "@/types";

interface FilterStore {
  searchQuery: string;
  selectedType: TransactionType | "all";
  selectedCategoryId: string | null;
  dateFrom: string;
  dateTo: string;
  amountMin: number | null;
  amountMax: number | null;
  tags: string[];
  setSearchQuery: (query: string) => void;
  setSelectedType: (type: TransactionType | "all") => void;
  setSelectedCategory: (categoryId: string | null) => void;
  setDateRange: (from: string, to: string) => void;
  setAmountRange: (min: number | null, max: number | null) => void;
  setTags: (tags: string[]) => void;
  resetAll: () => void;
}

export const useFilterStore = create<FilterStore>((set) => ({
  searchQuery: "",
  selectedType: "all",
  selectedCategoryId: null,
  dateFrom: "",
  dateTo: "",
  amountMin: null,
  amountMax: null,
  tags: [],

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSelectedType: (selectedType) => set({ selectedType }),
  setSelectedCategory: (selectedCategoryId) => set({ selectedCategoryId }),
  setDateRange: (dateFrom, dateTo) => set({ dateFrom, dateTo }),
  setAmountRange: (amountMin, amountMax) => set({ amountMin, amountMax }),
  setTags: (tags) => set({ tags }),

  resetAll: () =>
    set({
      searchQuery: "",
      selectedType: "all",
      selectedCategoryId: null,
      dateFrom: "",
      dateTo: "",
      amountMin: null,
      amountMax: null,
      tags: [],
    }),
}));
