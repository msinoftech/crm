# Supabase schema (Module 4)

## Tables

### 1. `public.workspaces`

| Column     | Type        | Description                    |
|-----------|-------------|--------------------------------|
| id        | bigint (PK) | Auto-generated; matches `user_metadata.workspace_id` |
| name      | text        | Workspace name                 |
| user_id   | uuid        | `auth.users.id` (owner)        |
| disabled  | boolean     | Default `false`; set `true` to deactivate (soft delete) |
| created_at| timestamptz | Default `now()`                |

**RLS (Module 9):**
- **Own workspaces:** `user_id = auth.uid()` (workspace owners).
- **Superadmin:** `(auth.jwt()->'user_metadata'->>'role') = 'superadmin'` (all rows).

### 2. `public.leads`

| Column       | Type          | Description                    |
|-------------|---------------|--------------------------------|
| id          | uuid (PK)     | Default `gen_random_uuid()`   |
| workspace_id | bigint (FK)   | References `workspaces.id`    |
| name        | text          | Lead name                      |
| company     | text          | Company name                   |
| channel     | text          | Lead source / channel         |
| status      | text          | Default `'new'`                |
| owner       | text          | Lead owner                     |
| email       | text          | Lead email                     |
| phone       | text          | Phone number                   |
| whatsapp    | text          | WhatsApp number                |
| subject     | text          | Subject                        |
| message     | text          | Message / notes                |
| deal_value  | numeric(14,2) | Deal value (currency)          |
| disabled    | boolean       | Default `false`; set `true` to deactivate (soft delete) |
| created_at  | timestamptz   | Default `now()`               |

**RLS (Module 9 – workspace tables):** Access only when  
`workspace_id = (auth.jwt()->'user_metadata'->>'workspace_id')::bigint`.  
So `auth.users.user_metadata.workspace_id` must equal the lead’s `workspace_id` (and match a `workspaces.id`).

## RLS policies (Module 9)

Two patterns:

1. **Workspace tables** (e.g. `leads`): allow access only when  
   `workspace_id = (auth.jwt()->'user_metadata'->>'workspace_id')::bigint`.  
   Use the same `using` and `with check` for any future workspace-scoped table.

2. **Superadmin-only:** allow access only when  
   `(auth.jwt()->'user_metadata'->>'role') = 'superadmin'`.  
   Applied on `workspaces` so superadmin can manage all rows (in addition to owners). For a table that only superadmin should see, use this as the only policy.

## Applying migrations

**Option A – Supabase Dashboard**

1. Open your project → **SQL Editor**.
2. Run the contents of each file in order:
   - `migrations/20250130000000_create_workspaces.sql`
   - `migrations/20250130000001_create_leads.sql`
   - `migrations/20250130000002_rls_policies_module9.sql`

**Option B – Supabase CLI**

From the repo root (with [Supabase CLI](https://supabase.com/docs/guides/cli) installed and linked):

```bash
supabase db push
```

Or run migrations manually with `supabase db execute -f supabase/migrations/...`.

## Consistency with auth

- Ensure each workspace user has `user_metadata.workspace_id` set to a valid `workspaces.id` (e.g. when inviting or creating workspaces).
- Creating a workspace should set `workspaces.id` (or use `returning id`) and then update the user’s `user_metadata.workspace_id` and refresh the session so the JWT and RLS stay in sync.
