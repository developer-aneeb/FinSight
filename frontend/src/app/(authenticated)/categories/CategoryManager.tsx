"use client";

import { useState } from "react";
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from "@/hooks/useCategories";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Edit2, FolderOpen, Trash2 } from "lucide-react";
import type { Category } from "@/types";

export function CategoryManager() {
  const { data, isLoading } = useCategories();
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

  const categories = data?.data || [];
  
  const topLevel = categories.filter(c => !c.parent_id);
  const subCats = categories.filter(c => c.parent_id);

  const [formState, setFormState] = useState<{ id?: string; name: string; color: string; icon: string; parent_id: string }>({
    name: "",
    color: "#3B82F6",
    icon: "📁",
    parent_id: "none",
  });
  
  const [editing, setEditing] = useState(false);

  const resetForm = () => {
    setFormState({ name: "", color: "#3B82F6", icon: "📁", parent_id: "none" });
    setEditing(false);
  };

  const handleEdit = (c: Category) => {
    setFormState({
      id: c.id,
      name: c.name,
      color: c.color,
      icon: c.icon,
      parent_id: c.parent_id || "none",
    });
    setEditing(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.name) return;

    const payload = {
      name: formState.name,
      color: formState.color,
      icon: formState.icon,
      parent_id: formState.parent_id === "none" ? null : formState.parent_id,
    };

    if (editing && formState.id) {
      updateMutation.mutate({ id: formState.id, ...payload }, { onSuccess: resetForm });
    } else {
      createMutation.mutate(payload, { onSuccess: resetForm });
    }
  };

  const renderCategory = (c: Category, isSub = false) => {
    return (
      <div key={c.id} className={`flex items-center justify-between p-3 border-b border-gray-100 last:border-0 ${isSub ? "ml-8 bg-gray-50/50 rounded-lg my-1" : ""}`}>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full" style={{ backgroundColor: `${c.color}20`, color: c.color }}>
            <span className="text-lg">{c.icon}</span>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              {c.name}
              {c.is_system && <span className="text-xs text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full inline-block">System</span>}
            </h4>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!c.is_system && (
            <>
              <button 
                type="button"
                onClick={() => handleEdit(c)} 
                className="p-2 text-gray-500 hover:text-brand-600 transition-colors"
                title="Edit Category"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button 
                 type="button"
                 onClick={() => { if(confirm(`Are you sure you want to delete ${c.name}?`)) deleteMutation.mutate(c.id); }}
                 className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                 title="Delete Category"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card className="flex flex-col md:flex-row gap-6 p-6">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900">
              <FolderOpen className="w-5 h-5 text-brand-600" />
              Categories
            </h2>
            <p className="text-sm text-gray-500">Manage categories and sub-categories to organize your spending.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="animate-pulse space-y-3">
             <div className="h-12 bg-gray-200 rounded"></div>
             <div className="h-12 bg-gray-200 rounded"></div>
             <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        ) : (
          <div className="border border-gray-200 rounded-lg overflow-hidden bg-white max-h-[500px] overflow-y-auto">
            {topLevel.length === 0 && <div className="p-4 text-center text-gray-500">No categories found</div>}
            {topLevel.map(c => (
              <div key={c.id}>
                {renderCategory(c)}
                {subCats.filter(sub => sub.parent_id === c.id).map(sub => renderCategory(sub, true))}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="w-full md:w-80 bg-gray-50 rounded-xl p-5 border border-gray-200 flex flex-col h-fit">
        <h3 className="font-semibold text-gray-800 mb-4">{editing ? "Edit Category" : "Add New Category"}</h3>
        <form onSubmit={handleSave} className="space-y-4">
          <Input 
             label="Name" 
             value={formState.name} 
             onChange={e => setFormState({...formState, name: e.target.value})} 
             placeholder="e.g. Subscriptions" 
             required
          />
          <div className="flex gap-3">
             <div className="flex-1">
               <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
               <input 
                 type="color" 
                 value={formState.color} 
                 onChange={e => setFormState({...formState, color: e.target.value})} 
                 className="h-10 w-full rounded border border-gray-300 p-1 cursor-pointer"
               />
             </div>
             <div className="flex-1">
               <Input 
                 label="Icon (Emoji)" 
                 value={formState.icon} 
                 onChange={e => setFormState({...formState, icon: e.target.value})} 
                 placeholder="📱" 
                 maxLength={5}
               />
             </div>
          </div>
          
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Parent Category</label>
            <select
              title="Parent Category"
              value={formState.parent_id}
              onChange={e => setFormState({...formState, parent_id: e.target.value})}
              className="w-full rounded-lg border border-gray-300 p-2.5 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            >
              <option value="none">None (Top Level)</option>
              {topLevel.map(c => (
                 <option key={c.id} value={c.id} disabled={c.id === formState.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="pt-2 flex gap-2">
            <Button type="submit" className="flex-1" isLoading={createMutation.isPending || updateMutation.isPending}>
              {editing ? "Update" : "Create"}
            </Button>
            {editing && (
              <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
            )}
          </div>
        </form>
      </div>
    </Card>
  );
}
