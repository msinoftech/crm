import type { SupabaseClient } from "@supabase/supabase-js";
import type { User, AppRole } from "./types";
import { mapSupabaseUserToUser } from "./client";

/**
 * Get the current authenticated user from Supabase.
 * Returns our User type with role and workspace_id from user_metadata.
 */
export async function getCurrentUser(
  client: SupabaseClient
): Promise<User | null> {
  const {
    data: { user: supabaseUser },
    error,
  } = await client.auth.getUser();
  if (error || !supabaseUser) return null;
  return mapSupabaseUserToUser(supabaseUser);
}

/**
 * Get the user's role from our User (from auth.users.user_metadata.role).
 */
export function getRole(user: User): AppRole {
  return user.role;
}

/**
 * Get the user's workspace_id from our User (from auth.users.user_metadata.workspace_id).
 */
export function getWorkspaceId(user: User): number | null {
  return user.workspace_id;
}

/**
 * Check if the user's role is in the allowed list (for route guards).
 */
export function isRoleAllowed(
  role: AppRole,
  allowedRoles: readonly AppRole[]
): boolean {
  return allowedRoles.includes(role);
}
