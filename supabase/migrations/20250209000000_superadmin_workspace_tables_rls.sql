-- Allow superadmin to access workspace-scoped tables (leads, lead_activities, lead_notes, workspace_api_keys).
-- The workspace app filters by workspace_id from cookie for superadmin, so RLS only needs to allow access.

create policy "Superadmin can access all leads"
  on public.leads
  for all
  using ((auth.jwt()->'user_metadata'->>'role') = 'superadmin')
  with check ((auth.jwt()->'user_metadata'->>'role') = 'superadmin');

create policy "Superadmin can access all lead_activities"
  on public.lead_activities
  for all
  using ((auth.jwt()->'user_metadata'->>'role') = 'superadmin')
  with check ((auth.jwt()->'user_metadata'->>'role') = 'superadmin');

create policy "Superadmin can access all lead_notes"
  on public.lead_notes
  for all
  using ((auth.jwt()->'user_metadata'->>'role') = 'superadmin')
  with check ((auth.jwt()->'user_metadata'->>'role') = 'superadmin');

create policy "Superadmin can access all workspace_api_keys"
  on public.workspace_api_keys
  for all
  using ((auth.jwt()->'user_metadata'->>'role') = 'superadmin')
  with check ((auth.jwt()->'user_metadata'->>'role') = 'superadmin');
