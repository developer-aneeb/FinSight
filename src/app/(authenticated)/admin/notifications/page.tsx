"use client";

import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPatch } from "@/hooks/apiClient";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { AdminSubnav } from "@/components/admin/AdminSubnav";
import { BellRing, ShieldCheck, Check, Trash2 } from "lucide-react";
import type { ApiResponse } from "@/types";

interface AdminNotification {
  id: string;
  user_id: string;
  user_email: string;
  user_full_name: string;
  title: string;
  message: string;
  severity: "info" | "warning" | "critical";
  status: "unread" | "read" | "dismissed";
  created_at: string;
}

export default function AdminNotificationsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<ApiResponse<AdminNotification[]>>({
    queryKey: ["admin", "notifications"],
    queryFn: () => apiGet("/admin/notifications", { limit: 100 }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiPatch(`/admin/notifications/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "notifications"] });
    },
  });

  const notifications = useMemo(() => data?.data ?? [], [data?.data]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <ShieldCheck size={24} className="text-brand-600" />
          <h1 className="text-2xl font-bold text-gray-900">Admin Notifications</h1>
        </div>
        <AdminSubnav />
      </div>

      <Card>
        <CardHeader className="flex items-center gap-2">
          <BellRing size={18} className="text-gray-500" />
          <h2 className="font-semibold text-gray-900">Platform Alerts</h2>
        </CardHeader>

        <div className="p-4 pt-0 space-y-3">
          {isLoading ? (
            <CardSkeleton />
          ) : error ? (
            <p className="text-sm text-red-600">Unable to load admin notifications.</p>
          ) : notifications.length === 0 ? (
            <p className="text-sm text-gray-500">No notifications available.</p>
          ) : (
            notifications.map((notification) => (
              <div key={notification.id} className="rounded-lg border border-gray-200 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-semibold text-gray-900">{notification.title}</p>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            notification.severity === "critical"
                              ? "danger"
                              : notification.severity === "warning"
                                ? "warning"
                                : "info"
                          }
                        >
                          {notification.severity}
                        </Badge>
                        <Badge variant={notification.status === "unread" ? "default" : "secondary"}>
                          {notification.status}
                        </Badge>
                      </div>
                    </div>
                    <p className="mt-1 text-sm text-gray-700">{notification.message}</p>
                    <p className="mt-2 text-xs text-gray-500">
                      {notification.user_full_name || notification.user_email} • {new Date(notification.created_at).toLocaleString("en-PK")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {notification.status !== "read" && notification.status !== "dismissed" && (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="flex items-center gap-1"
                        onClick={() => updateStatusMutation.mutate({ id: notification.id, status: "read" })}
                      >
                        <Check size={14} /> Mark Read
                      </Button>
                    )}
                    {notification.status !== "dismissed" && (
                       <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 flex items-center gap-1"
                        onClick={() => updateStatusMutation.mutate({ id: notification.id, status: "dismissed" })}
                      >
                        <Trash2 size={14} /> Dismiss
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
