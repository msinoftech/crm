-- lead_notes: notes per lead, scoped by workspace_id (same RLS as leads)
create table public.lead_notes (
  id uuid primary key default gen_random_uuid(),
  workspace_id bigint not null references public.workspaces (id) on delete cascade,
  lead_id uuid not null references public.leads (id) on delete cascade,
  message text not null,
  created_at timestamptz not null default now(),
  created_by uuid
);

create index lead_notes_workspace_id_idx on public.lead_notes (workspace_id);
create index lead_notes_lead_id_idx on public.lead_notes (lead_id);
create index lead_notes_created_at_idx on public.lead_notes (lead_id, created_at desc);

-- RLS: same as leads - workspace_id must match auth.jwt().user_metadata.workspace_id
alter table public.lead_notes enable row level security;

create policy "Users can access lead_notes in their workspace"
  on public.lead_notes
  for all
  using (
    workspace_id = (auth.jwt()->'user_metadata'->>'workspace_id')::bigint
  )
  with check (
    workspace_id = (auth.jwt()->'user_metadata'->>'workspace_id')::bigint
  );
