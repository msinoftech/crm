"use client";

import { useEffect, useMemo, useState } from "react";
import type { AuthUserRow } from "../../actions/users";

const PAGE_SIZE = 10;

const ROLE_OPTIONS = [
  { value: "", label: "All roles" },
  { value: "superadmin", label: "Superadmin" },
  { value: "workspace_admin", label: "Workspace admin" },
  { value: "customer", label: "Customer" },
] as const;

function getRole(meta: Record<string, unknown> | null): string {
  if (!meta || typeof meta.role !== "string") return "—";
  return meta.role;
}

function getName(meta: Record<string, unknown> | null): string {
  if (!meta) return "—";
  if (typeof meta.name === "string" && meta.name.trim()) return meta.name;
  if (typeof meta.full_name === "string" && meta.full_name.trim()) return meta.full_name;
  return "—";
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export interface UsersManagerProps {
  initialUsers: AuthUserRow[];
}

export function UsersManager({ initialUsers }: UsersManagerProps) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const role = roleFilter.trim().toLowerCase();
    return initialUsers.filter((u) => {
      const email = (u.email ?? "").toLowerCase();
      const name = getName(u.user_metadata).toLowerCase();
      const userRole = getRole(u.user_metadata).toLowerCase();
      const matchSearch = !q || email.includes(q) || name.includes(q);
      const matchRole = !role || userRole === role;
      return matchSearch && matchRole;
    });
  }, [initialUsers, search, roleFilter]);

  useEffect(() => {
    setPage(1);
  }, [search, roleFilter]);

  const totalCount = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const from = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, totalCount);
  const paginated = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap justify-between items-center gap-3">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-slate-800">Users</h2>
          <p className="text-xs text-slate-500">
            All auth users. Use search and filter to narrow the list.
          </p>
        </div>
      </header>

      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px]">
          <label htmlFor="users-search" className="sr-only">
            Search
          </label>
          <input
            id="users-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email or name…"
            className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div className="w-full sm:w-auto">
          <label htmlFor="users-filter" className="sr-only">
            Filter by role
          </label>
          <select
            id="users-filter"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full sm:w-[180px] px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value || "all"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <section className="overflow-hidden">
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">
                  Email
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">
                  Name
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">
                  Role
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">
                  Created
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">
                  Last sign in
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-6 text-center text-gray-500 text-sm"
                  >
                    {initialUsers.length === 0
                      ? "No users found."
                      : "No users match the search or filter."}
                  </td>
                </tr>
              ) : (
                paginated.map((u) => (
                  <tr key={u.id}>
                    <td className="px-3 py-2 text-sm text-slate-700">
                      {u.email ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-sm text-slate-700">
                      {getName(u.user_metadata)}
                    </td>
                    <td className="px-3 py-2 text-sm text-slate-700 capitalize">
                      {getRole(u.user_metadata)}
                    </td>
                    <td className="px-3 py-2 text-sm text-slate-600">
                      {formatDate(u.created_at)}
                    </td>
                    <td className="px-3 py-2 text-sm text-slate-600">
                      {formatDate(u.last_sign_in_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {totalCount > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-600">
            Showing {from}–{to} of {totalCount}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-slate-600">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
