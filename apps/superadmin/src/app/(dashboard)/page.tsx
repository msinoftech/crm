import Link from "next/link";
import { getDashboardCounts } from "../actions/workspaces";

export default async function SuperadminHome() {
  const { workspacesCount, leadsCount } = await getDashboardCounts();

  return (
    <div className="p-0 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Superadmin</h1>
        <Link
          href="/workspaces"
          className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          Workspace & user management
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-slate-600">
              Total workspaces
            </span>
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-700">
              Workspaces
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{workspacesCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-slate-600">
              Total leads
            </span>
            <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
              Leads
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{leadsCount}</p>
        </div>
      </div>

      <p className="text-slate-600 text-sm">
        Manage workspaces and workspace admin users. No frontend registration.
      </p>
    </div>
  );
}
