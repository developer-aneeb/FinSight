"use client";

import { useMemo } from "react";
import { useAlerts, useDismissAlert, useMarkAlertRead } from "@/hooks/useAlerts";
import { AlertItem } from "@/components/alerts/AlertItem";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { BellRing, Check, Inbox } from "lucide-react";
import type { Alert } from "@/types";

export default function NotificationsPage() {
  const { data: alertsData, isLoading } = useAlerts();
  const dismissMutation = useDismissAlert();
  const markReadMutation = useMarkAlertRead();

  const alerts = useMemo(() => alertsData?.data ?? [], [alertsData?.data]);
  const unreadAlerts = alerts.filter((alert: Alert) => alert.status === "unread");
  const otherAlerts = alerts.filter((alert: Alert) => alert.status !== "unread");

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your budget and system alerts.</p>
      </div>

      <Card>
        <CardHeader className="flex items-center gap-3">
          <BellRing size={20} className="text-amber-500" />
          <h2 className="font-semibold text-gray-900">Unread ({unreadAlerts.length})</h2>
        </CardHeader>
        <div className="p-4 pt-0 space-y-3">
          {isLoading ? (
            <p className="text-gray-400 text-sm">Loading notifications…</p>
          ) : unreadAlerts.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Inbox size={16} />
              <span>No unread notifications.</span>
            </div>
          ) : (
            unreadAlerts.map((alert: Alert) => (
              <div key={alert.id} className="space-y-2">
                <AlertItem
                  alert={alert}
                  onDismiss={(id) => dismissMutation.mutate(id)}
                />
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => markReadMutation.mutate(alert.id)}
                    isLoading={markReadMutation.isPending}
                  >
                    <Check size={14} className="mr-1" />
                    Mark as read
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900">History</h2>
        </CardHeader>
        <div className="p-4 pt-0 space-y-3">
          {isLoading ? (
            <p className="text-gray-400 text-sm">Loading history…</p>
          ) : otherAlerts.length === 0 ? (
            <p className="text-gray-500 text-sm">No previous notifications.</p>
          ) : (
            otherAlerts.map((alert: Alert) => (
              <AlertItem key={alert.id} alert={alert} />
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
