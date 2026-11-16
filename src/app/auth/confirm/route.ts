import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { safeNext } from "@/lib/safe-next";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/**
 * Ziel der Links aus Bestätigungs- und Passwort-E-Mails.
 * Unterstützt beide Varianten:
 *  - token_hash + type (empfohlene E-Mail-Vorlage, funktioniert geräteübergreifend)
 *  - code (Supabase-Standardvorlage, PKCE – nur im selben Browser)
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const next = safeNext(searchParams.get("next"), "/");
  const fail = NextResponse.redirect(new URL("/anmelden?fehler=link", origin));
  if (!isSupabaseConfigured()) return fail;

  const supabase = await createClient();
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");

  let ok = false;
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    ok = !error;
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
  }
  if (!ok) return fail;

  if (type === "recovery")
    return NextResponse.redirect(new URL("/passwort-neu", origin));
  // /konto leitet je nach Kontoart weiter (Betriebe ohne Firma → Einrichtung).
  return NextResponse.redirect(new URL(next === "/" ? "/konto" : next, origin));
}
