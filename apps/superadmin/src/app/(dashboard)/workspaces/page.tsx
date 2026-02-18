import Link from "next/link";
import { listWorkspaces } from "../../actions/workspaces";
import { WorkspaceManager } from "./WorkspaceManager";

export default async function WorkspacesPage() {
  const workspaces = await listWorkspaces();
  return (
    <div className="p-0">
      <Link
        href="/"
        className="text-sm text-gray-600 hover:text-gray-900 mb-4 inline-block"
      >
        ← Superadmin home
      </Link>
      <h1 className="text-2xl font-bold mb-6">Workspace & user management</h1>
      <p className="text-gray-600 mb-6">
        Only superadmin can create workspaces and workspace admin users. No
        frontend registration.
      </p>
      <WorkspaceManager initialWorkspaces={workspaces} />
    </div>
  );
}
