import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser, homePathFor } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/** Leitet angemeldete Nutzer in ihren Bereich weiter, alle anderen zur Anmeldung. */
export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  if (!isSupabaseConfigured())
    return NextResponse.redirect(new URL("/anmelden", origin));
  const user = await getCurrentUser();
  return NextResponse.redirect(
    new URL(user ? homePathFor(user.accountType) : "/anmelden", origin),
  );
}
