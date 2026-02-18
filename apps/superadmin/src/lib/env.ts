export function getWorkspaceUrl(): string | null {
  const raw =
    process.env.WORKSPACE_APP_URL ??
    process.env.NEXT_PUBLIC_WORKSPACE_APP_URL;
  return typeof raw === "string" && raw.trim() !== ""
    ? raw.replace(/\/$/, "")
    : null;
}
