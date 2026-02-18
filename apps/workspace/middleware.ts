import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getCurrentUser, getRole, canAccessApp } from "@crm/shared/auth";

const LOGIN_PATH = "/login";
const PUBLIC_API_PREFIX = "/api/public";
const AUTH_ENTER_PATH = "/auth/enter";

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((c) => to.cookies.set(c.name, c.value));
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (request.nextUrl.pathname.startsWith(PUBLIC_API_PREFIX)) return response;
  if (request.nextUrl.pathname === AUTH_ENTER_PATH) return response;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return response;

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

  await supabase.auth.getClaims();

  const user = await getCurrentUser(supabase);
  const isLoginPage = request.nextUrl.pathname === LOGIN_PATH;

  if (!user) {
    if (isLoginPage) return response;
    const redirect = NextResponse.redirect(new URL(LOGIN_PATH, request.url));
    copyCookies(response, redirect);
    return redirect;
  }

  const role = getRole(user);
  if (!canAccessApp(role, "workspace")) {
    if (isLoginPage) return response;
    const redirect = NextResponse.redirect(new URL(LOGIN_PATH, request.url));
    copyCookies(response, redirect);
    return redirect;
  }

  if (role === "superadmin") {
    if (request.nextUrl.pathname === "/api/auth/set-superadmin-workspace")
      return response;
    const wid = request.cookies.get("superadmin_workspace_id")?.value;
    const widNum = wid != null ? parseInt(wid, 10) : NaN;
    if (!Number.isInteger(widNum) || widNum < 1) {
      if (isLoginPage) return response;
      const loginUrl = new URL(LOGIN_PATH, request.url);
      loginUrl.searchParams.set("error", "superadmin_no_workspace");
      const redirect = NextResponse.redirect(loginUrl);
      copyCookies(response, redirect);
      return redirect;
    }
    if (isLoginPage) {
      const redirect = NextResponse.redirect(new URL("/", request.url));
      copyCookies(response, redirect);
      return redirect;
    }
    return response;
  }

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("disabled")
    .eq("user_id", user.id)
    .single();
  if (workspace?.disabled) {
    if (isLoginPage) return response;
    const loginUrl = new URL(LOGIN_PATH, request.url);
    loginUrl.searchParams.set("error", "deactivated");
    const redirect = NextResponse.redirect(loginUrl);
    copyCookies(response, redirect);
    return redirect;
  }

  if (isLoginPage) {
    const redirect = NextResponse.redirect(new URL("/", request.url));
    copyCookies(response, redirect);
    return redirect;
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/public|auth/enter|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
