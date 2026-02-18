"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@crm/shared/ui";
import {
  deleteWorkspace,
  getWorkspaceLoginLink,
  updateWorkspaceDisabled,
} from "../../actions/workspaces";
import type { Workspace } from "@/lib/types";
import { CreateWorkspaceDrawer } from "./CreateWorkspaceDrawer";

interface WorkspaceManagerProps {
  initialWorkspaces: Workspace[];
}

export function WorkspaceManager({ initialWorkspaces }: WorkspaceManagerProps) {
  const router = useRouter();
  const workspaces = initialWorkspaces;
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [disableId, setDisableId] = useState<number | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);

  const openDrawer = () => setIsDrawerOpen(true);
  const closeDrawer = () => setIsDrawerOpen(false);

  const handleCreateSuccess = () => {
    router.refresh();
  };

  async function handleDisableToggle(w: Workspace) {
    const action = w.disabled ? "enable" : "disable";
    if (!w.disabled && !confirm("Disable this workspace? The workspace admin will not be able to log in until it is enabled again.")) return;
    setDisableId(w.id);
    try {
      await updateWorkspaceDisabled(w.id, !w.disabled);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : `Failed to ${action} workspace`);
    } finally {
      setDisableId(null);
    }
  }

  async function handleOpenWorkspace(w: Workspace) {
    if (w.disabled) return;
    setOpenId(w.id);
    try {
      const { url } = await getWorkspaceLoginLink(w.id);
      window.location.href = url;
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to open workspace");
      setOpenId(null);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this workspace and its leads?")) return;
    setDeleteId(id);
    try {
      await deleteWorkspace(id);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeleteId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header: title + Create New workspace button */}
      <header className="flex flex-wrap justify-between items-center gap-3">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-slate-800">Workspaces</h2>
          <p className="text-xs text-slate-500">
            Manage workspaces and workspace admin users
          </p>
        </div>
        <Button
          type="button"
          variant="primary"
          onClick={openDrawer}
          className="cursor-pointer"
        >
          Create New workspace
        </Button>
      </header>

      {/* Workspaces table */}
      <section className="overflow-hidden">
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                  Name
                </th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                  Owner
                </th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                  Leads
                </th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                  Disabled
                </th>
                <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {workspaces.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-gray-500"
                  >
                    No workspaces yet. Click &quot;Create New workspace&quot; to
                    add one.
                  </td>
                </tr>
              ) : (
                workspaces.map((w) => (
                  <tr
                    key={w.id}
                    className={
                      w.disabled
                        ? "bg-red-50 text-red-800 border-l-4 border-red-400"
                        : ""
                    }
                  >
                    <td className="px-4 py-2 text-sm font-medium">{w.name}</td>
                    <td
                      className="px-4 py-2 text-sm text-gray-700 truncate max-w-[220px]"
                      title={w.owner_email ?? w.user_id}
                    >
                      {w.owner_email ?? w.user_id}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {w.leads_count ?? 0}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      <span
                        className={
                          w.disabled
                            ? "font-semibold text-red-600"
                            : "text-gray-600"
                        }
                      >
                        {w.disabled ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          type="button"
                          variant="primary"
                          disabled={w.disabled || openId === w.id}
                          onClick={() => handleOpenWorkspace(w)}
                          className="cursor-pointer"
                        >
                          {openId === w.id ? "Opening…" : "Open"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={disableId === w.id}
                          onClick={() => handleDisableToggle(w)}
                          className="cursor-pointer"
                        >
                          {disableId === w.id
                            ? "…"
                            : w.disabled
                              ? "Enable"
                              : "Disable"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          disabled={deleteId === w.id}
                          onClick={() => handleDelete(w.id)}
                        >
                          {deleteId === w.id ? "Deleting…" : "Delete"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Side panel (drawer): Create workspace + primary user */}
      <CreateWorkspaceDrawer
        open={isDrawerOpen}
        onClose={closeDrawer}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}
