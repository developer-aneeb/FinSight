"use client";

import { useAuth } from "@/hooks/useAuth";
import { useAlerts, useDismissAlert } from "@/hooks/useAlerts";
import { AlertItem } from "@/components/alerts/AlertItem";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { User, Bell, Shield, LogOut } from "lucide-react";
import type { Alert } from "@/types";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { data: alertsData, isLoading: alertsLoading } = useAlerts();
  const dismissMutation = useDismissAlert();

  const alerts: Alert[] = alertsData?.data ?? [];

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      {/* Profile Section */}
      <Card>
        <CardHeader className="flex items-center gap-3">
          <User size={20} className="text-brand-600" />
          <h2 className="font-semibold text-gray-900">Profile</h2>
        </CardHeader>
        <div className="p-4 pt-0 space-y-4">
          <Input label="Email" value={user?.email ?? ""} disabled />
          <Input
            label="Full Name"
            value={user?.full_name ?? ""}
            disabled
            placeholder="Set in your Supabase profile"
          />
          <p className="text-xs text-gray-400">
            Profile editing will be available in a future update.
          </p>
        </div>
      </Card>

      {/* Alerts / Notifications */}
      <Card>
        <CardHeader className="flex items-center gap-3">
          <Bell size={20} className="text-amber-500" />
          <h2 className="font-semibold text-gray-900">
            Notifications ({alerts.length})
          </h2>
        </CardHeader>
        <div className="p-4 pt-0">
          {alertsLoading ? (
            <p className="text-gray-400 text-sm">Loading alerts…</p>
          ) : alerts.length === 0 ? (
            <p className="text-gray-400 text-sm">No alerts at this time.</p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
              {alerts.map((alert) => (
                <AlertItem
                  key={alert.id}
                  alert={alert}
                  onDismiss={() => dismissMutation.mutate(alert.id)}
                />
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader className="flex items-center gap-3">
          <Shield size={20} className="text-gray-500" />
          <h2 className="font-semibold text-gray-900">Security</h2>
        </CardHeader>
        <div className="p-4 pt-0 space-y-4">
          <p className="text-sm text-gray-500">
            Password reset and 2FA settings are managed through Supabase Auth.
          </p>
        </div>
      </Card>

      {/* Logout */}
      <Card className="border-red-100">
        <div className="p-4 flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900">Sign Out</h3>
            <p className="text-sm text-gray-500">
              End your current session
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => logout()}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            <LogOut size={16} className="mr-1" />
            Sign Out
          </Button>
        </div>
      </Card>
    </div>
  );
}
