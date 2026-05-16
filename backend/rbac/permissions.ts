import { Role } from "./roles.enum";

export const PERMISSIONS = {
  users: ["read", "write", "delete"],
  budgets: ["read", "write", "delete"],
  transactions: ["read", "write", "delete"],
  alerts: ["read", "write", "delete"],
  insights: ["read", "write", "delete"],
} as const;

export type Resource = keyof typeof PERMISSIONS;
export type Action = (typeof PERMISSIONS)[Resource][number];

export const ROLE_PERMISSIONS: Record<Role, { [K in Resource]: readonly Action[] }> = {
  [Role.ADMIN]: {
    users: ["read", "write", "delete"],
    budgets: ["read", "write", "delete"],
    transactions: ["read", "write", "delete"],
    alerts: ["read", "write", "delete"],
    insights: ["read", "write", "delete"],
  },
  [Role.USER]: {
    users: ["read", "write"],
    budgets: ["read", "write", "delete"],
    transactions: ["read", "write", "delete"],
    alerts: ["read", "write"],
    insights: ["read"],
  },
};
