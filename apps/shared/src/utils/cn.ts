/**
 * Simple classNames merger (add clsx or tailwind-merge in apps if needed).
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}
