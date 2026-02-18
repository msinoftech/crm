/**
 * Auth types – roles and user metadata aligned with Supabase auth.users.user_metadata.
 */
export type AppRole = "superadmin" | "workspace_admin" | "customer";

export interface UserMetadata {
  role?: AppRole;
  workspace_id?: number;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: AppRole;
  workspace_id: number | null;
}

export interface Session {
  user: User;
  expiresAt: number;
}
