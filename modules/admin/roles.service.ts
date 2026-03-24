import { Role } from "@rbac/roles.enum";

export function isAdmin(role: string): boolean {
  return role === Role.ADMIN;
}

export function listAvailableRoles(): Role[] {
  return [Role.ADMIN, Role.USER];
}
