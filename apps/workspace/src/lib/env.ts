export function getSuperadminUrl(): string | null {
  const raw = process.env.NEXT_PUBLIC_SUPERADMIN_APP_URL;
  return typeof raw === "string" && raw.trim() !== ""
    ? raw.replace(/\/$/, "")
    : null;
}
