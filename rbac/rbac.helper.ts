import { Role } from "./roles.enum";
import { PERMISSIONS } from "./permissions";

export function hasPermission(role: Role, resource: keyof typeof PERMISSIONS, action: string): boolean {
  if (role === Role.ADMIN) {
    return PERMISSIONS[resource].includes(action as never);
  }

  return role === Role.USER && action === "read";
}
