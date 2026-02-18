# Access validation – test matrix (Module 10)

All role × app combinations are validated by:

1. **Proxy** (route guard) – redirects to `/login` when no session or wrong role.
2. **Login page** – after sign-in, checks `canAccessApp(role, app)`; if false, signs out and shows “You don’t have access to this app.”

## Matrix

| Role            | Superadmin app (port 3001) | Workspace app (port 3002) |
|-----------------|----------------------------|----------------------------|
| **superadmin**  | ✓ Access                   | ✗ Redirect to /login; on login: reject + sign out |
| **workspace_admin** | ✗ Redirect to /login; on login: reject + sign out | ✓ Access |
| **customer**    | ✗ Redirect to /login; on login: reject + sign out | ✓ Access |
| **No session**  | → /login                   | → /login                   |

## Automated tests

Unit tests in `apps/shared/src/auth/access.test.ts` assert:

- `canAccessApp("superadmin", "superadmin")` → true
- `canAccessApp("superadmin", "workspace")` → false
- `canAccessApp("workspace_admin", "superadmin")` → false
- `canAccessApp("workspace_admin", "workspace")` → true
- `canAccessApp("customer", "superadmin")` → false
- `canAccessApp("customer", "workspace")` → true
- Allowed roles per app: superadmin app = `["superadmin"]`, workspace app = `["workspace_admin", "customer"]`

Run: `yarn test` (from repo root).

## Manual test checklist

1. **Superadmin → superadmin app:** Log in as superadmin at :3001/login → can access / and /workspaces.
2. **Superadmin → workspace app:** Open :3002 while logged in as superadmin (same Supabase session) → redirected to :3002/login; if you “sign in” again, rejected with “You don’t have access to this app. Workspace users only.”
3. **Workspace admin → workspace app:** Log in as workspace_admin at :3002/login → can access / and /leads.
4. **Workspace admin → superadmin app:** Open :3001 while logged in as workspace_admin → redirected to :3001/login; sign in rejected with “You don’t have access to this app. Superadmin only.”
5. **Customer → workspace app:** Log in as customer at :3002/login → can access / and /leads.
6. **Customer → superadmin app:** Open :3001 while logged in as customer → redirected to :3001/login; sign in rejected.
7. **No session:** Visit :3001 or :3002 (any protected route) → redirected to /login.
