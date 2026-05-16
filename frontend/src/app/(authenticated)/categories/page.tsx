"use client";

import { CategoryManager } from "./CategoryManager";
import { TagManager } from "./TagManager";

export default function CategoriesAndTagsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Categories &amp; Tags</h1>
        <p className="mt-1 text-sm text-gray-500">
          Centralized control over how your transactions are classified and grouped.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <CategoryManager />
        <TagManager />
      </div>
    </div>
  );
}
