"use client";

import { useState } from "react";
import {
  useBudgets,
  useCreateBudget,
  useUpdateBudget,
  useDeleteBudget,
} from "@/hooks/useBudgets";
import { useCategories } from "@/hooks/useCategories";
import { BudgetProgress } from "@/components/budgets/BudgetProgress";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { Plus, Trash2, Pencil } from "lucide-react";
import type { Budget, CreateBudgetInput } from "@/types";

export default function BudgetsPage() {
  const { data, isLoading } = useBudgets();
  const { data: categoriesData } = useCategories();
  const createMutation = useCreateBudget();
  const updateMutation = useUpdateBudget();
  const deleteMutation = useDeleteBudget();

  const [showForm, setShowForm] = useState(false);
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);
  const budgets = data?.data ?? [];
  const categories = categoriesData?.data ?? [];

  const [formData, setFormData] = useState<CreateBudgetInput>({
    category_id: "",
    name: "",
    amount_limit: 0,
    period: "monthly",
    start_date: new Date().toISOString().slice(0, 10),
    end_date: "",
  });

  const handleCreateOrUpdate = (e: React.FormEvent) => {
    e.preventDefault();

    const payload: CreateBudgetInput = {
      ...formData,
      category_id: formData.category_id || undefined,
      end_date: formData.end_date || undefined,
    };

    if (editingBudgetId) {
      updateMutation.mutate(
        { id: editingBudgetId, ...payload },
        {
          onSuccess: () => {
            setShowForm(false);
            setEditingBudgetId(null);
            setFormData({
              category_id: "",
              name: "",
              amount_limit: 0,
              period: "monthly",
              start_date: new Date().toISOString().slice(0, 10),
              end_date: "",
            });
          },
        }
      );
      return;
    }

    createMutation.mutate(payload, {
      onSuccess: () => {
        setShowForm(false);
        setFormData({
          category_id: "",
          name: "",
          amount_limit: 0,
          period: "monthly",
          start_date: new Date().toISOString().slice(0, 10),
          end_date: "",
        });
      },
    });
  };

  const openCreateModal = () => {
    setEditingBudgetId(null);
    setFormData({
      category_id: "",
      name: "",
      amount_limit: 0,
      period: "monthly",
      start_date: new Date().toISOString().slice(0, 10),
      end_date: "",
    });
    setShowForm(true);
  };

  const openEditModal = (budget: Budget) => {
    setEditingBudgetId(budget.id);
    setFormData({
      category_id: budget.category_id || "",
      name: budget.name,
      amount_limit: Number(budget.amount_limit || 0),
      period: (budget.period as "weekly" | "monthly" | "yearly") || "monthly",
      start_date: budget.start_date || new Date().toISOString().slice(0, 10),
      end_date: budget.end_date || "",
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this budget?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Budgets</h1>
          <p className="text-gray-500 text-sm mt-1">
            Set spending limits and track your progress
          </p>
        </div>
        <Button size="sm" onClick={openCreateModal}>
          <Plus size={16} className="mr-1" />
          Create Budget
        </Button>
      </div>

      {/* Budget Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <CardSkeleton key={i} className="h-40" />
          ))}
        </div>
      ) : budgets.length === 0 ? (
        <Card>
          <div className="p-12 text-center">
            <p className="text-gray-400 mb-4">
              No budgets yet. Start by creating one!
            </p>
            <Button size="sm" onClick={openCreateModal}>
              <Plus size={16} className="mr-1" />
              Create your first budget
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map((budget: any) => (
            <Card key={budget.id} className="card-hover">
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {budget.category?.name ?? "General"}
                    </h3>
                    <p className="text-xs text-gray-400 capitalize">
                      {budget.period}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(budget)}
                      className="text-gray-300 hover:text-brand-600 transition p-1"
                      title="Edit budget"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(budget.id)}
                      className="text-gray-300 hover:text-red-500 transition p-1"
                      title="Delete budget"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <BudgetProgress budget={budget} />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Budget Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingBudgetId(null);
        }}
        title={editingBudgetId ? "Edit Budget" : "Create Budget"}
      >
        <form onSubmit={handleCreateOrUpdate} className="space-y-4">
          <Input
            label="Budget Name"
            placeholder="e.g., Groceries Budget"
            value={formData.name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData({ ...formData, name: e.target.value })
            }
            required
          />

          <Select
            label="Category"
            value={formData.category_id}
            onChange={(e) =>
              setFormData({ ...formData, category_id: e.target.value })
            }
            options={categories.map((c: any) => ({
              value: c.id,
              label: c.name,
            }))}
            required
          />

          <Input
            label="Budget Amount (PKR)"
            type="number"
            min={1}
            value={formData.amount_limit || ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData({ ...formData, amount_limit: Number(e.target.value) })
            }
            required
          />

          <Select
            label="Period"
            value={formData.period}
            onChange={(e) =>
              setFormData({
                ...formData,
                period: e.target.value as "weekly" | "monthly" | "yearly",
              })
            }
            options={[
              { value: "weekly", label: "Weekly" },
              { value: "monthly", label: "Monthly" },
              { value: "yearly", label: "Yearly" },
            ]}
          />

          <Input
            label="Start Date"
            type="date"
            value={formData.start_date}
            onChange={(e) =>
              setFormData({ ...formData, start_date: e.target.value })
            }
            required
          />

          <Input
            label="End Date (optional)"
            type="date"
            value={formData.end_date}
            onChange={(e) =>
              setFormData({ ...formData, end_date: e.target.value })
            }
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingBudgetId(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={createMutation.isPending || updateMutation.isPending}>
              {editingBudgetId ? "Update Budget" : "Create Budget"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
