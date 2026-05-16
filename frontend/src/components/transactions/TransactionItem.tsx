/**
 * FinSight — Transaction List Item
 */
"use client";

import React from "react";
import { cn } from "@/utils/cn";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatRelativeDate } from "@/utils/dateHelpers";
import Badge from "@/components/ui/Badge";
import { Trash2 } from "lucide-react";
import type { Transaction } from "@/types";

interface TransactionItemProps {
  transaction: Transaction;
  onClick?: (transaction: Transaction) => void;
  onDelete?: (id: string) => void;
}

export function TransactionItem({ transaction, onClick, onDelete }: TransactionItemProps) {
  const isIncome = transaction.type === "income";

  return (
    <div
      className={cn(
        "flex w-full items-center gap-3 rounded-lg border border-gray-100 bg-white p-3",
        "text-left transition-colors hover:bg-gray-50",
        onClick && "cursor-pointer"
      )}
      onClick={() => onClick?.(transaction)}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick(transaction);
        }
      }}
      aria-label={`${transaction.description || transaction.type} — ${formatCurrency(transaction.amount)}`}
    >
      {/* Category icon */}
      <div
        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-lg"
        style={{ backgroundColor: transaction.category?.color + "20" }}
      >
        {transaction.category?.icon || (isIncome ? "💰" : "💳")}
      </div>

      {/* Description */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-900">
          {transaction.description || (isIncome ? "Income" : "Expense")}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {formatRelativeDate(transaction.transaction_date)}
          </span>
          {transaction.category && (
            <Badge variant="default">{transaction.category.name}</Badge>
          )}
          {transaction.is_recurring && transaction.recurrence !== "none" && (
            <Badge variant="warning">Recurring: {transaction.recurrence}</Badge>
          )}
        </div>
        {!!transaction.notes && (
          <p className="mt-1 truncate text-xs text-gray-500">{transaction.notes}</p>
        )}
        {transaction.tags && transaction.tags.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {transaction.tags.slice(0, 3).map((tag) => (
              <span
                key={tag.id}
                className="rounded-full border border-gray-200 px-2 py-0.5 text-[10px] text-gray-600"
              >
                #{tag.name}
              </span>
            ))}
            {transaction.tags.length > 3 && (
              <span className="rounded-full border border-gray-200 px-2 py-0.5 text-[10px] text-gray-500">
                +{transaction.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Amount */}
      <p
        className={cn(
          "flex-shrink-0 text-sm font-semibold",
          isIncome ? "text-finance-income" : "text-finance-expense"
        )}
      >
        {isIncome ? "+" : "-"}{formatCurrency(transaction.amount)}
      </p>

      {/* Delete button */}
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(transaction.id);
          }}
          className="flex-shrink-0 rounded p-1.5 text-gray-300 hover:bg-red-50 hover:text-red-500 transition-colors"
          aria-label={`Delete ${transaction.description || "transaction"}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export default TransactionItem;

/** Transaction list container */
export function TransactionList({
  transactions,
  onItemClick,
  emptyMessage = "No transactions found.",
}: {
  transactions: Transaction[];
  onItemClick?: (t: Transaction) => void;
  emptyMessage?: string;
}) {
  if (transactions.length === 0) {
    return (
      <div className="py-12 text-center text-gray-400">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2" role="list" aria-label="Transactions">
      {transactions.map((t) => (
        <TransactionItem key={t.id} transaction={t} onClick={onItemClick} />
      ))}
    </div>
  );
}
