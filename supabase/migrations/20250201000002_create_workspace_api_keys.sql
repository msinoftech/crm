-- workspace_api_keys: API keys per workspace for public lead creation
-- key_hash = SHA-256 of raw key; key_prefix = first 8 chars for display
create table public.workspace_api_keys (
  id uuid primary key default gen_random_uuid(),
  workspace_id bigint not null references public.workspaces (id) on delete cascade,
  name text,
  key_hash text not null,
  key_prefix text not null,
  allowed_origins text[] not null default '{}',
  created_at timestamptz not null default now()
);

create unique index workspace_api_keys_key_hash_idx on public.workspace_api_keys (key_hash);
create index workspace_api_keys_workspace_id_idx on public.workspace_api_keys (workspace_id);

alter table public.workspace_api_keys enable row level security;

-- Workspace users can manage API keys for their workspace only
create policy "Users can manage API keys in their workspace"
  on public.workspace_api_keys
  for all
  using (
    workspace_id = (auth.jwt()->'user_metadata'->>'workspace_id')::bigint
  )
  with check (
    workspace_id = (auth.jwt()->'user_metadata'->>'workspace_id')::bigint
  );
