# CRM Monorepo

Next.js monorepo with **superadmin** and **workspace** apps sharing UI, hooks, auth, and utils.

## Structure

```
crm/
├── apps/
│   ├── superadmin/     # Next.js app (port 3001)
│   ├── workspace/      # Next.js app (port 3002)
│   └── shared/         # @crm/shared – ui, hooks, auth, utils
├── supabase/
│   ├── migrations/     # DB schema (workspaces, leads) + RLS
│   └── README.md       # Schema docs
├── package.json       # Root workspaces
├── tsconfig.base.json # Shared TypeScript config
└── README.md
```

- **Same Next.js version** for both apps (16.0.3), defined in each app’s `package.json`.
- **Shared build config**: `tsconfig.base.json`; each app extends it and adds path aliases for `@crm/shared`.
- **Independent routing**: Each app has its own `src/app/` (App Router) and runs on its own port.
- **Supabase Auth**: Single Supabase project for both apps; roles and `workspace_id` in `auth.users.user_metadata` (`superadmin` | `workspace_admin` | `customer`).

## Setup

```bash
yarn install
```

Create `.env.local` at the **repo root** (copy from `.env.example`) and set:

- `NEXT_PUBLIC_SUPABASE_URL` – Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` – Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` – Server-only; used by Superadmin app for workspace/user admin (do not expose to client)

Root scripts (`yarn dev:superadmin`, `yarn build`, etc.) load `.env.local` from the root via `dotenv-cli`, so both apps use the same env.

Store role and workspace in `auth.users.user_metadata`, e.g. `{ "role": "workspace_admin", "workspace_id": 1 }`.

**Database:** Apply migrations in `supabase/migrations/` (see `supabase/README.md`). Core tables: `workspaces` (id, name, user_id, created_at), `leads` (id, workspace_id, name, email, status). RLS on `leads` requires `workspace_id = auth.jwt().user_metadata.workspace_id`.

**First superadmin user:** Create one so you can log into the Superadmin app and then create workspaces and workspace admin users. From repo root (with `.env.local` set):

```bash
yarn create-superadmin your@email.com YourSecurePassword
```

Then log in at http://localhost:3001/login. Alternatively, create the user in Supabase Dashboard (Authentication → Users → Add user) and set **User Metadata** to `{ "role": "superadmin" }`.

## Scripts

| Command | Description |
|--------|--------------|
| `yarn create-superadmin <email> <password>` | One-time: create first superadmin user |
| `yarn dev:superadmin` | Run superadmin on http://localhost:3001 |
| `yarn dev:workspace`  | Run workspace on http://localhost:3002 |
| `yarn build:superadmin` | Build superadmin |
| `yarn build:workspace`  | Build workspace |
| `yarn build` | Build all apps |
| `yarn lint` | Lint all workspaces |
| `yarn test` | Run access validation tests |

## Using shared code

From either app:

```ts
import { Button } from "@crm/shared/ui";
import { useMediaQuery, useLocalStorage } from "@crm/shared/hooks";
import { useAuth } from "@crm/shared/hooks";
import { getCurrentUser, getRole, getWorkspaceId } from "@crm/shared/auth";
import { cn, formatDate } from "@crm/shared/utils";
```

**Shared auth hook** – in `@crm/shared/hooks` (for route guards and UI authorization):

- `useAuth()` – returns `{ user, role, workspace_id, loading, signOut }`. Use for client-side guards and conditional UI (e.g. show by role). Must be used within `AuthProvider` (from `@crm/shared/auth`).

**Auth (Supabase)** – in `@crm/shared/auth`:

- `getCurrentUser(client)` – current user (with `role`, `workspace_id` from `user_metadata`)
- `getRole(user)` – `user_metadata.role`
- `getWorkspaceId(user)` – `user_metadata.workspace_id`
- `isRoleAllowed(role, allowedRoles)` – for route guards
- `useAuth()` – also available from `@crm/shared/hooks` with `{ user, role, workspace_id, loading, signOut }`

Path aliases in each app’s `tsconfig.json` point to `../shared/src`, so you edit shared code with full type support.

## Superadmin – Workspace & user creation (Module 5)

In the **Superadmin** app (`/workspaces`):

- **List workspaces** – table of all workspaces (id, name, owner, disabled, created_at).
- **Create workspace** – insert into `workspaces` (initial owner = current superadmin until an admin user is created).
- **Create workspace admin user** – create user in Supabase Auth with `user_metadata: { role: "workspace_admin", workspace_id }`, then set that user as the workspace owner.
- **Delete workspace** – hard delete (cascades to leads).

