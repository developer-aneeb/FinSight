import { Role } from "./roles.enum";
import { Action, Resource, ROLE_PERMISSIONS } from "./permissions";

export function hasPermission(role: Role, resource: Resource, action: Action): boolean {
  return ROLE_PERMISSIONS[role][resource].includes(action);
}

export function isAdmin(role: Role): boolean {
  return role === Role.ADMIN;
}
