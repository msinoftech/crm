import { listWorkspaceApiKeys } from "../../actions/api-keys";
import { ApiKeysSection } from "./ApiKeysSection";

export default async function SettingsPage() {
  let initialKeys: Awaited<ReturnType<typeof listWorkspaceApiKeys>> = [];
  try {
    initialKeys = await listWorkspaceApiKeys();
  } catch {
    // Unauthorized or not in workspace – client will refetch if needed
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
      <ApiKeysSection initialKeys={initialKeys} />
    </div>
  );
}