Only **superadmin** can perform these actions (enforced in Server Actions). No frontend registration; only superadmin creates users. Uses `SUPABASE_SERVICE_ROLE_KEY` server-side for Auth Admin API and bypassing RLS.

## Login – both apps (Module 6)

- **No signup from frontend** – only sign-in forms; users are created by superadmin (Module 5).
- **Email/password only** – both apps use Supabase `signInWithPassword` on `/login`.
- **After login:** role is checked; if allowed for this app → redirect to `/`. If not allowed → sign out and show “You don’t have access to this app.”
- **Cross-app access blocked:** Proxy (Module 3) redirects wrong-role users to `/login`; the login page itself rejects users whose role is not allowed for that app (superadmin app: `superadmin` only; workspace app: `workspace_admin` or `customer`), signs them out, and shows an error.

## Role-based route guards (Proxy)

Next.js 16 **Proxy** (in each app’s `src/proxy.ts`) protects routes using shared auth:

| App          | Allowed roles                    | Unauthorized →      |
|-------------|-----------------------------------|---------------------|
| **Superadmin** | `superadmin` only                 | redirect to `/login` |
| **Workspace**  | `workspace_admin` or `customer`   | redirect to `/login` |

- No session or wrong role → redirect to `/login`.
- Logged-in user with allowed role on `/login` → redirect to `/`.
- Uses `@supabase/ssr` `createServerClient` (cookies) and shared `getCurrentUser`, `getRole`, `isRoleAllowed`.

## Workspace app – Leads module (Module 8)

In the **Workspace** app (`/leads`):

- **List leads** – workspace-scoped via RLS (only rows where `workspace_id` matches `auth.jwt().user_metadata.workspace_id`).
- **Create lead** – insert with `workspace_id` from `useAuth().workspace_id`.
- **Update lead** – edit modal; update by `id` (RLS ensures same workspace).
- **Delete lead** – delete by `id` (RLS ensures same workspace).

**Rules:** Uses **supabaseClient only** (anon key from `useAuth().client`); no service role or Server Actions for leads. **workspace_id** is enforced by RLS. **No superadmin access** – workspace app proxy allows only `workspace_admin` or `customer`; superadmin cannot reach `/leads`.

Auth context now exposes **client** so components can call `client.from('leads').select()`, `.insert()`, `.update()`, `.delete()` with RLS applied.

## RLS policies (Module 9)

Two RLS patterns (see `supabase/migrations/20250130000002_rls_policies_module9.sql` and `supabase/README.md`):

1. **Workspace tables** (e.g. `leads`): allow access only when  
   `workspace_id = auth.jwt().user_metadata.workspace_id` (cast to bigint in SQL).
2. **Superadmin-only:** allow access only when  
   `auth.jwt().user_metadata.role = 'superadmin'`.  
   Applied on `workspaces` so superadmin can manage all rows (in addition to owners). For tables that only superadmin should see, use this as the only policy.

## Final access validation (Module 10)

Single source of truth in `@crm/shared/auth`: **SUPERADMIN_APP_ROLES**, **WORKSPACE_APP_ROLES**, **canAccessApp(role, app)**. Proxy and login pages use these for validation.

| Role            | Superadmin app | Workspace app |
|-----------------|----------------|---------------|
| **superadmin**  | ✓              | ✗ (redirect to login) |
| **workspace_admin** | ✗ (redirect to login) | ✓ |
| **customer**    | ✗ (redirect to login) | ✓ |
| **No session**  | → /login       | → /login      |

- **Superadmin cannot access workspace app** – proxy + login reject.
- **Workspace admin cannot access superadmin app** – proxy + login reject.
- **Customer can access workspace app only** – proxy allows; superadmin app rejects.
- **Invalid users are redirected to login** – proxy redirects; login page signs out wrong-role and shows error.

**Tests:** `yarn test` runs `@crm/shared` Vitest suite (e.g. `src/auth/access.test.ts`) for all role × app combinations.

## Role-based expansion

- **Roles**: `superadmin` | `workspace_admin` | `customer` in `user_metadata.role`.
- **New apps**: Add another app under `apps/`, add `src/proxy.ts` with role checks, depend on `@crm/shared`, and extend `AppRole` as needed.
