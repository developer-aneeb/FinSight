"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/hooks/apiClient";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { AdminSubnav } from "@/components/admin/AdminSubnav";
import { ShieldCheck, Users, UserPlus, Pencil, Trash2 } from "lucide-react";
import type { ApiResponse } from "@/types";
import toast from "react-hot-toast";

type UserRole = "user" | "admin";

interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  is_active?: boolean;
  created_at: string;
}

interface AdminUsersPayload {
  data: AdminUser[];
  total: number;
}

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [draftRoles, setDraftRoles] = useState<Record<string, UserRole>>({});
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [createForm, setCreateForm] = useState({ email: "", full_name: "", password: "", role: "user" as UserRole });
  const [editForm, setEditForm] = useState({ email: "", full_name: "", role: "user" as UserRole, is_active: true });

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [searchInput]);

  const {
    data: usersResponse,
    isLoading: isUsersLoading,
    error: usersError,
  } = useQuery<ApiResponse<AdminUsersPayload>>({
    queryKey: ["admin", "users", page, pageSize, search],
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });

      if (search) {
        params.set("search", search);
      }

      return apiGet(`/admin/users?${params.toString()}`);
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: (payload: { userId: string; role: UserRole }) => apiPatch<AdminUser>("/admin/users", payload),
    onSuccess: () => {
      toast.success("User role updated");
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
    onError: (error: Error) => toast.error(error.message || "Unable to update user role"),
  });

  const createUserMutation = useMutation({
    mutationFn: (payload: { email: string; full_name: string; password: string; role: UserRole }) =>
      apiPost<AdminUser>("/admin/users", payload),
    onSuccess: () => {
      toast.success("User created successfully");
      setIsCreateOpen(false);
      setCreateForm({ email: "", full_name: "", password: "", role: "user" });
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
    onError: (error: Error) => toast.error(error.message || "Unable to create user"),
  });

  const updateUserMutation = useMutation({
    mutationFn: (payload: {
      userId: string;
      email: string;
      full_name: string;
      role: UserRole;
      is_active: boolean;
    }) => apiPatch<AdminUser>("/admin/users", payload),
    onSuccess: () => {
      toast.success("User updated successfully");
      setEditingUser(null);
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
    onError: (error: Error) => toast.error(error.message || "Unable to update user"),
  });

  const deleteUserMutation = useMutation({
    mutationFn: (payload: { userId: string }) => apiDelete<unknown>("/admin/users", payload),
    onSuccess: () => {
      toast.success("User deleted successfully");
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
    onError: (error: Error) => toast.error(error.message || "Unable to delete user"),
  });

  const users = useMemo(() => usersResponse?.data?.data ?? [], [usersResponse?.data?.data]);
  const totalUsers = usersResponse?.data?.total ?? users.length;
  const totalPages = Math.max(1, Math.ceil(totalUsers / pageSize));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    if (!users.length) return;

    setDraftRoles((current) => {
      const next = { ...current };
      for (const user of users) {
        if (!next[user.id]) {
          next[user.id] = user.role;
        }
      }
      return next;
    });
  }, [users]);

  const onRoleChange = (userId: string, value: string) => {
    if (value !== "user" && value !== "admin") return;
    setDraftRoles((current) => ({
      ...current,
      [userId]: value,
    }));
  };

  const saveRole = (user: AdminUser) => {
    const selectedRole = draftRoles[user.id];
    if (!selectedRole || selectedRole === user.role) return;

    updateRoleMutation.mutate({
      userId: user.id,
      role: selectedRole,
    });
  };

  const openEditModal = (user: AdminUser) => {
    setEditingUser(user);
    setEditForm({
      email: user.email,
      full_name: user.full_name || "",
      role: user.role,
      is_active: user.is_active ?? true,
    });
  };

  const submitCreateUser = () => {
    if (!createForm.email || !createForm.full_name || !createForm.password) {
      toast.error("Email, full name and password are required");
      return;
    }

    createUserMutation.mutate(createForm);
  };

  const submitEditUser = () => {
    if (!editingUser) return;

    if (!editForm.email || !editForm.full_name) {
      toast.error("Email and full name are required");
      return;
    }

    updateUserMutation.mutate({
      userId: editingUser.id,
      email: editForm.email,
      full_name: editForm.full_name,
      role: editForm.role,
      is_active: editForm.is_active,
    });
  };

  const deleteUser = (user: AdminUser) => {
    const shouldDelete = window.confirm(`Delete user ${user.email}? This cannot be undone.`);
    if (!shouldDelete) return;
    deleteUserMutation.mutate({ userId: user.id });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <ShieldCheck size={24} className="text-brand-600" />
            <h1 className="text-2xl font-bold text-gray-900">Admin User Management</h1>
          </div>
          <Button leftIcon={<UserPlus size={16} />} onClick={() => setIsCreateOpen(true)}>
            Add User
          </Button>
        </div>
        <AdminSubnav />
      </div>

      <Card>
        <CardHeader className="flex items-center gap-2">
          <Users size={18} className="text-gray-500" />
          <h2 className="font-semibold text-gray-900">Users ({totalUsers})</h2>
        </CardHeader>

        <div className="px-4 pb-3 flex flex-col md:flex-row md:items-center gap-3 md:justify-between">
          <div className="w-full md:max-w-sm">
            <Input
              placeholder="Search by name or email"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </div>
          <div className="w-full md:w-44">
            <Select
              value={String(pageSize)}
              onChange={(event) => {
                const nextPageSize = Number(event.target.value);
                if (!Number.isFinite(nextPageSize) || nextPageSize <= 0) return;
                setPageSize(nextPageSize);
                setPage(1);
              }}
              options={[
                { value: "10", label: "10 / page" },
                { value: "20", label: "20 / page" },
                { value: "50", label: "50 / page" },
              ]}
            />
          </div>
        </div>

        {isUsersLoading ? (
          <div className="p-4">
            <CardSkeleton />
          </div>
        ) : usersError ? (
          <div className="p-8 text-center text-red-500 text-sm">
            Access denied or failed to load users.
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                    <th className="px-4 py-3 font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{u.full_name || "—"}</td>
                      <td className="px-4 py-3 text-gray-600">{u.email}</td>
                      <td className="px-4 py-3">
                        <Badge variant={u.role === "admin" ? "default" : "secondary"}>{u.role}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={u.is_active === false ? "warning" : "success"}>
                          {u.is_active === false ? "inactive" : "active"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Select
                            className="min-w-[130px]"
                            value={draftRoles[u.id] || u.role}
                            onChange={(event) => onRoleChange(u.id, event.target.value)}
                            options={[
                              { value: "user", label: "User" },
                              { value: "admin", label: "Admin" },
                            ]}
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => saveRole(u)}
                            isLoading={updateRoleMutation.isPending}
                            disabled={(draftRoles[u.id] || u.role) === u.role}
                          >
                            Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => openEditModal(u)}>
                            <Pencil size={14} /> Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => deleteUser(u)}
                            isLoading={deleteUserMutation.isPending}
                          >
                            <Trash2 size={14} /> Delete
                          </Button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{new Date(u.created_at).toLocaleDateString("en-PK")}</td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        No users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-4 py-3 border-t flex items-center justify-between gap-3">
              <p className="text-sm text-gray-500">
                Page {page} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= totalPages}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Add New User" size="md">
        <div className="space-y-4">
          <Input
            label="Full Name"
            value={createForm.full_name}
            onChange={(event) => setCreateForm((current) => ({ ...current, full_name: event.target.value }))}
          />
          <Input
            label="Email"
            type="email"
            value={createForm.email}
            onChange={(event) => setCreateForm((current) => ({ ...current, email: event.target.value }))}
          />
          <Input
            label="Password"
            type="password"
            value={createForm.password}
            onChange={(event) => setCreateForm((current) => ({ ...current, password: event.target.value }))}
          />
          <Select
            label="Role"
            value={createForm.role}
            onChange={(event) => setCreateForm((current) => ({ ...current, role: event.target.value as UserRole }))}
            options={[
              { value: "user", label: "User" },
              { value: "admin", label: "Admin" },
            ]}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button onClick={submitCreateUser} isLoading={createUserMutation.isPending}>Create User</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={Boolean(editingUser)} onClose={() => setEditingUser(null)} title="Edit User" size="md">
        <div className="space-y-4">
          <Input
            label="Full Name"
            value={editForm.full_name}
            onChange={(event) => setEditForm((current) => ({ ...current, full_name: event.target.value }))}
          />
          <Input
            label="Email"
            type="email"
            value={editForm.email}
            onChange={(event) => setEditForm((current) => ({ ...current, email: event.target.value }))}
          />
          <Select
            label="Role"
            value={editForm.role}
            onChange={(event) => setEditForm((current) => ({ ...current, role: event.target.value as UserRole }))}
            options={[
              { value: "user", label: "User" },
              { value: "admin", label: "Admin" },
            ]}
          />
          <Select
            label="Status"
            value={editForm.is_active ? "active" : "inactive"}
            onChange={(event) => setEditForm((current) => ({ ...current, is_active: event.target.value === "active" }))}
            options={[
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditingUser(null)}>Cancel</Button>
            <Button onClick={submitEditUser} isLoading={updateUserMutation.isPending}>Update User</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
