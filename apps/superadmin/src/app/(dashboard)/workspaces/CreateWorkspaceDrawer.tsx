"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@crm/shared/ui";
import {
  createWorkspace,
  createWorkspaceAdminUser,
  notifyWorkspaceCreated,
} from "../../actions/workspaces";

export interface CreateWorkspaceDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateWorkspaceDrawer({
  open,
  onClose,
  onSuccess,
}: CreateWorkspaceDrawerProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    admin_email: "",
    admin_password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setFormData({ name: "", admin_email: "", admin_password: "" });
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const { name, admin_email, admin_password } = formData;
    if (!name.trim()) {
      setError("Workspace name is required.");
      return;
    }
    if (!admin_email.trim()) {
      setError("Primary user email is required.");
      return;
    }
    if (!admin_password || admin_password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const workspace = await createWorkspace(name.trim());
      await createWorkspaceAdminUser(workspace.id, admin_email.trim(), admin_password);
      await notifyWorkspaceCreated(name.trim(), admin_email.trim());
      handleClose();
      onSuccess?.();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create workspace.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex justify-end transition-opacity duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 transition-opacity duration-300"
        aria-hidden="true"
        onClick={handleClose}
      />
      {/* Drawer panel */}
      <section
        className="relative h-full w-full max-w-xl bg-white shadow-2xl flex flex-col transform transition-transform duration-300 translate-x-0"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-gray-200 px-6 py-4 shrink-0">
          <h2 id="drawer-title" className="text-xl font-bold text-slate-900">
            Create New Workspace
          </h2>
          <button
            type="button"
            className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 cursor-pointer"
            aria-label="Close"
            onClick={handleClose}
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-6">
          <form
            onSubmit={handleSubmit}
            className="grid gap-4 p-5 rounded-xl border border-slate-200 bg-gray-50/70"
          >
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Workspace name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Workspace name"
              />
            </div>

            <div className="pt-4 border-t border-slate-200">
              <h3 className="text-base font-semibold text-slate-900 mb-2">
                Primary user
              </h3>
              <p className="text-sm text-slate-600 mb-4">
                Create the workspace admin user. This user will own and manage
                the workspace.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.admin_email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, admin_email: e.target.value }))
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="admin@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={formData.admin_password}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    admin_password: e.target.value,
                  }))
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="••••••••"
                minLength={6}
              />
              <p className="mt-1 text-xs text-slate-500">
                At least 6 characters
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={submitting}
                className="cursor-pointer disabled:opacity-50"
              >
                {submitting ? "Creating…" : "Create"}
              </Button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
