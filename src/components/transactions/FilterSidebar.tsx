/**
 * FinSight — Filter Sidebar
 * Reusable filter panel for transactions and analytics
 */
"use client";

import React from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { useFilterStore } from "@/store/filterStore";
import { Filter, X } from "lucide-react";
import type { Category } from "@/types";

interface FilterSidebarProps {
  categories: Category[];
  onApply?: () => void;
  isOpen?: boolean;
  onClose: () => void;
}

export function FilterSidebar({
  categories,
  onApply,
  isOpen,
  onClose,
}: FilterSidebarProps) {
  const {
    selectedType,
    selectedCategoryId,
    dateFrom,
    dateTo,
    amountMin,
    amountMax,
    tags,
    setSelectedType,
    setSelectedCategory,
    setDateRange,
    setAmountRange,
    setTags,
    resetAll,
  } = useFilterStore();

  const handleReset = () => {
    resetAll();
    onApply?.();
  };

  if (isOpen === false) return null;

  return (
    <aside
      className="w-72 flex-shrink-0 rounded-xl border border-gray-200 bg-white p-5"
      aria-label="Transaction filters"
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-900">Filters</h3>
        </div>
        <button
          onClick={onClose}
          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 lg:hidden"
          aria-label="Close filters"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-4">
        {/* Transaction Type */}
        <Select
          label="Type"
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value as "all" | "income" | "expense")}
          options={[
            { value: "all", label: "All Transactions" },
            { value: "income", label: "💰 Income" },
            { value: "expense", label: "💳 Expense" },
          ]}
        />

        {/* Category */}
        <Select
          label="Category"
          value={selectedCategoryId || ""}
          onChange={(e) => setSelectedCategory(e.target.value || null)}
          placeholder="All categories"
          options={categories.map((c) => ({
            value: c.id,
            label: `${c.icon} ${c.name}`,
          }))}
        />

        {/* Date Range */}
        <div>
          <p className="mb-1.5 text-sm font-medium text-gray-700">Date Range</p>
          <div className="flex gap-2">
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateRange(e.target.value, dateTo)}
              aria-label="From date"
            />
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateRange(dateFrom, e.target.value)}
              aria-label="To date"
            />
          </div>
        </div>

        {/* Amount Range */}
        <div>
          <p className="mb-1.5 text-sm font-medium text-gray-700">Amount (PKR)</p>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={amountMin?.toString() || ""}
              onChange={(e) =>
                setAmountRange(
                  e.target.value ? Number(e.target.value) : null,
                  amountMax
                )
              }
              min="0"
              aria-label="Minimum amount"
            />
            <Input
              type="number"
              placeholder="Max"
              value={amountMax?.toString() || ""}
              onChange={(e) =>
                setAmountRange(
                  amountMin,
                  e.target.value ? Number(e.target.value) : null
                )
              }
              min="0"
              aria-label="Maximum amount"
            />
          </div>
        </div>

        {/* Tags */}
        <div>
          <p className="mb-1.5 text-sm font-medium text-gray-700">Tags (comma separated)</p>
          <Input
            type="text"
            placeholder="e.g. food, travel"
            value={tags.join(", ")}
            onChange={(e) => {
              const val = e.target.value;
              setTags(val.split(",").map(t => t.trim()).filter(Boolean));
            }}
          />
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={handleReset} className="flex-1">
            Reset
          </Button>
          <Button size="sm" onClick={() => onApply?.()} className="flex-1">
            Apply
          </Button>
        </div>
      </div>
    </aside>
  );
}

export default FilterSidebar;
