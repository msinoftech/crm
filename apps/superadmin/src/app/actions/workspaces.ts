"use server";

import { getCurrentUser, getRole } from "@crm/shared/auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import {
  sendWorkspaceCreatedEmail,
  sendWorkspaceDisabledEmail,
  sendWorkspaceEnabledEmail,
} from "@/lib/email";
import type { Workspace } from "@/lib/types";
import { getWorkspaceUrl } from "@/lib/env";

const SUPERADMIN_ONLY = "Only superadmin can perform this action.";

async function requireSuperadmin() {
  const client = await createSupabaseServerClient();
  const user = await getCurrentUser(client);
  if (!user) throw new Error("Unauthorized");
  if (getRole(user) !== "superadmin") throw new Error(SUPERADMIN_ONLY);
  return user;
}

/** Dashboard counts (superadmin only): total workspaces and total leads. */
export async function getDashboardCounts(): Promise<{
  workspacesCount: number;
  leadsCount: number;
}> {
  await requireSuperadmin();
  const admin = createSupabaseAdminClient();
  const [workspacesRes, leadsRes] = await Promise.all([
    admin.from("workspaces").select("*", { count: "exact", head: true }),
    admin.from("leads").select("*", { count: "exact", head: true }),
  ]);
  return {
    workspacesCount: workspacesRes.count ?? 0,
    leadsCount: leadsRes.count ?? 0,
  };
}

/** List all workspaces (superadmin only). Resolves owner email from auth. */
export async function listWorkspaces(): Promise<Workspace[]> {
  await requireSuperadmin();
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("workspaces")
    .select("id, name, user_id, disabled, created_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as Workspace[];
  const withEmailsAndCounts = await Promise.all(
    rows.map(async (w) => {
      let owner_email: string | null = null;
      if (w.user_id?.trim()) {
        const { data: userData } = await admin.auth.admin.getUserById(w.user_id);
        owner_email = userData?.user?.email ?? null;
      }
      const { count } = await admin
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("workspace_id", w.id);
      const leads_count = count ?? 0;
      return { ...w, owner_email, leads_count };
    })
  );
  return withEmailsAndCounts;
}

/** Create a workspace (superadmin only). Uses current user as initial owner until workspace admin is created. */
export async function createWorkspace(name: string): Promise<Workspace> {
  const user = await requireSuperadmin();
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("workspaces")
    .insert({ name, user_id: user.id })
    .select("id, name, user_id, disabled, created_at")
    .single();
  if (error) throw new Error(error.message);
  return data as Workspace;
}

/** Create a workspace admin user in Supabase Auth and assign them as workspace owner (superadmin only). */
export async function createWorkspaceAdminUser(
  workspaceId: number,
  email: string,
  password: string
): Promise<void> {
  await requireSuperadmin();
  const admin = createSupabaseAdminClient();

  const { data: newUser, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      role: "workspace_admin",
      workspace_id: workspaceId,
    },
  });
  if (createError) throw new Error(createError.message);
  if (!newUser.user) throw new Error("User creation failed");

  const { error: updateError } = await admin
    .from("workspaces")
    .update({ user_id: newUser.user.id })
    .eq("id", workspaceId);
  if (updateError) throw new Error(updateError.message);
}

/** Set workspace disabled flag (superadmin only). Disabled workspace admins cannot log in to the workspace app. Sends email to workspace admin. */
export async function updateWorkspaceDisabled(
  workspaceId: number,
  disabled: boolean
): Promise<void> {
  await requireSuperadmin();
  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("workspaces")
    .update({ disabled })
    .eq("id", workspaceId);
  if (error) throw new Error(error.message);
  const { data: workspace } = await admin
    .from("workspaces")
    .select("name, user_id")
    .eq("id", workspaceId)
    .single();
  if (workspace?.user_id) {
    const { data: userData } = await admin.auth.admin.getUserById(
      workspace.user_id as string
    );
    const ownerEmail = userData?.user?.email;
    if (ownerEmail && workspace.name) {
      if (disabled) {
        await sendWorkspaceDisabledEmail(ownerEmail, workspace.name as string);
      } else {
        await sendWorkspaceEnabledEmail(ownerEmail, workspace.name as string);
      }
    }
  }
}

/** Notify workspace admin by email when a new workspace is created (superadmin only). No-op if SMTP not configured. */
export async function notifyWorkspaceCreated(
  workspaceName: string,
  adminEmail: string
): Promise<void> {
  await requireSuperadmin();
  await sendWorkspaceCreatedEmail(adminEmail, workspaceName);
}

/** Delete a workspace by id (superadmin only). Cascades to leads. */
export async function deleteWorkspace(workspaceId: number): Promise<void> {
  await requireSuperadmin();
  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("workspaces").delete().eq("id", workspaceId);
  if (error) throw new Error(error.message);
}

/** Get magic link to open workspace app as superadmin in the given workspace (superadmin only). */
export async function getWorkspaceLoginLink(
  workspaceId: number
): Promise<{ url: string }> {
  const workspaceUrl = getWorkspaceUrl();
  if (!workspaceUrl) {
    throw new Error(
      "Missing WORKSPACE_APP_URL or NEXT_PUBLIC_WORKSPACE_APP_URL in environment"
    );
  }
  const user = await requireSuperadmin();
  const admin = createSupabaseAdminClient();
  const redirectTo = `${workspaceUrl}/auth/enter?workspace_id=${workspaceId}`;
  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: user.email,
    options: { redirectTo },
  });
  if (error) throw new Error(error.message);
  const link =
    (data as { properties?: { action_link?: string } })?.properties
      ?.action_link;
  if (!link) throw new Error("Failed to generate link");
  return { url: link };
}
