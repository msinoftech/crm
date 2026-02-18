import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import {
  validateEmail,
  validatePhone,
  validateWhatsApp,
} from "@/lib/leadValidation";
import type { LeadInsert } from "@/lib/types";
import { LEAD_STATUS_VALUES } from "@/lib/constants";

function corsResponse(origin: string | null) {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key",
    "Access-Control-Max-Age": "86400",
  };
  if (origin) headers["Access-Control-Allow-Origin"] = origin;
  return headers;
}

const API_KEY_HEADER = "x-api-key";
const AUTH_HEADER = "authorization";

function getApiKeyFromRequest(request: Request): string | null {
  const apiKey = request.headers.get(API_KEY_HEADER)?.trim();
  if (apiKey) return apiKey;
  const auth = request.headers.get(AUTH_HEADER);
  if (auth?.toLowerCase().startsWith("bearer ")) {
    return auth.slice(7).trim();
  }
  return null;
}

/** Get caller origin: Origin header, then Referer origin, then request URL origin (hostname from the URL used to call this API). */
function getOriginFromRequest(request: Request): string {
  const origin = request.headers.get("origin")?.trim();
  if (origin) return origin;
  const referer = request.headers.get("referer")?.trim();
  if (referer) {
    try {
      const u = new URL(referer);
      return u.origin;
    } catch {
      // fall through to request URL
    }
  }
  try {
    const u = new URL(request.url);
    return u.origin;
  } catch {
    return "";
  }
}

function normalizeOrigin(url: string): string {
  const u = url.trim().toLowerCase();
  return u.endsWith("/") ? u.slice(0, -1) : u;
}

function hashApiKey(raw: string): string {
  return createHash("sha256").update(raw, "utf8").digest("hex");
}

const ALLOWED_CHANNELS = ["email", "phone", "whatsapp", "website"] as const;

const WORKSPACE_DEACTIVATED_MESSAGE =
  "Your account is deactivated, please contact administrator.";

export interface PublicLeadBody {
  name: string;
  email: string;
  phone: string;
  status: string;
  company?: string;
  channel?: string;
  owner?: string;
  whatsapp?: string;
  subject?: string;
  message?: string;
  deal_value?: number;
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get("origin");
  return new NextResponse(null, {
    status: 204,
    headers: corsResponse(origin),
  });
}

