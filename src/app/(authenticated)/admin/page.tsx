"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/hooks/apiClient";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { ShieldCheck, Users } from "lucide-react";
import type { ApiResponse } from "@/types";

export default function AdminPage() {
  const { data, isLoading, error } = useQuery<ApiResponse<any[]>>({
    queryKey: ["admin", "users"],
    queryFn: () => apiGet("/admin/users"),
  });

  const users = data?.data ?? [];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <ShieldCheck size={24} className="text-brand-600" />
        <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
      </div>

      <Card>
        <CardHeader className="flex items-center gap-2">
          <Users size={18} className="text-gray-500" />
          <h2 className="font-semibold text-gray-900">
            Users ({users.length})
          </h2>
        </CardHeader>

        {isLoading ? (
          <div className="p-4">
            <CardSkeleton />
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500 text-sm">
            Access denied or failed to load users.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map((u: any) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {u.full_name || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{u.email}</td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={u.role === "admin" ? "default" : "secondary"}
                      >
                        {u.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(u.created_at).toLocaleDateString("en-PK")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
