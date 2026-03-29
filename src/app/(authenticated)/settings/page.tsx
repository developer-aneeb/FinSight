"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAlerts, useDismissAlert } from "@/hooks/useAlerts";
import { useCreateTag, useDeleteTag, useTags } from "@/hooks/useCategories";
import { AlertItem } from "@/components/alerts/AlertItem";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { profileUpdateSchema } from "@/utils/validation";
import { User, Bell, Shield, LogOut, Tags } from "lucide-react";
import type { Alert } from "@/types";

export default function SettingsPage() {
  const { user, logout, updateProfile, isUpdateProfileLoading, requestPasswordReset, isForgotPasswordLoading } = useAuth();
  const { data: alertsData, isLoading: alertsLoading } = useAlerts();
  const dismissMutation = useDismissAlert();
  const { data: tagsData, isLoading: tagsLoading } = useTags();
  const createTagMutation = useCreateTag();
  const deleteTagMutation = useDeleteTag();
  const [fullName, setFullName] = useState("");
  const [preferredCurrency, setPreferredCurrency] = useState("PKR");
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#3B82F6");
  const [profileError, setProfileError] = useState("");

  const alerts: Alert[] = alertsData?.data ?? [];
  const tags = tagsData?.data ?? [];

  useEffect(() => {
    if (!user) {
      return;
    }

    setFullName(user.full_name ?? "");
    setPreferredCurrency((user.preferred_currency ?? "PKR").toUpperCase());
  }, [user]);

  const handleProfileSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload = {
      full_name: fullName,
      preferred_currency: preferredCurrency,
    };

    const parsed = profileUpdateSchema.safeParse(payload);
    if (!parsed.success) {
      setProfileError(parsed.error.issues[0]?.message || "Invalid profile details");
      return;
    }

    setProfileError("");
    updateProfile(parsed.data);
  };

  const handlePasswordReset = () => {
    if (!user?.email) {
      return;
    }

    requestPasswordReset({ email: user.email });
  };

  const handleCreateTag = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalized = newTagName.trim();
    if (!normalized) {
      return;
    }

    createTagMutation.mutate(
      { name: normalized, color: newTagColor },
      {
        onSuccess: () => {
          setNewTagName("");
          setNewTagColor("#3B82F6");
        },
      }
    );
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      {/* Profile Section */}
      <Card>
        <CardHeader className="flex items-center gap-3">
          <User size={20} className="text-brand-600" />
          <h2 className="font-semibold text-gray-900">Profile</h2>
        </CardHeader>
        <form onSubmit={handleProfileSave} className="p-4 pt-0 space-y-4">
          <Input label="Email" value={user?.email ?? ""} disabled />
          <Input
            label="Full Name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            required
          />
          <Input
            label="Preferred Currency"
            value={preferredCurrency}
            onChange={(event) => setPreferredCurrency(event.target.value.toUpperCase())}
            maxLength={3}
            required
          />
          {profileError && <p className="text-sm text-red-600">{profileError}</p>}
          <div className="flex justify-end">
            <Button type="submit" isLoading={isUpdateProfileLoading}>Save Profile</Button>
          </div>
        </form>
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
            Send a password reset link to your email to update your password securely.
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={handlePasswordReset}
            isLoading={isForgotPasswordLoading}
          >
            Send Password Reset Email
          </Button>
        </div>
      </Card>

      <Card>
        <CardHeader className="flex items-center gap-3">
          <Tags size={20} className="text-brand-600" />
          <h2 className="font-semibold text-gray-900">Tag Management</h2>
        </CardHeader>
        <div className="p-4 pt-0 space-y-4">
          <form onSubmit={handleCreateTag} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <Input
              label="Tag Name"
              value={newTagName}
              onChange={(event) => setNewTagName(event.target.value)}
              placeholder="e.g. subscriptions"
            />
            <Input
              label="Color"
              value={newTagColor}
              onChange={(event) => setNewTagColor(event.target.value)}
              placeholder="#3B82F6"
            />
            <Button type="submit" isLoading={createTagMutation.isPending}>
              Add Tag
            </Button>
          </form>

          {tagsLoading ? (
            <p className="text-gray-400 text-sm">Loading tags…</p>
          ) : tags.length === 0 ? (
            <p className="text-gray-400 text-sm">No tags yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <div key={tag.id} className="flex items-center gap-2 rounded-lg border border-gray-200 px-2.5 py-1.5">
                  <Badge variant="info">{tag.name}</Badge>
                  <button
                    type="button"
                    className="text-xs text-red-600 hover:text-red-700"
                    onClick={() => deleteTagMutation.mutate(tag.id)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
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