export async function POST(request: Request) {
  const requestOrigin = request.headers.get("origin");
  const addCors = (res: NextResponse) => {
    if (requestOrigin) {
      res.headers.set("Access-Control-Allow-Origin", requestOrigin);
    }
    return res;
  };

  try {
    const apiKey = getApiKeyFromRequest(request);
    if (!apiKey) {
      return addCors(
        NextResponse.json(
          { error: "Missing API key. Use X-API-Key header or Authorization: Bearer <key>." },
          { status: 401 }
        )
      );
    }

    const origin = getOriginFromRequest(request);
    if (!origin) {
      return addCors(
        NextResponse.json(
          { error: "Could not determine request origin." },
          { status: 400 }
        )
      );
    }

    const admin = createSupabaseAdminClient();
    const keyHash = hashApiKey(apiKey);
    const { data: keyRow, error: keyError } = await admin
      .from("workspace_api_keys")
      .select("workspace_id, allowed_origins")
      .eq("key_hash", keyHash)
      .single();

    if (keyError || !keyRow) {
      return addCors(
        NextResponse.json(
          { error: "Invalid API key." },
          { status: 401 }
        )
      );
    }

    const allowedOrigins = (keyRow.allowed_origins as string[]) ?? [];
    const normalizedRequestOrigin = normalizeOrigin(origin);
    const allowed = allowedOrigins.some(
      (o) => normalizeOrigin(o) === normalizedRequestOrigin
    );
    if (!allowed) {
      return addCors(
        NextResponse.json(
          { error: "You are not allowed to use this API from this website. Add this origin to the API key's allowed websites in Settings." },
          { status: 403 }
        )
      );
    }

    const workspace_id = keyRow.workspace_id as number;

    const { data: workspace } = await admin
      .from("workspaces")
      .select("disabled")
      .eq("id", workspace_id)
      .single();
    if (workspace?.disabled) {
      return addCors(
        NextResponse.json(
          { error: WORKSPACE_DEACTIVATED_MESSAGE },
          { status: 403 }
        )
      );
    }

    let body: PublicLeadBody;
    try {
      body = (await request.json()) as PublicLeadBody;
    } catch {
      return addCors(
        NextResponse.json(
          { error: "Invalid JSON body." },
          { status: 400 }
        )
      );
    }

    const name = (body.name ?? "").trim();
    const email = (body.email ?? "").trim();
    const phone = (body.phone ?? "").trim();
    if (!name) {
      return addCors(
        NextResponse.json(
          { error: "name is required." },
          { status: 400 }
        )
      );
    }
    const emailErr = validateEmail(email);
    if (emailErr) {
      return addCors(NextResponse.json({ error: emailErr }, { status: 400 }));
    }
    const phoneErr = validatePhone(phone);
    if (phoneErr) {
      return addCors(NextResponse.json({ error: phoneErr }, { status: 400 }));
    }
    const whatsappErr = validateWhatsApp(body.whatsapp ?? "");
    if (whatsappErr) {
      return addCors(NextResponse.json({ error: whatsappErr }, { status: 400 }));
    }

    const channelVal = (body.channel ?? "").trim();
    if (channelVal && !ALLOWED_CHANNELS.includes(channelVal as (typeof ALLOWED_CHANNELS)[number])) {
      return addCors(
        NextResponse.json(
          {
            error: `Invalid channel. Allowed values: ${ALLOWED_CHANNELS.join(", ")}.`,
            options: [...ALLOWED_CHANNELS],
          },
          { status: 400 }
        )
      );
    }

    const statusVal = (body.status ?? "").trim();
    if (!statusVal) {
      return addCors(
        NextResponse.json(
          { error: "status is required." },
          { status: 400 }
        )
      );
    }
    if (!LEAD_STATUS_VALUES.includes(statusVal as (typeof LEAD_STATUS_VALUES)[number])) {
      return addCors(
        NextResponse.json(
          {
            error: `Invalid status. Allowed values: ${LEAD_STATUS_VALUES.join(", ")}.`,
            options: [...LEAD_STATUS_VALUES],
          },
          { status: 400 }
        )
      );
    }

    const row: LeadInsert = {
      workspace_id,
      name,
      email,
      phone,
      company: (body.company ?? "").trim() || null,
      channel: channelVal || null,
      status: statusVal,
      owner: (body.owner ?? "").trim() || null,
      whatsapp: (body.whatsapp ?? "").trim() || null,
      subject: (body.subject ?? "").trim() || null,
      message: (body.message ?? "").trim() || null,
      deal_value: body.deal_value ?? null,
      disabled: false,
    };

    const { data: inserted, error: insertError } = await admin
      .from("leads")
      .insert(row)
      .select("id")
      .single();

    if (insertError) {
      console.error("[public/leads] insert error:", insertError);
      return addCors(
        NextResponse.json(
          { error: insertError.message },
          { status: 500 }
        )
      );
    }

    if (inserted?.id) {
      await admin.from("lead_activities").insert({
        workspace_id,
        lead_id: inserted.id,
        type: "created",
        description: "Lead created via API",
        metadata: { source: "api", origin: normalizedRequestOrigin },
        created_by: null,
      });
    }

    return addCors(
      NextResponse.json(
        { id: inserted.id },
        { status: 201 }
      )
    );
  } catch (err) {
    console.error("[public/leads]", err);
    return addCors(
      NextResponse.json(
        { error: err instanceof Error ? err.message : "Internal server error" },
        { status: 500 }
      )
    );
  }
}
