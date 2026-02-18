-- lead_activities: activity log per lead, scoped by workspace_id (same RLS as leads)
create table public.lead_activities (
  id uuid primary key default gen_random_uuid(),
  workspace_id bigint not null references public.workspaces (id) on delete cascade,
  lead_id uuid not null references public.leads (id) on delete cascade,
  type text not null,
  description text,
  metadata jsonb,
  created_at timestamptz not null default now(),
  created_by uuid
);

create index lead_activities_workspace_id_idx on public.lead_activities (workspace_id);
create index lead_activities_lead_id_idx on public.lead_activities (lead_id);
create index lead_activities_created_at_idx on public.lead_activities (lead_id, created_at desc);

-- RLS: same as leads - workspace_id must match auth.jwt().user_metadata.workspace_id
alter table public.lead_activities enable row level security;

create policy "Users can access lead_activities in their workspace"
  on public.lead_activities
  for all
  using (
    workspace_id = (auth.jwt()->'user_metadata'->>'workspace_id')::bigint
  )
  with check (
    workspace_id = (auth.jwt()->'user_metadata'->>'workspace_id')::bigint
  );
