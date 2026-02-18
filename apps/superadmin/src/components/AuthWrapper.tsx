"use client";

import { useMemo } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { AuthProvider } from "@crm/shared/auth";

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  const client = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) return null;
    return createBrowserClient(url, anonKey);
  }, []);

  return <AuthProvider client={client}>{children}</AuthProvider>;
}
