export type { User, Session, AppRole, UserMetadata } from "./types";
export { createSupabaseClient, mapSupabaseUserToUser } from "./client";
export { getCurrentUser, getRole, getWorkspaceId, isRoleAllowed } from "./user";
export {
  SUPERADMIN_APP_ROLES,
  WORKSPACE_APP_ROLES,
  canAccessApp,
  getAllowedRolesForApp,
} from "./access";
export type { AppName } from "./access";
export { getSession, signOut } from "./session";
export { performLogout } from "./logout";
export { AuthProvider, useAuth } from "./AuthContext";
export type { AuthProviderProps, AuthContextValue } from "./AuthContext";
