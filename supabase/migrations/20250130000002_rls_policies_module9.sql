-- MODULE 9: RLS policies
--
-- Two patterns:
-- 1. Workspace tables: allow only when workspace_id = auth.jwt().user_metadata.workspace_id
-- 2. Superadmin-only: allow only when auth.jwt().user_metadata.role = 'superadmin'

-- ---------------------------------------------------------------------------
-- 1. Workspace-scoped tables (e.g. leads)
-- Leads already has: "Users can access leads in their workspace"
--   using (workspace_id = (auth.jwt()->'user_metadata'->>'workspace_id')::bigint)
-- For any future workspace table, use the same pattern:
--   using (workspace_id = (auth.jwt()->'user_metadata'->>'workspace_id')::bigint)
--   with check (workspace_id = (auth.jwt()->'user_metadata'->>'workspace_id')::bigint)
-- No change needed for leads.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 2. Superadmin-only access on workspaces
-- Allow role = superadmin to select/insert/update/delete all rows (for anon
-- client; service role already bypasses RLS).
-- Workspace owners keep "Users can manage own workspaces" (user_id = auth.uid()).
-- ---------------------------------------------------------------------------
create policy "Superadmin can manage all workspaces"
  on public.workspaces
  for all
  using ((auth.jwt()->'user_metadata'->>'role') = 'superadmin')
  with check ((auth.jwt()->'user_metadata'->>'role') = 'superadmin');

-- ---------------------------------------------------------------------------
-- For future superadmin-only tables (no workspace, no owner; only superadmin):
--   alter table public.<table> enable row level security;
--   create policy "Superadmin only" on public.<table>
--     for all
--     using ((auth.jwt()->'user_metadata'->>'role') = 'superadmin')
--     with check ((auth.jwt()->'user_metadata'->>'role') = 'superadmin');
-- ---------------------------------------------------------------------------
