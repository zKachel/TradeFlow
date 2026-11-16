import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { AccountType } from "@/lib/db-types";
export { safeNext } from "@/lib/safe-next";

export interface CurrentUser {
  id: string;
  email: string;
  accountType: AccountType;
  displayName: string;
}

/** Liest den angemeldeten Nutzer (Token geprüft) und sein Profil aus der Datenbank. */
export const getCurrentUser = cache(
  async function getCurrentUser(): Promise<CurrentUser | null> {
    if (!isSupabaseConfigured()) return null;
    const supabase = await createClient();
    const { data: claimsData } = await supabase.auth.getClaims();
    const sub = claimsData?.claims?.sub;
    if (!sub) return null;
    const { data: profile } = await supabase
      .from("profiles")
      .select("account_type, display_name")
      .eq("id", sub)
      .maybeSingle();
    if (!profile) return null;
    return {
      id: sub,
      email: (claimsData.claims.email as string | undefined) ?? "",
      accountType: profile.account_type as AccountType,
      displayName: profile.display_name as string,
    };
  },
);

export function homePathFor(type: AccountType) {
  return type === "betrieb" ? "/betrieb" : "/kunde";
}

/** Erzwingt eine Anmeldung mit passendem Kontotyp – sonst Weiterleitung. */
export async function requireUser(type?: AccountType): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/anmelden");
  if (type && user.accountType !== type)
    redirect(homePathFor(user.accountType));
  return user;
}

export interface CompanyContext {
  companyId: string;
  companyName: string;
  role: "inhaber" | "buero" | "mitarbeiter";
  verification: string;
}

/** Firma des angemeldeten Betriebsnutzers (oder null, falls noch keine angelegt). */
export const getMyCompany = cache(
  async function getMyCompany(): Promise<CompanyContext | null> {
    if (!isSupabaseConfigured()) return null;
    const supabase = await createClient();
    const { data: claimsData } = await supabase.auth.getClaims();
    const sub = claimsData?.claims?.sub;
    if (!sub) return null;
    const { data } = await supabase
      .from("company_memberships")
      .select("role, companies(id, name, verification_status)")
      .eq("user_id", sub)
      .limit(1)
      .maybeSingle();
    const company = data?.companies as unknown as {
      id: string;
      name: string;
      verification_status: string;
    } | null;
    if (!data || !company) return null;
    return {
      companyId: company.id,
      companyName: company.name,
      role: data.role as CompanyContext["role"],
      verification: company.verification_status,
    };
  },
);
