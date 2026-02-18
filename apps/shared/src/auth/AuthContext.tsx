"use client";

import {
  createContext,
  useContext,
  useMemo,
  useCallback,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { User, AppRole } from "./types";
import { getCurrentUser } from "./user";
import { performLogout } from "./logout";

export interface AuthProviderProps {
  client: SupabaseClient | null;
  children: ReactNode;
  initialSuperadminWorkspaceId?: number | null;
}

export interface AuthContextValue {
  user: User | null;
  role: AppRole | null;
  workspaceId: number | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  /** Supabase client (same as passed to AuthProvider). Use for data with RLS. */
  client: SupabaseClient | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  client,
  children,
  initialSuperadminWorkspaceId = null,
}: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    if (!client) return;
    const u = await getCurrentUser(client);
    setUser(u);
  }, [client]);

  useEffect(() => {
    if (!client) {
      setIsLoading(false);
      return;
    }
    let mounted = true;

    const init = async () => {
      const u = await getCurrentUser(client);
      if (mounted) setUser(u);
      if (mounted) setIsLoading(false);
    };
    init();

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange(() => {
      if (mounted) refreshUser();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [client, refreshUser]);

  const signOut = useCallback(async () => {
    await performLogout(client);
    setUser(null);
  }, [client]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      role: user?.role ?? null,
      workspaceId:
        user?.role === "superadmin" && initialSuperadminWorkspaceId != null
          ? initialSuperadminWorkspaceId
          : user?.workspace_id ?? null,
      isLoading,
      signOut,
      client,
    }),
    [user, isLoading, signOut, client, initialSuperadminWorkspaceId]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
