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
import { Kpi, SectionHead } from "@/components/dashboard";
import { JobStatusBadge } from "@/components/status-badge";
import { Card, LinkButton } from "@/components/ui";
import { getMyCompany } from "@/lib/auth";
import { getCategoryLabel } from "@/lib/categories";
import { shortTime, todayInBerlin } from "@/lib/dates";
import type { CompanyJobRow } from "@/lib/db-types";
import { formatDay, formatLongDay } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Firmen-Übersicht" };

const COLUMNS =
  "id, title, customer_name, location, category_id, status, scheduled_date, scheduled_time, created_at, updated_at, company_id";

export default async function CompanyOverviewPage() {
  const company = await getMyCompany();
  if (!company) return null; // Layout leitet bereits weiter
  const supabase = await createClient();
  const today = todayInBerlin();
  const cid = company.companyId;

  const [openCount, todayJobs, upcoming, unscheduled, team] = await Promise.all(
    [
      supabase
        .from("company_jobs")
        .select("id", { count: "exact", head: true })
        .eq("company_id", cid)
        .in("status", ["neu", "geplant", "in_arbeit"]),
      supabase
        .from("company_jobs")
        .select(COLUMNS)
        .eq("company_id", cid)
        .eq("scheduled_date", today)
        .neq("status", "storniert")
        .order("scheduled_time", { nullsFirst: true }),
      supabase
        .from("company_jobs")
        .select(COLUMNS)
        .eq("company_id", cid)
        .gt("scheduled_date", today)
        .in("status", ["neu", "geplant", "in_arbeit"])
        .order("scheduled_date")
        .order("scheduled_time", { nullsFirst: true })
        .limit(6),
      supabase
        .from("company_jobs")
        .select(COLUMNS)
        .eq("company_id", cid)
        .eq("status", "neu")
        .is("scheduled_date", null)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("company_memberships")
        .select("user_id", { count: "exact", head: true })
        .eq("company_id", cid),
    ],
  );

  const todayRows = (todayJobs.data ?? []) as CompanyJobRow[];
  const upcomingRows = (upcoming.data ?? []) as CompanyJobRow[];
  const unscheduledRows = (unscheduled.data ?? []) as CompanyJobRow[];
  const loadError = [openCount, todayJobs, upcoming, unscheduled].some(
    (r) => r.error,
  );

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted">
            {formatLongDay(today)}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            {company.companyName}
          </h1>
        </div>
        <LinkButton
          href="/betrieb/auftraege?neu=1"
          className="w-full sm:w-auto"
        >
          <Plus className="size-4" aria-hidden="true" /> Auftrag anlegen
        </LinkButton>
      </div>

      {loadError && (
        <div
          role="alert"
          className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900"
        >
          Einige Daten konnten nicht geladen werden. Bitte Seite neu laden.
        </div>
      )}

      {company.verification === "unverifiziert" && (
        <div className="mb-6 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <ShieldAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <p>
            <strong>Profil unverifiziert.</strong> Der Prüfprozess für Betriebe
            wird vor dem Pilotstart festgelegt.
          </p>
        </div>
      )}

      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi
          href="/betrieb/auftraege"
          icon={<ClipboardList className="size-5" />}
          label="Offene Aufträge"
          value={openCount.count ?? 0}
        />
        <Kpi
          href="/betrieb/auftraege"
          icon={<CalendarDays className="size-5" />}
          label="Termine heute"
          value={todayRows.length}
        />
        <Kpi
          href="/betrieb/marktplatz"
          icon={<Inbox className="size-5" />}
          label="Passende Anfragen"
          value={0}
          market
        />
        <Kpi
          href="/betrieb/team"
          icon={<Users className="size-5" />}
          label="Team"
          value={team.count ?? 1}
        />
      </ul>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section aria-labelledby="heute">
          <SectionHead id="heute" title="Heute" href="/betrieb/auftraege" />
          <Card className="divide-y divide-line">
            {todayRows.length === 0 && (
              <p className="p-5 text-sm text-muted">
                Heute sind keine Termine geplant.{" "}
                <Link
                  href="/betrieb/auftraege?neu=1"
                  className="font-semibold text-brand-700 hover:underline"
                >
                  Auftrag anlegen
                </Link>
              </p>
            )}
            {todayRows.map((j) => (
              <div key={j.id} className="flex gap-4 p-4">
                <p className="w-14 shrink-0 text-center font-mono text-lg font-semibold">
                  {shortTime(j.scheduled_time) || "–"}
                </p>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <JobStatusBadge status={j.status} />
                    <span className="text-xs text-muted">
                      {getCategoryLabel(j.category_id)}
                    </span>
                  </div>
                  <p className="mt-1 font-semibold">{j.title}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-sm text-muted">
                    <MapPin className="size-3.5" aria-hidden="true" />{" "}
                    {j.location} · {j.customer_name}
                  </p>
                </div>
              </div>
            ))}
          </Card>

          <SectionHead id="woche" title="Nächste Termine" className="mt-6" />
          <Card className="divide-y divide-line">
            {upcomingRows.length === 0 && (
              <p className="p-4 text-sm text-muted">
                Keine weiteren Termine geplant.
              </p>
            )}
            {upcomingRows.map((j) => (
              <div
                key={j.id}
                className="flex items-center gap-4 px-4 py-3 text-sm"
              >
                <span className="w-24 shrink-0 font-medium">
                  {formatDay(j.scheduled_date!)}
                </span>
                <span className="w-12 shrink-0 font-mono text-muted">
                  {shortTime(j.scheduled_time)}
                </span>
                <span className="min-w-0 flex-1 truncate">{j.title}</span>
              </div>
            ))}
          </Card>
        </section>

        <div className="space-y-6">
          <section aria-labelledby="todo">
            <SectionHead id="todo" title="Neu, noch ohne Termin" />
            <Card className="divide-y divide-line">
              {unscheduledRows.length === 0 && (
                <p className="p-4 text-sm text-muted">Alles eingeplant.</p>
              )}
              {unscheduledRows.map((j) => (
                <Link
                  key={j.id}
                  href="/betrieb/auftraege"
                  className="block p-4 hover:bg-canvas"
                >
                  <p className="font-medium">{j.title}</p>
                  <p className="text-sm text-muted">{j.customer_name}</p>
                </Link>
              ))}
            </Card>
          </section>

          <section aria-labelledby="markt">
            <SectionHead
              id="markt"
              title="Marktplatz"
              href="/betrieb/marktplatz"
              market
            />
            <Card className="p-4 text-sm text-muted">
              Passende Kundenanfragen werden in der Pilotphase freigeschaltet.
              Bis dahin organisieren Sie hier Ihre eigenen Aufträge.
            </Card>
          </section>
        </div>
      </div>
    </>
  );
}
