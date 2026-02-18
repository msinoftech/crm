import type { SupabaseClient } from "@supabase/supabase-js";
import type { Session } from "./types";
import { getCurrentUser } from "./user";

/**
 * Get the current session (user + expiry) from Supabase.
 * Use getCurrentUser(client) for just the user.
 */
export async function getSession(
  client: SupabaseClient
): Promise<Session | null> {
  const user = await getCurrentUser(client);
  if (!user) return null;

  const {
    data: { session: supabaseSession },
  } = await client.auth.getSession();
  const expiresAt = supabaseSession?.expires_at
    ? supabaseSession.expires_at * 1000
    : 0;

  return {
    user,
    expiresAt,
  };
}

/**
 * Sign out the current user via Supabase.
 */
export async function signOut(client: SupabaseClient): Promise<void> {
  await client.auth.signOut();
}
