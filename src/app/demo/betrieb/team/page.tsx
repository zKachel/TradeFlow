import type { Metadata } from "next";
import { TeamView } from "@/components/team-view";
import { DEMO_EMPLOYEES, DEMO_JOBS } from "@/lib/demo-data";

export const metadata: Metadata = { title: "Team" };

export default function DemoTeamPage() {
  const members = DEMO_EMPLOYEES.map((e) => ({
    id: e.id,
    name: e.name,
    role: e.role,
    isDemo: true,
    openJobs: DEMO_JOBS.filter(
      (j) =>
        j.assigneeIds.includes(e.id) &&
        j.status !== "erledigt" &&
        j.status !== "storniert",
    ).length,
  }));
  return (
    <TeamView members={members} inviteHint="Einladungen kommen in Sprint 3." />
  );
}
