import Link from "next/link";
import { listAllUsers } from "../../actions/users";
import { UsersManager } from "./UsersManager";

export default async function UsersPage() {
  const users = await listAllUsers();
  return (
    <div className="p-0">
      <Link
        href="/"
        className="text-sm text-gray-600 hover:text-gray-900 mb-4 inline-block"
      >
        ← Superadmin home
      </Link>
      <h1 className="text-2xl font-bold mb-6">Users</h1>
      <p className="text-gray-600 mb-6">
        All Supabase Auth users. Search by email or name and filter by role.
      </p>
      <UsersManager initialUsers={users} />
    </div>
  );
}
