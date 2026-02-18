import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getCurrentUser, getRole } from "@crm/shared/auth";

const COOKIE_NAME = "superadmin_workspace_id";
const MAX_AGE = 60 * 60 * 24;

export async function GET(request: NextRequest) {
  const workspaceIdParam = request.nextUrl.searchParams.get("workspace_id");
  const workspaceId =
    workspaceIdParam != null ? parseInt(workspaceIdParam, 10) : NaN;
  if (!Number.isInteger(workspaceId) || workspaceId < 1) {
    return NextResponse.json(
      { error: "Invalid workspace_id" },
      { status: 400 }
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return NextResponse.json({ error: "Misconfigured" }, { status: 500 });
  }

  const response = NextResponse.json({ ok: true });
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: object }[]) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const user = await getCurrentUser(supabase);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (getRole(user) !== "superadmin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  response.cookies.set(COOKIE_NAME, String(workspaceId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });
  return response;
}
