"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { useAuth as useAuthContext } from "../auth";

export interface UseAuthReturn {
  user: ReturnType<typeof useAuthContext>["user"];
  role: ReturnType<typeof useAuthContext>["role"];
  workspace_id: number | null;
  loading: boolean;
  signOut: () => Promise<void>;
  client: SupabaseClient | null;
}

/**
 * Shared auth hook for route guards and UI authorization.
 * Must be used within AuthProvider (from @crm/shared/auth).
 *
 * @example
 * const { user, role, workspace_id, loading } = useAuth();
 * if (loading) return <Spinner />;
 * if (!user) redirect("/login");
 * if (role !== "superadmin") return <Forbidden />;
 */
export function useAuth(): UseAuthReturn {
  const ctx = useAuthContext();
  return {
    user: ctx.user,
    role: ctx.role,
    workspace_id: ctx.workspaceId,
    loading: ctx.isLoading,
    signOut: ctx.signOut,
    client: ctx.client,
  };
}
