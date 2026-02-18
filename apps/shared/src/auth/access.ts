import type { AppRole } from "./types";
import { isRoleAllowed } from "./user";

/**
 * Allowed roles per app – single source of truth for final access validation.
 * - Superadmin cannot access workspace app.
 * - Workspace admin cannot access superadmin app.
 * - Customer can access workspace app only.
 * - Invalid users are redirected to login (enforced by proxy + login page).
 */
export const SUPERADMIN_APP_ROLES: readonly AppRole[] = ["superadmin"];
export const WORKSPACE_APP_ROLES: readonly AppRole[] = [
  "superadmin",
  "workspace_admin",
  "customer",
];

export type AppName = "superadmin" | "workspace";

const APP_ROLES: Record<AppName, readonly AppRole[]> = {
  superadmin: SUPERADMIN_APP_ROLES,
  workspace: WORKSPACE_APP_ROLES,
};

/**
 * Final access validation: can this role access this app?
 * Use in proxy (route guard) and login (after sign-in).
 */
export function canAccessApp(role: AppRole, app: AppName): boolean {
  return isRoleAllowed(role, APP_ROLES[app]);
}

/**
 * Get allowed roles for an app (for error messages / UI).
 */
export function getAllowedRolesForApp(app: AppName): readonly AppRole[] {
  return APP_ROLES[app];
}
