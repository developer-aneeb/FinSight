"use client";

import { useState } from "react";
import { useTags, useCreateTag, useUpdateTag, useDeleteTag } from "@/hooks/useCategories";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Edit2, Tags, Trash2 } from "lucide-react";
import type { Tag } from "@/types";

export function TagManager() {
  const { data, isLoading } = useTags();
  const createMutation = useCreateTag();
  const updateMutation = useUpdateTag();
  const deleteMutation = useDeleteTag();

  const tags = data?.data || [];

  const [formState, setFormState] = useState<{ id?: string; name: string; color: string }>({
    name: "",
    color: "#3B82F6",
  });
  
  const [editing, setEditing] = useState(false);

  const resetForm = () => {
    setFormState({ name: "", color: "#3B82F6" });
    setEditing(false);
  };

  const handleEdit = (t: Tag) => {
    setFormState({
      id: t.id,
      name: t.name,
      color: t.color,
    });
    setEditing(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.name) return;

    const payload = {
      name: formState.name,
      color: formState.color,
    };

    if (editing && formState.id) {
      updateMutation.mutate({ id: formState.id, ...payload }, { onSuccess: resetForm });
    } else {
      createMutation.mutate(payload, { onSuccess: resetForm });
    }
  };

  return (
    <Card className="flex flex-col md:flex-row gap-6 p-6">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900">
              <Tags className="w-5 h-5 text-brand-600" />
              Tags
            </h2>
            <p className="text-sm text-gray-500">Create custom tags for advanced grouping of transactions.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="animate-pulse flex gap-2 flex-wrap">
             <div className="h-8 w-24 bg-gray-200 rounded-full"></div>
             <div className="h-8 w-20 bg-gray-200 rounded-full"></div>
             <div className="h-8 w-32 bg-gray-200 rounded-full"></div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {tags.length === 0 && <span className="text-gray-500 text-sm">No tags found. Create one.</span>}
            {tags.map(t => (
              <div 
                key={t.id} 
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border bg-white shadow-sm"
                style={{ borderColor: t.color }}
              >
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color }}></div>
                <span className="text-sm font-medium text-gray-700">{t.name}</span>
                <div className="flex items-center gap-1 border-l pl-2 ml-1">
                  <button onClick={() => handleEdit(t)} className="text-gray-400 hover:text-brand-600">
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button onClick={() => { if(confirm(`Delete tag ${t.name}?`)) deleteMutation.mutate(t.id); }} className="text-gray-400 hover:text-red-500">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="w-full md:w-80 bg-gray-50 rounded-xl p-5 border border-gray-200 flex flex-col h-fit">
        <h3 className="font-semibold text-gray-800 mb-4">{editing ? "Edit Tag" : "Add New Tag"}</h3>
        <form onSubmit={handleSave} className="space-y-4">
          <Input 
             label="Tag Name" 
             value={formState.name} 
             onChange={e => setFormState({...formState, name: e.target.value})} 
             placeholder="e.g. Travel Trip" 
             required
          />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Color Marker</label>
            <input 
              type="color" 
              value={formState.color} 
              onChange={e => setFormState({...formState, color: e.target.value})} 
              className="h-10 w-full rounded border border-gray-300 p-1 cursor-pointer"
            />
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
