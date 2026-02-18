export function formatDate(value: Date | string | number): string {
  const d = typeof value === "object" ? value : new Date(value);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(value: Date | string | number): string {
  const d = typeof value === "object" ? value : new Date(value);
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
