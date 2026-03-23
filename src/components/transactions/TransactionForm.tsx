/**
 * FinSight — Transaction Form
 * Add/edit transaction modal form
 */
"use client";

import React, { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import type { Transaction, Category, CreateTransactionInput, TransactionType, RecurrenceInterval } from "@/types";

interface TransactionFormProps {
  transaction?: Transaction | null;
  categories: Category[];
  onSubmit: (data: CreateTransactionInput) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  isLoading?: boolean;
}

export function TransactionForm({
  transaction,
  categories,
  onSubmit,
  onCancel,
  isSubmitting = false,
  isLoading = false,
}: TransactionFormProps) {
  const isDisabled = isSubmitting || isLoading;
  const [type, setType] = useState<TransactionType>(transaction?.type || "expense");
  const [amount, setAmount] = useState(transaction?.amount?.toString() || "");
  const [categoryId, setCategoryId] = useState(transaction?.category_id || "");
  const [description, setDescription] = useState(transaction?.description || "");
  const [notes, setNotes] = useState(transaction?.notes || "");
  const [date, setDate] = useState(
    transaction?.transaction_date || new Date().toISOString().split("T")[0]
  );
  const [isRecurring, setIsRecurring] = useState(transaction?.is_recurring || false);
  const [recurrence, setRecurrence] = useState(transaction?.recurrence || "none");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filteredCategories = categories.filter((c) => {
    // Income categories: Salary, Freelance, Investments, Other Income
    const incomeCategories = ["Salary", "Freelance", "Investments", "Other Income"];
    if (type === "income") return incomeCategories.includes(c.name) || !c.is_system;
    return !incomeCategories.includes(c.name) || !c.is_system;
  });

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      newErrors.amount = "Please enter a valid positive amount";
    }
    if (!description.trim()) {
      newErrors.description = "Description is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    await onSubmit({
      type,
      amount: Number(amount),
      category_id: categoryId || undefined,
      description: description.trim(),
      notes: notes.trim(),
      transaction_date: date,
      is_recurring: isRecurring,
      recurrence: isRecurring ? recurrence as CreateTransactionInput["recurrence"] : "none",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Type toggle */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setType("expense")}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            type === "expense"
              ? "bg-red-100 text-red-700 ring-2 ring-red-300"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          💳 Expense
        </button>
        <button
          type="button"
          onClick={() => setType("income")}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            type === "income"
              ? "bg-green-100 text-green-700 ring-2 ring-green-300"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          💰 Income
        </button>
      </div>

      <Input
        label="Amount (PKR)"
        type="number"
        placeholder="0.00"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        error={errors.amount}
        min="0"
        step="0.01"
        required
      />

      <Input
        label="Description"
        placeholder="e.g., Groceries from Metro"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        error={errors.description}
        maxLength={500}
        required
      />

      <Select
        label="Category"
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
        placeholder="Select a category"
        options={filteredCategories.map((c) => ({
          value: c.id,
          label: `${c.icon} ${c.name}`,
        }))}
      />

      <Input
        label="Date"
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />

      <Input
        label="Notes (optional)"
        placeholder="Additional details..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        maxLength={2000}
      />

      {/* Recurring */}
      <div className="flex items-center gap-3">
        <input
          id="recurring"
          type="checkbox"
          checked={isRecurring}
          onChange={(e) => setIsRecurring(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
        />
        <label htmlFor="recurring" className="text-sm text-gray-700">
          Recurring transaction
        </label>
      </div>

      {isRecurring && (
        <Select
          label="Frequency"
          value={recurrence}
          onChange={(e) => setRecurrence(e.target.value as RecurrenceInterval)}
          options={[
            { value: "daily", label: "Daily" },
            { value: "weekly", label: "Weekly" },
            { value: "monthly", label: "Monthly" },
            { value: "yearly", label: "Yearly" },
          ]}
        />
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2">
        {onCancel && (
          <Button variant="ghost" type="button" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" isLoading={isDisabled}>
          {transaction ? "Update" : "Add"} Transaction
        </Button>
      </div>
    </form>
  );
}

export default TransactionForm;
