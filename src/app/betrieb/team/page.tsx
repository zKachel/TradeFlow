import type { Metadata } from "next";
import { TeamView, type TeamMember } from "@/components/team-view";
import { getCurrentUser, getMyCompany } from "@/lib/auth";
import type { CompanyRole } from "@/lib/db-types";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Team" };

export default async function TeamPage() {
  const [company, me] = await Promise.all([getMyCompany(), getCurrentUser()]);
  if (!company) return null;
  const supabase = await createClient();
  const [memberships, profiles] = await Promise.all([
    supabase
      .from("company_memberships")
      .select("user_id, role")
      .eq("company_id", company.companyId),
    supabase.from("profiles").select("id, display_name"),
  ]);
  const names = new Map(
    (profiles.data ?? []).map((p) => [
      p.id as string,
      p.display_name as string,
    ]),
  );
  const order: CompanyRole[] = ["inhaber", "buero", "mitarbeiter"];
  const members: TeamMember[] = (memberships.data ?? [])
    .map((m) => ({
      id: m.user_id as string,
      name: names.get(m.user_id as string) ?? "Unbekannt",
      role: m.role as CompanyRole,
      isMe: m.user_id === me?.id,
    }))
    .sort((a, b) => order.indexOf(a.role) - order.indexOf(b.role));
  return (
    <TeamView
      members={members}
      inviteHint="Mitarbeiter einladen kommt in Sprint 3."
    />
  );
}
