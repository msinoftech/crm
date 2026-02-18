import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getCurrentUser, getRole, canAccessApp } from "@crm/shared/auth";

const LOGIN_PATH = "/login";

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((c) => to.cookies.set(c.name, c.value));
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

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
  if (!canAccessApp(role, "superadmin")) {
    if (isLoginPage) return response;
    const redirect = NextResponse.redirect(new URL(LOGIN_PATH, request.url));
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
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};