"use client";

import { useState } from "react";
import { useTransactions, useCreateTransaction, useDeleteTransaction, useUpdateTransaction } from "@/hooks/useTransactions";
import { useCategories } from "@/hooks/useCategories";
import { TransactionItem } from "@/components/transactions/TransactionItem";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { FilterSidebar } from "@/components/transactions/FilterSidebar";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { TransactionListSkeleton } from "@/components/ui/Skeleton";
import { Card } from "@/components/ui/Card";
import { Plus, SlidersHorizontal } from "lucide-react";
import type { CreateTransactionInput, Transaction } from "@/types";

export default function TransactionsPage() {
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const { data, isLoading } = useTransactions(page);
  const { data: categoriesData } = useCategories();
  const createMutation = useCreateTransaction();
  const updateMutation = useUpdateTransaction();
  const deleteMutation = useDeleteTransaction();

  const transactions = data?.data ?? [];
  const pagination = data?.pagination ?? null;
  const categories = categoriesData?.data ?? [];

  const handleCreate = (input: CreateTransactionInput) => {
    createMutation.mutate(input, {
      onSuccess: () => setShowForm(false),
    });
  };

  const handleUpdate = (input: CreateTransactionInput) => {
    if (!editingTransaction) return;

    updateMutation.mutate(
      { id: editingTransaction.id, ...input },
      {
        onSuccess: () => {
          setShowForm(false);
          setEditingTransaction(null);
        },
      }
    );
  };

  const handleOpenCreate = () => {
    setEditingTransaction(null);
    setShowForm(true);
  };

  const handleOpenEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this transaction?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-500 text-sm mt-1">
            {pagination
              ? `${pagination.total} transaction${pagination.total !== 1 ? "s" : ""} total`
              : "Manage your income & expenses"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal size={16} className="mr-1" />
            Filters
          </Button>
          <Button size="sm" onClick={handleOpenCreate}>
            <Plus size={16} className="mr-1" />
            Add Transaction
          </Button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Filter Sidebar */}
        {showFilters && (
          <div className="w-64 hidden lg:block shrink-0">
            <FilterSidebar
              categories={categories}
              onClose={() => setShowFilters(false)}
            />
          </div>
        )}

        {/* Transaction List */}
        <div className="flex-1">
          <Card>
            {isLoading ? (
              <div className="p-4">
                <TransactionListSkeleton />
              </div>
            ) : transactions.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-gray-400 mb-4">No transactions found</p>
                <Button size="sm" onClick={handleOpenCreate}>
                  <Plus size={16} className="mr-1" />
                  Add your first transaction
                </Button>
              </div>
            ) : (
              <div className="divide-y">
                {transactions.map((t: any) => (
                  <TransactionItem
                    key={t.id}
                    transaction={t}
                    onClick={handleOpenEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <p className="text-sm text-gray-500">
                  Page {pagination.page} of {pagination.totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= pagination.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Mobile Filter Sheet */}
      {showFilters && (
        <Modal
          isOpen={showFilters}
          onClose={() => setShowFilters(false)}
          title="Filters"
          className="lg:hidden"
        >
          <FilterSidebar
            categories={categories}
            onClose={() => setShowFilters(false)}
          />
        </Modal>
      )}

      {/* Add Transaction Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingTransaction(null);
        }}
        title={editingTransaction ? "Edit Transaction" : "Add Transaction"}
      >
        <TransactionForm
          transaction={editingTransaction}
          categories={categories}
          onSubmit={editingTransaction ? handleUpdate : handleCreate}
          onCancel={() => {
            setShowForm(false);
            setEditingTransaction(null);
          }}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      </Modal>
    </div>
  );
}
