import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseEnv } from "./env";

/**
 * Supabase-Client für Server Components, Server Actions und Route Handler.
 * Arbeitet immer mit der Sitzung des angemeldeten Nutzers → RLS greift.
 */
export async function createClient() {
  const env = getSupabaseEnv();
  if (!env)
    throw new Error(
      "Supabase ist nicht konfiguriert (siehe docs/SUPABASE_SETUP.md).",
    );
  const cookieStore = await cookies();
  return createServerClient(env.url, env.key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // In Server Components dürfen keine Cookies gesetzt werden.
          // Das Auffrischen der Sitzung übernimmt src/proxy.ts.
        }
      },
    },
  });
}
