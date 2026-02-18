"use client";

import Link from "next/link";
import { useAuth } from "@crm/shared/hooks";
import { useEffect, useRef, useState } from "react";
import { Button } from "@crm/shared/ui";
import type { Lead } from "@/lib/types";
import { LEAD_STATUS_OPTIONS } from "@/lib/constants";
import { CreateLeadDrawer } from "./CreateLeadDrawer";
import { EditLeadDrawer } from "./EditLeadDrawer";

const PAGE_SIZE = 10;

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  ...LEAD_STATUS_OPTIONS,
] as const;

export function LeadsManager() {
  const { client, workspace_id, user, loading: authLoading } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const fetchRef = useRef(0);

  const fetchLeads = async () => {
    if (!client || workspace_id == null) return;
    const currentFetch = ++fetchRef.current;
    setLoading(true);
    setError(null);
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    let query = client
      .from("leads")
      .select("*", { count: "exact", head: false })
      .eq("workspace_id", workspace_id)
      .eq("disabled", false)
      .order("created_at", { ascending: false })
      .range(from, to);
    if (statusFilter.trim()) {
      query = query.eq("status", statusFilter.trim());
    }
    const res = await query;
    if (currentFetch !== fetchRef.current) return;
    const rawData = (res as { data?: Lead[] }).data ?? [];
    const err = (res as { error?: { message: string } }).error;
    const count = (res as { count?: number }).count ?? 0;
    const filtered = rawData.filter(
      (row) =>
        row.workspace_id === workspace_id && row.disabled === false
    );
    if (err) {
      setError(err.message);
      setLeads([]);
      setTotalCount(0);
    } else {
      setLeads(filtered as Lead[]);
      const removed = rawData.length - filtered.length;
      setTotalCount(removed > 0 ? Math.max(0, count - removed) : count);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (statusFilter) setPage(1);
  }, [statusFilter]);

  useEffect(() => {
    if (!client || workspace_id == null) {
      if (!authLoading) setLoading(false);
      return;
    }
    fetchLeads();
  }, [client, workspace_id, authLoading, page, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const from = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, totalCount);

  const openDrawer = () => setIsDrawerOpen(true);
  const closeDrawer = () => setIsDrawerOpen(false);
  const handleCreateSuccess = () => fetchLeads();
  const handleEditClose = () => setEditing(null);
  const handleEditSuccess = () => {
    fetchLeads();
    setEditing(null);
  };

  async function handleStatusChange(leadId: string, newStatus: string) {
    if (!client || workspace_id == null) return;
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return;
    setUpdatingStatusId(leadId);
    setError(null);
    const { error: updateError } = await client
      .from("leads")
      .update({ status: newStatus })
      .eq("id", leadId)
      .eq("workspace_id", workspace_id);
    if (updateError) {
      setError(updateError.message);
    } else {
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
      );
      const description =
        lead.status !== newStatus
          ? `Status changed from ${lead.status} to ${newStatus}`
          : `Status updated to ${newStatus}`;
      await client.from("lead_activities").insert({
        workspace_id,
        lead_id: leadId,
        type: "updated",
        description,
        metadata: { status: newStatus },
        created_by: user?.id ?? null,
      });
    }
    setUpdatingStatusId(null);
  }

  async function handleDelete(id: string) {
    if (!client || workspace_id == null || !confirm("Delete this lead?")) return;
    setDeleteId(id);
    setError(null);
    const { error: deleteError } = await client
      .from("leads")
      .delete()
      .eq("id", id)
      .eq("workspace_id", workspace_id);
    if (deleteError) {
      setError(deleteError.message);
    } else {
      fetchLeads();
    }
    setDeleteId(null);
  }

  if (authLoading || (client && workspace_id == null && !error)) {
    return (
      <div className="text-gray-500 py-8">Loading…</div>
    );
  }

  if (!client) {
    return (
      <div className="text-red-600 py-4">Supabase client not available.</div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header: title + Create New lead button (same as create workspace layout) */}
      <header className="flex flex-wrap justify-between items-center gap-3">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-slate-800">Leads</h2>
          <p className="text-xs text-slate-500">
            Workspace-scoped leads. Create and manage leads.
          </p>
        </div>
        <Button
          type="button"
          variant="primary"
          onClick={openDrawer}
          className="cursor-pointer"
        >
          Create New lead
        </Button>
      </header>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-3 items-center">
        <label htmlFor="leads-status-filter" className="text-sm font-medium text-slate-700">
          Filter by status
        </label>
        <select
          id="leads-status-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value || "all"} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Leads table */}
      <section className="overflow-hidden">
        {loading ? (
          <p className="text-gray-500 py-4">Loading leads…</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">
                    Name
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">
                    Email
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">
                    Phone
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">
                    Company
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">
                    Channel
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">
                    Status
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">
                    Owner
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leads.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-3 py-6 text-center text-gray-500 text-sm"
                    >
                      No leads yet. Click &quot;Create New lead&quot; to add one.
                    </td>
                  </tr>
                ) : (
                  leads.map((lead) => (
                    <tr key={lead.id}>
                      <td className="px-3 py-2 text-sm font-medium">
                        {lead.name}
                      </td>
                      <td className="px-3 py-2 text-sm">{lead.email}</td>
                      <td className="px-3 py-2 text-sm">{lead.phone}</td>
                      <td className="px-3 py-2 text-sm">
                        {lead.company ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-sm capitalize">
                        {lead.channel ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-sm">
                        <select
                          value={lead.status}
                          onChange={(e) =>
                            handleStatusChange(lead.id, e.target.value)
                          }
                          disabled={updatingStatusId === lead.id}
                          className="capitalize rounded border border-slate-300 px-2 py-1 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 cursor-pointer"
                        >
                          {STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2 text-sm">
                        {lead.owner ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-right text-sm">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/leads/${lead.id}`}
                            className="text-indigo-600 hover:underline"
                          >
                            View
                          </Link>
                          <button
                            type="button"
                            onClick={() => setEditing(lead)}
                            className="text-blue-600 hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(lead.id)}
                            disabled={deleteId === lead.id}
                            className="text-red-600 hover:underline disabled:opacity-50"
                          >
                            {deleteId === lead.id ? "…" : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {!loading && totalCount > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-600">
            Showing {from}–{to} of {totalCount}
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="cursor-pointer disabled:opacity-50"
            >
              Previous
            </Button>
            <span className="text-sm text-slate-600">
              Page {page} of {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="cursor-pointer disabled:opacity-50"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Side drawer: Create New lead */}
      <CreateLeadDrawer
        open={isDrawerOpen}
        onClose={closeDrawer}
        onSuccess={handleCreateSuccess}
      />

      {/* Side drawer: Edit lead (same layout as create) */}
      <EditLeadDrawer
        open={!!editing}
        lead={editing}
        onClose={handleEditClose}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
}
