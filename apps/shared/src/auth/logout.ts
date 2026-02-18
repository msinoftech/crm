import type { SupabaseClient } from "@supabase/supabase-js";

/** Keys that may hold auth/session data in storage (clear on logout). */
const AUTH_STORAGE_KEYS = [
  "sb-",
  // Supabase uses sb-<project-ref>-auth-token; prefix covers all
] as const;

/**
 * Clear any cached auth-related data from localStorage/sessionStorage.
 * Supabase signOut() clears its own keys; this clears any app-specific or residual keys.
 */
function clearAuthStorage(): void {
  if (typeof window === "undefined") return;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && AUTH_STORAGE_KEYS.some((prefix) => key.startsWith(prefix))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
    const sessionKeysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && AUTH_STORAGE_KEYS.some((prefix) => key.startsWith(prefix))) {
        sessionKeysToRemove.push(key);
      }
    }
    sessionKeysToRemove.forEach((key) => sessionStorage.removeItem(key));
  } catch {
    // Ignore storage errors (e.g. private mode)
  }
}

/**
 * Shared logout handler: sign out from Supabase and clear local auth/cached data.
 * Use this in both Superadmin and Workspace apps. After calling, clear React auth state
 * (e.g. AuthContext setUser(null)) and redirect to the app's login page.
 */
export async function performLogout(client: SupabaseClient | null): Promise<void> {
  if (client) {
    await client.auth.signOut();
  }
  clearAuthStorage();
}
