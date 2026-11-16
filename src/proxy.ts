import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "@/lib/supabase/env";

/**
 * Läuft vor jeder Seite:
 * 1. frischt die Supabase-Sitzung auf (Cookies),
 * 2. leitet nicht angemeldete Besucher von geschützten Bereichen zur Anmeldung.
 * Die eigentliche Rechteprüfung passiert serverseitig in den Layouts und per RLS in der Datenbank.
 */
const PROTECTED = [
  "/kunde",
  "/betrieb",
  "/betrieb-einrichten",
  "/passwort-neu",
];

export async function proxy(request: NextRequest) {
  const env = getSupabaseEnv();
  if (!env) return NextResponse.next({ request });

  let response = NextResponse.next({ request });
  const supabase = createServerClient(env.url, env.key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        Object.entries(headers ?? {}).forEach(([k, v]) =>
          response.headers.set(k, v),
        );
      },
    },
  });

  // Wichtig: getClaims() prüft das Token (Signatur/Ablauf) und frischt es bei Bedarf auf.
  const { data } = await supabase.auth.getClaims();
  const isLoggedIn = Boolean(data?.claims?.sub);

  const path = request.nextUrl.pathname;
  const needsLogin = PROTECTED.some(
    (p) => path === p || path.startsWith(p + "/"),
  );
  if (needsLogin && !isLoggedIn) {
    const url = request.nextUrl.clone();
    url.pathname = "/anmelden";
    url.search = "";
    url.searchParams.set("weiter", path + request.nextUrl.search);
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  }

  return response;
}

export const config = {
  matcher: [
    // Alles außer statischen Dateien, Bildern, Icons, Manifest und Service Worker
    "/((?!_next/static|_next/image|icons/|sw.js|manifest.webmanifest|icon|apple-icon|favicon|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)",
  ],
};
