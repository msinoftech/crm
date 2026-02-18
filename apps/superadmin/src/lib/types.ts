export interface Workspace {
  id: number;
  name: string;
  user_id: string;
  disabled: boolean;
  created_at: string;
  /** Resolved from auth when listing (optional). */
  owner_email?: string | null;
  /** Leads count when listing (optional). */
  leads_count?: number;
}
