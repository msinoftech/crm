"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@crm/shared/hooks";
import { signIn } from "./actions";

const DEACTIVATED_MESSAGE =
  "Your account is deactivated, please contact administrator.";

function WorkspaceLoginForm() {
  const { client } = useAuth();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const err = searchParams.get("error");
    if (err === "deactivated") {
      setError(DEACTIVATED_MESSAGE);
      if (client) client.auth.signOut().catch(() => {});
    } else if (err === "superadmin_no_workspace") {
      setError("Open a workspace from the Superadmin app first.");
    } else if (err === "invalid") {
      setError("Email and password are required.");
    } else if (err) {
      setError(decodeURIComponent(err));
    }
  }, [searchParams, client]);

  async function handleSubmit(
    e: Parameters<NonNullable<React.ComponentProps<"form">["onSubmit"]>>[0]
  ) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const email = (formData.get("email") as string)?.trim?.();
    const password = formData.get("password") as string;
    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }
    setLoading(true);
    try {
      const result = await signIn(formData);
      if (result.error) {
        setError(result.error);
      } else {
        window.location.href = "/";
      }
    } catch {
      setError("Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-2 text-center">Workspace login</h1>
        <p className="text-gray-600 text-sm text-center mb-6">
          Email/password only. No signup from this app.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="text-sm text-gray-700">Email</span>
            <input
              name="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-sm text-gray-700">Password</span>
            <input
              name="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function WorkspaceLoginPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center p-8">
          <div className="text-gray-500">Loading…</div>
        </main>
      }
    >
      <WorkspaceLoginForm />
    </Suspense>
  );
}
