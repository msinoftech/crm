import {
  createServerClient,
  type CookieMethodsServer,
  type CookieOptionsWithName,
} from "@supabase/ssr";
import type { SupabaseClientOptions } from "@supabase/supabase-js";
import { cookies } from "next/headers";

type ServerClientOptions = SupabaseClientOptions<"public"> & {
  cookies: CookieMethodsServer;
  cookieOptions?: CookieOptionsWithName;
  cookieEncoding?: "raw" | "base64url";
};

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) throw new Error("Missing Supabase env for server client");
  const opts: ServerClientOptions = {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Ignore if called from Server Component read context
        }
      },
    },
  };
  return createServerClient(url, anonKey, opts);
}
