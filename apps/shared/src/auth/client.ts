import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import type { User, AppRole } from "./types";

const DEFAULT_ROLE: AppRole = "customer";

/**
 * Create a Supabase client for browser use.
 * Call from each app with env: createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
 */
export function createSupabaseClient(
  url: string,
  anonKey: string
): SupabaseClient {
  return createClient(url, anonKey);
}

/**
 * Map Supabase user + user_metadata to our User type.
 */
export function mapSupabaseUserToUser(supabaseUser: SupabaseUser | null): User | null {
  if (!supabaseUser) return null;

  const meta = (supabaseUser.user_metadata ?? {}) as {
    role?: AppRole;
    workspace_id?: number;
    full_name?: string;
    name?: string;
  };
  const role = meta.role ?? DEFAULT_ROLE;
  const workspace_id =
    typeof meta.workspace_id === "number" ? meta.workspace_id : null;
  const name =
    meta.full_name ?? meta.name ?? supabaseUser.email?.split("@")[0] ?? null;

  return {
    id: supabaseUser.id,
    email: supabaseUser.email ?? "",
    name,
    role,
    workspace_id,
  };
}
