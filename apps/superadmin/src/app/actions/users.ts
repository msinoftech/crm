"use server";

import { getCurrentUser, getRole } from "@crm/shared/auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

const SUPERADMIN_ONLY = "Only superadmin can perform this action.";
const PER_PAGE = 100;

async function requireSuperadmin() {
  const client = await createSupabaseServerClient();
  const user = await getCurrentUser(client);
  if (!user) throw new Error("Unauthorized");
  if (getRole(user) !== "superadmin") throw new Error(SUPERADMIN_ONLY);
  return user;
}

export interface AuthUserRow {
  id: string;
  email: string | null;
  user_metadata: Record<string, unknown> | null;
  created_at: string;
  last_sign_in_at: string | null;
}

/** List all auth users (superadmin only). Paginates through Supabase Auth. */
export async function listAllUsers(): Promise<AuthUserRow[]> {
  await requireSuperadmin();
  const admin = createSupabaseAdminClient();
  const all: AuthUserRow[] = [];
  let page = 1;
  let hasMore = true;
  while (hasMore) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: PER_PAGE,
    });
    if (error) throw new Error(error.message);
    const users = data?.users ?? [];
    for (const u of users) {
      all.push({
        id: u.id,
        email: u.email ?? null,
        user_metadata: u.user_metadata ?? null,
        created_at: u.created_at ?? "",
        last_sign_in_at: u.last_sign_in_at ?? null,
      });
    }
    const nextPage = (data as { nextPage?: number | null })?.nextPage;
    hasMore = nextPage != null && users.length === PER_PAGE;
    if (hasMore) page = nextPage as number;
    else hasMore = false;
  }
  return all;
}
