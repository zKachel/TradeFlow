import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarDays,
  ClipboardList,
  Inbox,
  MapPin,
  Plus,
  ShieldAlert,
  Users,
} from "lucide-react";
import { getCategoryLabel } from "@/lib/categories";
import {
  DEMO_COMPANY,
  DEMO_EMPLOYEES,
  DEMO_JOBS,
  DEMO_LEADS,
  DEMO_TODAY,
} from "@/lib/demo-data";
import { formatDay, formatLongDay } from "@/lib/format";
import { JobStatusBadge, UrgencyBadge } from "@/components/status-badge";
import { Card, DemoTag, LinkButton } from "@/components/ui";
import { Kpi, SectionHead } from "@/components/dashboard";

export const metadata: Metadata = { title: "Firmen-Übersicht" };

export default function CompanyOverviewPage() {
  const open = DEMO_JOBS.filter(
    (j) =>
      j.status === "neu" || j.status === "geplant" || j.status === "in_arbeit",
  );
  const today = DEMO_JOBS.filter(
    (j) => j.scheduledDate === DEMO_TODAY && j.status !== "storniert",
  ).sort((a, b) =>
    (a.scheduledTime ?? "").localeCompare(b.scheduledTime ?? ""),
  );
  const upcoming = DEMO_JOBS.filter(
    (j) =>
      j.scheduledDate &&
      j.scheduledDate > DEMO_TODAY &&
      j.status !== "storniert",
  ).sort((a, b) =>
    `${a.scheduledDate}${a.scheduledTime}`.localeCompare(
      `${b.scheduledDate}${b.scheduledTime}`,
    ),
  );
  const unassigned = DEMO_JOBS.filter(
    (j) => j.assigneeIds.length === 0 && j.status === "neu",
  );
  const nameOf = (id: string) =>
    DEMO_EMPLOYEES.find((e) => e.id === id)?.name ?? "–";

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted">
            {formatLongDay(DEMO_TODAY)}{" "}
            <span className="text-xs">(Demo-Datum)</span>
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            {DEMO_COMPANY.name}
          </h1>
        </div>
        <LinkButton
          href="/demo/betrieb/auftraege?neu=1"
          className="w-full sm:w-auto"
        >
          <Plus className="size-4" aria-hidden="true" /> Auftrag anlegen
        </LinkButton>
      </div>

      <div className="mb-6 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <ShieldAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
        <p>
          <strong>Profil unverifiziert.</strong> Ihr Betrieb wird Auftraggebern
          ohne Prüfabzeichen angezeigt. Der Prüfprozess wird nach dem MVP
          festgelegt.
        </p>
      </div>

      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi
          href="/demo/betrieb/auftraege"
          icon={<ClipboardList className="size-5" />}
          label="Offene Aufträge"
          value={open.length}
        />
        <Kpi
          href="/demo/betrieb/auftraege"
          icon={<CalendarDays className="size-5" />}
          label="Termine heute"
          value={today.length}
        />
        <Kpi
          href="/demo/betrieb/marktplatz"
          icon={<Inbox className="size-5" />}
          label="Passende Anfragen"
          value={DEMO_LEADS.length}
          market
        />
        <Kpi
          href="/demo/betrieb/team"
          icon={<Users className="size-5" />}
          label="Team"
          value={DEMO_EMPLOYEES.length}
        />
      </ul>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section aria-labelledby="heute">
          <SectionHead
            id="heute"
            title="Heute"
            href="/demo/betrieb/auftraege"
          />
          <Card className="divide-y divide-line">
            {today.length === 0 && (
              <p className="p-5 text-sm text-muted">
                Heute sind keine Termine geplant.
              </p>
            )}
            {today.map((j) => (
              <div key={j.id} className="flex gap-4 p-4">
                <div className="w-14 shrink-0 text-center">
                  <p className="font-mono text-lg font-semibold">
                    {j.scheduledTime}
                  </p>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <JobStatusBadge status={j.status} />
                    <span className="text-xs text-muted">
                      {getCategoryLabel(j.categoryId)}
                    </span>
                  </div>
                  <p className="mt-1 font-semibold">{j.title}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-sm text-muted">
                    <MapPin className="size-3.5" aria-hidden="true" />{" "}
                    {j.location} · {j.assigneeIds.map(nameOf).join(", ")}
                  </p>
                </div>
              </div>
            ))}
          </Card>

          <SectionHead id="woche" title="Nächste Termine" className="mt-6" />
          <Card className="divide-y divide-line">
            {upcoming.map((j) => (
              <div
                key={j.id}
                className="flex items-center gap-4 px-4 py-3 text-sm"
              >
                <span className="w-24 shrink-0 font-medium">
                  {formatDay(j.scheduledDate!)}
                </span>
                <span className="w-12 shrink-0 font-mono text-muted">
                  {j.scheduledTime}
                </span>
                <span className="min-w-0 flex-1 truncate">{j.title}</span>
              </div>
            ))}
          </Card>
        </section>

        <div className="space-y-6">
          <section aria-labelledby="todo">
            <SectionHead id="todo" title="Noch nicht zugewiesen" />
            <Card className="divide-y divide-line">
              {unassigned.length === 0 && (
                <p className="p-4 text-sm text-muted">
                  Alle Aufträge sind zugewiesen.
                </p>
              )}
              {unassigned.map((j) => (
                <Link
                  key={j.id}
                  href="/demo/betrieb/auftraege"
                  className="block p-4 hover:bg-canvas"
                >
                  <p className="font-medium">{j.title}</p>
                  <p className="text-sm text-muted">{j.customerName}</p>
                </Link>
              ))}
            </Card>
          </section>

          <section aria-labelledby="markt">
            <SectionHead
              id="markt"
              title="Neu im Marktplatz"
              href="/demo/betrieb/marktplatz"
              market
            />
            <Card className="divide-y divide-line border-accent-500/30">
              {DEMO_LEADS.slice(0, 3).map((l) => (
                <Link
                  key={l.id}
                  href="/demo/betrieb/marktplatz"
                  className="block p-4 hover:bg-accent-50/50"
                >
                  <div className="flex items-center gap-2">
                    <UrgencyBadge urgency={l.urgency} />
                    <DemoTag />
                  </div>
                  <p className="mt-1.5 font-medium">{l.title}</p>
                  <p className="text-sm text-muted">
                    {l.postalCode} {l.city} · ca. {l.distanceKm} km
                  </p>
                </Link>
              ))}
            </Card>
          </section>
        </div>
      </div>
    </>
  );
}
