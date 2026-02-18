-- leads: scoped by workspace; workspace_id must match auth.jwt().user_metadata.workspace_id (RLS)
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  workspace_id bigint not null references public.workspaces (id) on delete cascade,
  name text not null,
  company text,
  channel text,
  status text not null default 'new',
  owner text,
  email text not null,
  phone text not null,
  whatsapp text,
  subject text,
  message text,
  deal_value numeric(14, 2),
  disabled boolean not null default false,
  created_at timestamptz not null default now()
);

create index leads_workspace_id_idx on public.leads (workspace_id);
create index leads_status_idx on public.leads (status);
create index leads_owner_idx on public.leads (owner);
create index leads_disabled_idx on public.leads (disabled);

-- RLS: workspace_id must match auth.jwt().user_metadata.workspace_id
alter table public.leads enable row level security;

create policy "Users can access leads in their workspace"
  on public.leads
  for all
  using (
    workspace_id = (auth.jwt()->'user_metadata'->>'workspace_id')::bigint
  )
  with check (
    workspace_id = (auth.jwt()->'user_metadata'->>'workspace_id')::bigint
  );
