"use client";

import { useSearchParams } from "next/navigation";
import { useId, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronRight,
  ClipboardList,
  Lock,
  MapPin,
  Plus,
  Search,
  StickyNote,
  X,
} from "lucide-react";
import { CATEGORIES, getCategoryLabel } from "@/lib/categories";
import { DEMO_COMPANY, DEMO_EMPLOYEES, DEMO_JOBS } from "@/lib/demo-data";
import { addDemoJob, newDemoId, useDemoJobs } from "@/lib/demo-store";
import { formatDay } from "@/lib/format";
import { validateJob } from "@/lib/job-schema";
import {
  JOB_STATUSES,
  JOB_STATUS_LABELS,
  type CompanyJob,
  type JobStatus,
} from "@/lib/types";
import { JobStatusBadge } from "@/components/status-badge";
import { Button, Card, DemoTag, EmptyState, PageHeader } from "@/components/ui";

type Filter = JobStatus | "offen" | "alle";

export function JobsView() {
  const params = useSearchParams();
  const own = useDemoJobs();
  const jobs = useMemo(() => [...own, ...DEMO_JOBS], [own]);
  const [filter, setFilter] = useState<Filter>("offen");
  const [query, setQuery] = useState("");
  const [assignee, setAssignee] = useState("");
  const [formOpen, setFormOpen] = useState(params.get("neu") === "1");

  const counts = useMemo(() => {
    const c: Record<string, number> = { alle: jobs.length, offen: 0 };
    for (const s of JOB_STATUSES) c[s] = 0;
    for (const j of jobs) {
      c[j.status]++;
      if (
        j.status === "neu" ||
        j.status === "geplant" ||
        j.status === "in_arbeit"
      )
        c.offen++;
    }
    return c;
  }, [jobs]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return jobs
      .filter((j) =>
        filter === "alle"
          ? true
          : filter === "offen"
            ? ["neu", "geplant", "in_arbeit"].includes(j.status)
            : j.status === filter,
      )
      .filter(
        (j) =>
          !assignee ||
          (assignee === "-"
            ? j.assigneeIds.length === 0
            : j.assigneeIds.includes(assignee)),
      )
      .filter(
        (j) =>
          !q ||
          [
            j.title,
            j.customerName,
            j.location,
            getCategoryLabel(j.categoryId),
          ].some((s) => s.toLowerCase().includes(q)),
      )
      .sort((a, b) =>
        (a.scheduledDate ?? "9999").localeCompare(b.scheduledDate ?? "9999"),
      );
  }, [jobs, filter, query, assignee]);

  const filters: { id: Filter; label: string }[] = [
    { id: "offen", label: "Offen" },
    ...JOB_STATUSES.map((s) => ({
      id: s as Filter,
      label: JOB_STATUS_LABELS[s],
    })),
    { id: "alle", label: "Alle" },
  ];

  return (
    <>
      <PageHeader
        title="Eigene Aufträge"
        description="Ihre internen Aufträge – nur für Ihr Team sichtbar, niemals automatisch im Marktplatz."
        action={
          <Button
            onClick={() => setFormOpen(true)}
            className="w-full sm:w-auto"
          >
            <Plus className="size-4" aria-hidden="true" /> Auftrag anlegen
          </Button>
        }
      />

      {formOpen && <NewJobForm onClose={() => setFormOpen(false)} />}

      <div className="mb-4 space-y-3">
        <div
          className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0"
          role="group"
          aria-label="Nach Status filtern"
        >
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              aria-pressed={filter === f.id}
              className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                filter === f.id
                  ? "border-brand-700 bg-brand-700 text-white"
                  : "border-line bg-surface hover:border-brand-500"
              }`}
            >
              {f.label}
              <span
                className={`text-xs ${filter === f.id ? "text-white/75" : "text-muted"}`}
              >
                {counts[f.id]}
              </span>
            </button>
          ))}
        </div>
        <div className="grid gap-2 sm:grid-cols-[1fr_14rem]">
          <label className="relative block">
            <span className="sr-only">Aufträge durchsuchen</span>
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Titel, Kunde, Ort …"
              className="h-11 w-full rounded-xl border border-line bg-surface pr-3 pl-9 outline-none focus:border-brand-500"
            />
          </label>
          <label className="block">
            <span className="sr-only">Nach Mitarbeiter filtern</span>
            <select
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              className="h-11 w-full rounded-xl border border-line bg-surface px-3 outline-none focus:border-brand-500"
            >
              <option value="">Alle Mitarbeiter</option>
              <option value="-">Nicht zugewiesen</option>
              {DEMO_EMPLOYEES.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="size-6" />}
          title="Keine Aufträge gefunden"
          text="Ändern Sie die Filter oder legen Sie einen neuen Auftrag an."
          action={
            <Button
              variant="secondary"
              onClick={() => {
                setFilter("alle");
                setQuery("");
                setAssignee("");
              }}
            >
              Filter zurücksetzen
            </Button>
          }
        />
      ) : (
        <ul className="space-y-2">
          {visible.map((j) => (
            <li key={j.id}>
              <JobRow job={j} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function JobRow({ job: j }: { job: CompanyJob }) {
  const [open, setOpen] = useState(false);
  const people = j.assigneeIds
    .map((id) => DEMO_EMPLOYEES.find((e) => e.id === id))
    .filter(Boolean);
  const panelId = `job-${j.id}`;
  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={panelId}
        className="grid w-full grid-cols-[1fr_auto] items-center gap-3 p-4 text-left hover:bg-canvas/60 md:grid-cols-[10.5rem_1fr_11rem_7rem_auto]"
      >
        <div className="order-2 text-sm md:order-none">
          {j.scheduledDate ? (
            <span className="flex items-center gap-1.5 font-medium whitespace-nowrap">
              <CalendarDays className="size-4 text-muted" aria-hidden="true" />
              {formatDay(j.scheduledDate)}
              <span className="font-mono text-muted">{j.scheduledTime}</span>
            </span>
          ) : (
            <span className="text-muted">Ohne Termin</span>
          )}
        </div>
        <div className="col-span-2 min-w-0 md:col-span-1">
          <p className="truncate font-semibold">{j.title}</p>
          <p className="truncate text-sm text-muted">
            {j.customerName} · {getCategoryLabel(j.categoryId)}
          </p>
        </div>
        <p className="hidden items-center gap-1 truncate text-sm text-muted md:flex">
          <MapPin className="size-3.5 shrink-0" aria-hidden="true" />{" "}
          {j.location}
        </p>
        <div className="order-3 flex items-center justify-end gap-2 md:order-none md:justify-start">
          <JobStatusBadge status={j.status} />
        </div>
        <div className="hidden items-center gap-2 md:flex">
          <div className="flex -space-x-2">
            {people.length === 0 ? (
              <span className="text-xs text-muted">–</span>
            ) : (
              people.map((p) => (
                <span
                  key={p!.id}
                  title={p!.name}
                  className="flex size-8 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700 ring-2 ring-surface"
                >
                  {p!.initials}
                </span>
              ))
            )}
          </div>
          <ChevronRight
            className={`size-5 text-muted transition ${open ? "rotate-90" : ""}`}
            aria-hidden="true"
          />
        </div>
      </button>
      {open && (
        <div
          id={panelId}
          className="grid gap-4 border-t border-line bg-canvas/40 p-4 text-sm sm:grid-cols-3"
        >
          <div>
            <p className="text-xs font-semibold text-muted uppercase">Ort</p>
            <p className="mt-1">{j.location}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted uppercase">
              Zugewiesen
            </p>
            <p className="mt-1">
              {people.length
                ? people.map((p) => p!.name).join(", ")
                : "Noch niemand"}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted uppercase">
              Herkunft
            </p>
            <p className="mt-1 flex items-center gap-1.5">
              <Lock className="size-3.5" aria-hidden="true" /> Interner Auftrag{" "}
              <DemoTag />
            </p>
          </div>
          <div className="sm:col-span-3">
            <p className="text-xs font-semibold text-muted uppercase">
              Notizen
            </p>
            {j.notes.length === 0 ? (
              <p className="mt-1 text-muted">Keine Notizen.</p>
            ) : (
              <ul className="mt-1 space-y-1.5">
                {j.notes.map((n, i) => (
                  <li
                    key={i}
                    className="flex gap-2 rounded-lg bg-surface px-3 py-2 ring-1 ring-line"
                  >
                    <StickyNote
                      className="mt-0.5 size-4 shrink-0 text-accent-500"
                      aria-hidden="true"
                    />{" "}
                    {n}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

/* ---------- Neuer Auftrag ---------- */

function NewJobForm({ onClose }: { onClose: () => void }) {
  const id = useId();
  const tradeIds = DEMO_COMPANY.trades;
  const [v, setV] = useState({
    title: "",
    customerName: "",
    location: "",
    categoryId: tradeIds[0],
    scheduledDate: "",
    scheduledTime: "",
    assigneeIds: [] as string[],
    note: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (k: keyof typeof v, val: string | string[]) =>
    setV((s) => ({ ...s, [k]: val }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const r = validateJob(v);
    if (!r.success) {
      setErrors(r.errors);
      return;
    }
    addDemoJob({
      id: newDemoId("auftrag"),
      isDemo: true,
      title: r.data.title,
      customerName: r.data.customerName,
      location: r.data.location,
      categoryId: r.data.categoryId,
      status: r.data.scheduledDate ? "geplant" : "neu",
      scheduledDate: r.data.scheduledDate,
      scheduledTime: r.data.scheduledTime,
      assigneeIds: r.data.assigneeIds,
      notes: r.data.note ? [r.data.note] : [],
      createdAt: new Date().toISOString().slice(0, 10),
    });
    onClose();
  }

  const input = (k: string) =>
    `h-11 w-full rounded-xl border bg-surface px-3 outline-none focus:border-brand-500 ${errors[k] ? "border-rose-400" : "border-line"}`;
  const err = (k: string) =>
    errors[k] ? (
      <p id={`${id}-${k}-err`} className="mt-1 text-sm text-rose-700">
        {errors[k]}
      </p>
    ) : null;
  const a11y = (k: string) => ({
    id: `${id}-${k}`,
    "aria-invalid": !!errors[k],
    "aria-describedby": errors[k] ? `${id}-${k}-err` : undefined,
  });

  return (
    <Card className="mb-6 border-brand-500 p-4 shadow-lg shadow-brand-900/5 sm:p-6">
      <form onSubmit={submit} noValidate aria-labelledby={`${id}-heading`}>
        <div className="mb-4 flex items-center justify-between">
          <h2 id={`${id}-heading`} className="text-lg font-semibold">
            Neuer interner Auftrag
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted hover:bg-canvas"
            aria-label="Schließen"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label
              htmlFor={`${id}-title`}
              className="mb-1 block text-sm font-semibold"
            >
              Titel *
            </label>
            <input
              {...a11y("title")}
              value={v.title}
              onChange={(e) => set("title", e.target.value)}
              className={input("title")}
            />
            {err("title")}
          </div>
          <div>
            <label
              htmlFor={`${id}-customerName`}
              className="mb-1 block text-sm font-semibold"
            >
              Kunde *
            </label>
            <input
              {...a11y("customerName")}
              value={v.customerName}
              onChange={(e) => set("customerName", e.target.value)}
              className={input("customerName")}
            />
            {err("customerName")}
          </div>
          <div>
            <label
              htmlFor={`${id}-location`}
              className="mb-1 block text-sm font-semibold"
            >
              Ort *
            </label>
            <input
              {...a11y("location")}
              value={v.location}
              onChange={(e) => set("location", e.target.value)}
              placeholder="PLZ Ort"
              className={input("location")}
            />
            {err("location")}
          </div>
          <div>
            <label
              htmlFor={`${id}-categoryId`}
              className="mb-1 block text-sm font-semibold"
            >
              Gewerk
            </label>
            <select
              {...a11y("categoryId")}
              value={v.categoryId}
              onChange={(e) => set("categoryId", e.target.value)}
              className={input("categoryId")}
            >
              {CATEGORIES.filter((c) => tradeIds.includes(c.id)).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-[1fr_7rem] gap-2">
            <div>
              <label
                htmlFor={`${id}-scheduledDate`}
                className="mb-1 block text-sm font-semibold"
              >
                Datum
              </label>
              <input
                {...a11y("scheduledDate")}
                type="date"
                value={v.scheduledDate}
                onChange={(e) => set("scheduledDate", e.target.value)}
                className={input("scheduledDate")}
              />
            </div>
            <div>
              <label
                htmlFor={`${id}-scheduledTime`}
                className="mb-1 block text-sm font-semibold"
              >
                Uhrzeit
              </label>
              <input
                {...a11y("scheduledTime")}
                type="time"
                value={v.scheduledTime}
                onChange={(e) => set("scheduledTime", e.target.value)}
                className={input("scheduledTime")}
              />
            </div>
            <div className="col-span-2">
              {err("scheduledDate")}
              {err("scheduledTime")}
            </div>
          </div>
          <fieldset className="sm:col-span-2">
            <legend className="mb-1 text-sm font-semibold">Zuweisen</legend>
            <div className="flex flex-wrap gap-2">
              {DEMO_EMPLOYEES.map((emp) => {
                const on = v.assigneeIds.includes(emp.id);
                return (
                  <label
                    key={emp.id}
                    className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-brand-500 ${
                      on
                        ? "border-brand-500 bg-brand-50 text-brand-700"
                        : "border-line bg-surface"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={on}
                      onChange={() =>
                        set(
                          "assigneeIds",
                          on
                            ? v.assigneeIds.filter((x) => x !== emp.id)
                            : [...v.assigneeIds, emp.id],
                        )
                      }
                    />
                    {emp.name}
                  </label>
                );
              })}
            </div>
          </fieldset>
          <div className="sm:col-span-2">
            <label
              htmlFor={`${id}-note`}
              className="mb-1 block text-sm font-semibold"
            >
              Notiz (optional)
            </label>
            <textarea
              {...a11y("note")}
              rows={2}
              value={v.note}
              onChange={(e) => set("note", e.target.value)}
              className="w-full rounded-xl border border-line bg-surface px-3 py-2 outline-none focus:border-brand-500"
            />
            {err("note")}
          </div>
        </div>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>
            Abbrechen
          </Button>
          <Button type="submit">Auftrag speichern</Button>
        </div>
        <p className="mt-3 text-xs text-muted">
          Demo: Wird nur in diesem Browser gespeichert.
        </p>
      </form>
    </Card>
  );
}
