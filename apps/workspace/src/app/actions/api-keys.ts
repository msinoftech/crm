"use server";

import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import type { WorkspaceApiKey } from "@/lib/types";
import { getCurrentUser, getRole } from "@crm/shared/auth";
import { createHash, randomBytes } from "node:crypto";

const SUPERADMIN_WORKSPACE_COOKIE = "superadmin_workspace_id";

const API_KEY_PREFIX = "gst_";
const API_KEY_RAW_LENGTH = 32;

function generateApiKey(): string {
  const bytes = randomBytes(API_KEY_RAW_LENGTH);
  return API_KEY_PREFIX + bytes.toString("hex");
}

function hashApiKey(raw: string): string {
  return createHash("sha256").update(raw, "utf8").digest("hex");
}

function normalizeOrigin(url: string): string {
  const u = url.trim().toLowerCase();
  return u.endsWith("/") ? u.slice(0, -1) : u;
}

async function requireWorkspaceId(): Promise<number> {
  const client = await createSupabaseServerClient();
  const user = await getCurrentUser(client);
  if (!user) throw new Error("Unauthorized");
  if (getRole(user) === "superadmin") {
    const cookieStore = await cookies();
    const wid = cookieStore.get(SUPERADMIN_WORKSPACE_COOKIE)?.value;
    const n = wid != null ? parseInt(wid, 10) : NaN;
    if (!Number.isInteger(n) || n < 1) throw new Error("Workspace not found");
    return n;
  }
  const wid = user.workspace_id;
  if (wid == null) throw new Error("Workspace not found");
  return wid;
}

/** List API keys for the current workspace (masked). */
export async function listWorkspaceApiKeys(): Promise<WorkspaceApiKey[]> {
  const workspace_id = await requireWorkspaceId();
  const client = await createSupabaseServerClient();
  const { data, error } = await client
    .from("workspace_api_keys")
    .select("id, workspace_id, name, key_hash, key_prefix, allowed_origins, created_at")
    .eq("workspace_id", workspace_id)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as WorkspaceApiKey[];
}

export interface CreateApiKeyInput {
  name?: string;
  allowed_origins: string[];
}

/** Create a new API key. Returns { key: rawKey } once – caller must show/copy it. */
export async function createWorkspaceApiKey(
  input: CreateApiKeyInput
): Promise<{ key: string }> {
  const workspace_id = await requireWorkspaceId();
  const origins = (input.allowed_origins ?? [])
    .map(normalizeOrigin)
    .filter(Boolean);
  if (origins.length === 0) {
    throw new Error("At least one allowed website is required.");
  }
  const rawKey = generateApiKey();
  const key_hash = hashApiKey(rawKey);
  const key_prefix = rawKey.slice(0, 8);

  const client = await createSupabaseServerClient();
  const { error } = await client.from("workspace_api_keys").insert({
    workspace_id,
    name: input.name?.trim() || null,
    key_hash,
    key_prefix,
    allowed_origins: origins,
  });
  if (error) throw new Error(error.message);
  return { key: rawKey };
}

/** Revoke (delete) an API key. */
export async function revokeWorkspaceApiKey(id: string): Promise<void> {
  await requireWorkspaceId();
  const client = await createSupabaseServerClient();
  const { error } = await client.from("workspace_api_keys").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/** Update allowed origins for an API key. */
export async function updateWorkspaceApiKeyOrigins(
  id: string,
  allowed_origins: string[]
): Promise<void> {
  await requireWorkspaceId();
  const origins = allowed_origins.map(normalizeOrigin).filter(Boolean);
  const client = await createSupabaseServerClient();
  const { error } = await client
    .from("workspace_api_keys")
    .update({ allowed_origins: origins })
    .eq("id", id);
  if (error) throw new Error(error.message);
}
