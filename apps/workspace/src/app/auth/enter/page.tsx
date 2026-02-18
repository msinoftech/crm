"use client";

import { useEffect, useRef, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useSearchParams } from "next/navigation";

export default function AuthEnterPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) {
      setStatus("error");
      setErrorMessage("App misconfigured");
      return;
    }

    const hash = typeof window !== "undefined" ? window.location.hash : "";
    const workspaceId = searchParams.get("workspace_id");
    if (!workspaceId || !hash) {
      setStatus("error");
      setErrorMessage("Missing token or workspace");
      return;
    }

    done.current = true;
    const client = createBrowserClient(url, anonKey);
    const params = new URLSearchParams(hash.slice(1));
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");
    if (!access_token || !refresh_token) {
      setStatus("error");
      setErrorMessage("Invalid link");
      return;
    }

    client.auth
      .setSession({ access_token, refresh_token })
      .then(() =>
        fetch(
          `/api/auth/set-superadmin-workspace?workspace_id=${encodeURIComponent(workspaceId)}`
        )
      )
      .then((r) => {
        if (!r.ok) throw new Error("Failed to set workspace");
        window.location.href = "/";
      })
      .catch((err) => {
        setStatus("error");
        setErrorMessage(err instanceof Error ? err.message : "Something went wrong");
      });
  }, [searchParams]);

  if (status === "error") {
    return (
      <main className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center text-red-600">{errorMessage}</div>
      </main>
    );
  }
  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="text-gray-500">Opening workspace…</div>
    </main>
  );
}
