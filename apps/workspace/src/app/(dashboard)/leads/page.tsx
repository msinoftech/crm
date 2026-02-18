import Link from "next/link";
import { LeadsManager } from "./LeadsManager";

export default function LeadsPage() {
  return (
    <div className="p-0 space-y-4">
      <Link
        href="/"
        className="text-sm text-gray-600 hover:text-gray-900 inline-block"
      >
        ← Workspace home
      </Link>
      <LeadsManager />
    </div>
  );
}
