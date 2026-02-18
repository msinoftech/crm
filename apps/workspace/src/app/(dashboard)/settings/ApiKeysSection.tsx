"use client";

import { useState } from "react";
import { Button } from "@crm/shared/ui";
import type { WorkspaceApiKey } from "@/lib/types";
import {
  listWorkspaceApiKeys,
  createWorkspaceApiKey,
  revokeWorkspaceApiKey,
  type CreateApiKeyInput,
} from "../../actions/api-keys";

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export interface ApiKeysSectionProps {
  initialKeys: WorkspaceApiKey[];
}

export function ApiKeysSection({ initialKeys }: ApiKeysSectionProps) {
  const [keys, setKeys] = useState<WorkspaceApiKey[]>(initialKeys);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const [formName, setFormName] = useState("");
  const [formOrigins, setFormOrigins] = useState<string[]>([""]);

  const refreshKeys = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await listWorkspaceApiKeys();
      setKeys(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load API keys");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const origins = formOrigins.map((s) => s.trim()).filter(Boolean);
    if (origins.length === 0) {
      setError("Add at least one allowed website (e.g. https://yoursite.com)");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const input: CreateApiKeyInput = {
        name: formName.trim() || undefined,
        allowed_origins: origins,
      };
      const { key } = await createWorkspaceApiKey(input);
      setCreatedKey(key);
      setCreateOpen(false);
      setFormName("");
      setFormOrigins([""]);
      await refreshKeys();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create API key");
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm("Revoke this API key? It will stop working immediately.")) return;
    setRevokingId(id);
    setError(null);
    try {
      await revokeWorkspaceApiKey(id);
      await refreshKeys();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to revoke");
    } finally {
      setRevokingId(null);
    }
  };

  const addOrigin = () => setFormOrigins((prev) => [...prev, ""]);
  const setOrigin = (index: number, value: string) => {
    setFormOrigins((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };
  const removeOrigin = (index: number) => {
    setFormOrigins((prev) => prev.filter((_, i) => i !== index));
  };

  const copyKey = () => {
    if (createdKey) {
      navigator.clipboard.writeText(createdKey);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">API keys</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Create API keys to add leads from your website. Each key is restricted to the websites you list.
          </p>
          <div className="mt-2 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 font-mono space-y-1">
            <p><strong>Endpoint:</strong> POST /api/public/leads</p>
            <p><strong>Headers:</strong> X-API-Key (or Authorization: Bearer &lt;key&gt;). No need to send Origin—the API uses the request URL (or Origin/Referer if present) and checks it against the allowed websites list.</p>
            <p><strong>Allowed websites:</strong> Add the full origin (e.g. https://yoursite.com or http://localhost:3001 for testing).</p>
            <p><strong>Body:</strong> name, email, phone (required); company, channel, status, owner, whatsapp, subject, message, deal_value (optional).</p>
          </div>
        </div>
        <Button
          type="button"
          onClick={() => {
            setCreateOpen(true);
            setError(null);
          }}
          className="cursor-pointer"
        >
          Create API key
        </Button>
      </div>

      {error && (
        <div className="px-4 py-2 rounded-lg bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      {createdKey && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-2">
          <p className="text-sm font-medium text-amber-800">
            Copy your API key now. You won’t see it again.
          </p>
          <div className="flex flex-wrap gap-2 items-center">
            <code className="flex-1 min-w-0 px-3 py-2 bg-white border border-amber-200 rounded text-sm font-mono break-all">
              {createdKey}
            </code>
            <Button
              type="button"
              variant="outline"
              onClick={copyKey}
              className="cursor-pointer shrink-0"
            >
              Copy
            </Button>
          </div>
          <button
            type="button"
            onClick={() => setCreatedKey(null)}
            className="text-sm text-amber-700 hover:underline"
          >
            Done
          </button>
        </div>
      )}

      <div className="rounded-lg border border-gray-200 overflow-hidden bg-white">
        {keys.length === 0 && !loading ? (
          <div className="px-4 py-8 text-center text-slate-500 text-sm">
            No API keys yet. Create one to add leads from your website via API.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">
                  Key
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">
                  Name
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">
                  Allowed websites
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">
                  Created
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {keys.map((k) => (
                <tr key={k.id}>
                  <td className="px-4 py-2 text-sm font-mono text-slate-600">
                    {k.key_prefix}…
                  </td>
                  <td className="px-4 py-2 text-sm text-slate-700">
                    {k.name || "—"}
                  </td>
                  <td className="px-4 py-2 text-sm text-slate-600">
                    {k.allowed_origins.length === 0
                      ? "—"
                      : k.allowed_origins.join(", ")}
                  </td>
                  <td className="px-4 py-2 text-sm text-slate-500">
                    {formatDate(k.created_at)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => handleRevoke(k.id)}
                      disabled={revokingId === k.id}
                      className="text-red-600 hover:underline text-sm disabled:opacity-50"
                    >
                      {revokingId === k.id ? "Revoking…" : "Revoke"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {createOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-api-key-title"
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h2 id="create-api-key-title" className="text-xl font-bold text-slate-900">
                Create API key
              </h2>
              <button
                type="button"
                className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
                aria-label="Close"
                onClick={() => setCreateOpen(false)}
              >
                ×
              </button>
            </header>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label htmlFor="api-key-name" className="block text-sm font-medium text-slate-700 mb-1">
                  Name (optional)
                </label>
                <input
                  id="api-key-name"
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Production website"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Allowed websites
                </label>
                <p className="text-xs text-slate-500 mb-2">
                  Only requests from these origins (e.g. https://yoursite.com) will be accepted.
                </p>
                {formOrigins.map((origin, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input
                      type="url"
                      value={origin}
                      onChange={(e) => setOrigin(i, e.target.value)}
                      placeholder="https://example.com"
                      className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => removeOrigin(i)}
                      className="px-3 py-2 text-slate-500 hover:text-red-600"
                      aria-label="Remove"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addOrigin}
                  className="text-sm text-indigo-600 hover:underline"
                >
                  + Add website
                </button>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateOpen(false)}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="cursor-pointer disabled:opacity-50">
                  {loading ? "Creating…" : "Create key"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
