"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useMemo, useState, useTransition } from "react";
import {
  CalendarDays,
  ChevronRight,
  ClipboardList,
  History,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Search,
  StickyNote,
  X,
} from "lucide-react";
import {
  addJobNoteAction,
  createJobAction,
  getJobDetailsAction,
  setJobStatusAction,
  updateJobAction,
  type JobDetails,
  type JobFormInput,
} from "../actions";
import { FieldError, FormAlert } from "@/components/form";
import { JobStatusBadge } from "@/components/status-badge";
import { Button, Card, EmptyState, PageHeader } from "@/components/ui";
import { CATEGORIES, getCategoryLabel } from "@/lib/categories";
import { jobUpdateSchema, zodErrors } from "@/lib/company-schema";
import { shortTime } from "@/lib/dates";
import type { CompanyJobRow } from "@/lib/db-types";
import { formatDay } from "@/lib/format";
import { validateJob } from "@/lib/job-schema";
import { safeCall } from "@/lib/request-submission";
import { JOB_STATUSES, JOB_STATUS_LABELS, type JobStatus } from "@/lib/types";

type Filter = JobStatus | "offen" | "alle";
const OPEN: JobStatus[] = ["neu", "geplant", "in_arbeit"];

export function LiveJobsView({
  jobs,
  loadError,
  truncated,
  tradeIds,
  canManage,
}: {
  jobs: CompanyJobRow[];
  loadError: boolean;
  truncated: boolean;
  tradeIds: string[];
  canManage: boolean;
}) {
  const params = useSearchParams();
  const [filter, setFilter] = useState<Filter>("offen");
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(params.get("neu") === "1");

  const counts = useMemo(() => {
    const c: Record<string, number> = { alle: jobs.length, offen: 0 };
    for (const s of JOB_STATUSES) c[s] = 0;
    for (const j of jobs) {
      c[j.status]++;
      if (OPEN.includes(j.status)) c.offen++;
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
            ? OPEN.includes(j.status)
            : j.status === filter,
      )
      .filter(
        (j) =>
          !q ||
          [
            j.title,
            j.customer_name,
            j.location,
            getCategoryLabel(j.category_id),
          ].some((s) => s.toLowerCase().includes(q)),
      );
  }, [jobs, filter, query]);

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
          canManage && (
            <Button
              onClick={() => setCreating(true)}
              className="w-full sm:w-auto"
            >
              <Plus className="size-4" aria-hidden="true" /> Auftrag anlegen
            </Button>
          )
        }
      />

      {loadError && (
        <div className="mb-4">
          <FormAlert>
            Aufträge konnten nicht geladen werden. Bitte Seite neu laden.
          </FormAlert>
        </div>
      )}

      {creating && canManage && (
        <JobEditor tradeIds={tradeIds} onClose={() => setCreating(false)} />
      )}

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
      </div>

      {jobs.length === 0 && !loadError ? (
        <EmptyState
          icon={<ClipboardList className="size-6" />}
          title="Noch keine Aufträge"
          text="Legen Sie Ihren ersten Auftrag an – z. B. einen Termin, der schon feststeht."
          action={
            canManage && (
              <Button onClick={() => setCreating(true)}>
                Ersten Auftrag anlegen
              </Button>
            )
          }
        />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={<Search className="size-6" />}
          title="Keine Aufträge gefunden"
          text="Ändern Sie den Filter oder die Suche."
          action={
            <Button
              variant="secondary"
              onClick={() => {
                setFilter("alle");
                setQuery("");
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
              <JobRow job={j} tradeIds={tradeIds} canManage={canManage} />
            </li>
          ))}
        </ul>
      )}
      {truncated && (
        <p className="mt-4 text-center text-sm text-muted">
          Es werden die ersten 500 Aufträge angezeigt.
        </p>
      )}
    </>
  );
}

/* ---------------- Zeile ---------------- */

function JobRow({
  job: j,
  tradeIds,
  canManage,
}: {
  job: CompanyJobRow;
  tradeIds: string[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [details, setDetails] = useState<JobDetails | null>(null);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const panelId = `job-${j.id}`;

  async function loadDetails() {
    const r = await safeCall(() => getJobDetailsAction(j.id));
    if (r.ok && "data" in r) {
      setDetails(r.data);
      setDetailsError(null);
    } else if (!r.ok) setDetailsError(r.error);
  }

  // Details nachladen, wenn aufgeklappt oder der Auftrag sich geändert hat.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    safeCall(() => getJobDetailsAction(j.id)).then((r) => {
      if (cancelled) return;
      if (r.ok && "data" in r) {
        setDetails(r.data);
        setDetailsError(null);
      } else if (!r.ok) setDetailsError(r.error);
    });
    return () => {
      cancelled = true;
    };
  }, [open, j.id, j.updated_at]);

  function changeStatus(status: string) {
    setStatusError(null);
    startTransition(async () => {
      const r = await safeCall(() =>
        setJobStatusAction(j.id, j.updated_at, status),
      );
      if (!r.ok) setStatusError(r.error);
      router.refresh();
    });
  }

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
          {j.scheduled_date ? (
            <span className="flex items-center gap-1.5 font-medium whitespace-nowrap">
              <CalendarDays className="size-4 text-muted" aria-hidden="true" />
              {formatDay(j.scheduled_date)}
              <span className="font-mono text-muted">
                {shortTime(j.scheduled_time)}
              </span>
            </span>
          ) : (
            <span className="text-muted">Ohne Termin</span>
          )}
        </div>
        <div className="col-span-2 min-w-0 md:col-span-1">
          <p className="truncate font-semibold">{j.title}</p>
          <p className="truncate text-sm text-muted">
            {j.customer_name} · {getCategoryLabel(j.category_id)}
          </p>
        </div>
        <p className="hidden items-center gap-1 truncate text-sm text-muted md:flex">
          <MapPin className="size-3.5 shrink-0" aria-hidden="true" />{" "}
          {j.location}
        </p>
        <div className="order-3 flex items-center justify-end md:order-none md:justify-start">
          <JobStatusBadge status={j.status} />
        </div>
        <ChevronRight
          className={`hidden size-5 text-muted transition md:block ${open ? "rotate-90" : ""}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          id={panelId}
          className="space-y-5 border-t border-line bg-canvas/40 p-4"
        >
          {editing ? (
            <JobEditor
              tradeIds={tradeIds}
              job={j}
              onClose={() => setEditing(false)}
            />
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="grid flex-1 gap-3 text-sm sm:grid-cols-3">
                <Info label="Ort" value={j.location} />
                <Info label="Kunde" value={j.customer_name} />
                <Info
                  label="Angelegt"
                  value={formatDay(j.created_at.slice(0, 10))}
                />
              </div>
              {canManage && (
                <div className="flex items-end gap-2">
                  <label className="block text-sm">
                    <span className="mb-1 block text-xs font-semibold text-muted uppercase">
                      Status
                    </span>
                    <select
                      value={j.status}
                      onChange={(e) => changeStatus(e.target.value)}
                      disabled={pending}
                      className="h-10 rounded-xl border border-line bg-surface px-3 outline-none focus:border-brand-500"
                    >
                      {JOB_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {JOB_STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-10"
                    onClick={() => setEditing(true)}
                  >
                    <Pencil className="size-4" aria-hidden="true" /> Bearbeiten
                  </Button>
                </div>
              )}
            </div>
          )}
          {statusError && <FormAlert>{statusError}</FormAlert>}

          <div className="grid gap-5 lg:grid-cols-2">
            <section aria-label="Notizen">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted uppercase">
                <StickyNote className="size-4" aria-hidden="true" /> Notizen
              </p>
              {detailsError && <FormAlert>{detailsError}</FormAlert>}
              {!details && !detailsError && (
                <Loader2
                  className="size-5 animate-spin text-muted"
                  aria-label="Lädt"
                />
              )}
              {details && (
                <>
                  {details.notes.length === 0 && (
                    <p className="text-sm text-muted">Noch keine Notizen.</p>
                  )}
                  <ul className="space-y-1.5">
                    {details.notes.map((n) => (
                      <li
                        key={n.id}
                        className="rounded-lg bg-surface px-3 py-2 text-sm ring-1 ring-line"
                      >
                        <p className="whitespace-pre-line">{n.body}</p>
                        <p className="mt-1 text-xs text-muted">
                          {n.author} ·{" "}
                          {new Date(n.created_at).toLocaleString("de-DE", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </p>
                      </li>
                    ))}
                  </ul>
                  {canManage && <NoteForm jobId={j.id} onAdded={loadDetails} />}
                </>
              )}
            </section>
            <section aria-label="Verlauf">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted uppercase">
                <History className="size-4" aria-hidden="true" /> Verlauf
              </p>
              {details && (
                <ul className="space-y-1 text-sm">
                  {details.history.map((h) => (
                    <li key={h.id} className="flex gap-2">
                      <span className="w-28 shrink-0 text-xs text-muted">
                        {new Date(h.occurred_at).toLocaleString("de-DE", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </span>
                      <span>
                        {h.action === "created"
                          ? "Angelegt"
                          : h.action === "status_changed"
                            ? `Status: ${JOB_STATUS_LABELS[h.old_status as JobStatus] ?? h.old_status} → ${JOB_STATUS_LABELS[h.new_status as JobStatus] ?? h.new_status}`
                            : "Geändert"}{" "}
                        <span className="text-muted">· {h.actor}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      )}
    </Card>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-muted uppercase">{label}</p>
      <p className="mt-0.5">{value}</p>
    </div>
  );
}

function NoteForm({ jobId, onAdded }: { jobId: string; onAdded: () => void }) {
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const id = useId();
  return (
    <form
      className="mt-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (pending) return;
        setError(null);
        startTransition(async () => {
          const r = await safeCall(() => addJobNoteAction(jobId, body));
          if (r.ok) {
            setBody("");
            onAdded();
          } else setError(r.error);
        });
      }}
    >
      <label htmlFor={id} className="sr-only">
        Neue Notiz
      </label>
      <div className="flex gap-2">
        <input
          id={id}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={1000}
          placeholder="Notiz hinzufügen …"
          className="h-10 min-w-0 flex-1 rounded-xl border border-line bg-surface px-3 text-sm outline-none focus:border-brand-500"
        />
        <Button
          type="submit"
          size="sm"
          className="h-10"
          disabled={pending || !body.trim()}
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" aria-label="Speichert" />
          ) : (
            "Hinzufügen"
          )}
        </Button>
      </div>
      <FieldError id={`${id}-err`} message={error ?? undefined} />
    </form>
  );
}

/* ---------------- Anlegen / Bearbeiten ---------------- */

function JobEditor({
  tradeIds,
  job,
  onClose,
}: {
  tradeIds: string[];
  job?: CompanyJobRow;
  onClose: () => void;
}) {
  const router = useRouter();
  const id = useId();
  const [pending, startTransition] = useTransition();
  const [v, setV] = useState({
    title: job?.title ?? "",
    customerName: job?.customer_name ?? "",
    location: job?.location ?? "",
    categoryId: job?.category_id ?? tradeIds[0] ?? "sonstiges",
    scheduledDate: job?.scheduled_date ?? "",
    scheduledTime: shortTime(job?.scheduled_time),
    status: job?.status ?? "neu",
    note: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const set = (k: keyof typeof v, val: string) =>
    setV((s) => ({ ...s, [k]: val }));

  const categoryOptions = CATEGORIES.filter(
    (c) =>
      tradeIds.includes(c.id) || c.id === v.categoryId || c.id === "sonstiges",
  );

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return; // Doppelklick-Schutz
    setFormError(null);
    const input: JobFormInput = {
      title: v.title,
      customerName: v.customerName,
      location: v.location,
      categoryId: v.categoryId,
      scheduledDate: v.scheduledDate,
      scheduledTime: v.scheduledTime,
      note: v.note,
    };
    // Sofortige Prüfung im Browser – der Server prüft erneut.
    const check = job
      ? jobUpdateSchema.safeParse({ ...input, status: v.status })
      : null;
    const errs = job
      ? check && !check.success
        ? zodErrors(check.error)
        : {}
      : (() => {
          const r = validateJob({ ...input, assigneeIds: [] });
          return r.success ? {} : r.errors;
        })();
    setErrors(errs);
    if (Object.keys(errs).length) return;

    startTransition(async () => {
      const r = await safeCall(() =>
        job
          ? updateJobAction(job.id, job.updated_at, {
              ...input,
              status: v.status,
            })
          : createJobAction(input),
      );
      if (!r.ok) {
        setFormError(r.error);
        if ("fieldErrors" in r && r.fieldErrors) setErrors(r.fieldErrors);
        return;
      }
      onClose();
      router.refresh();
    });
  }

  const input = (k: string) =>
    `h-11 w-full rounded-xl border bg-surface px-3 outline-none focus:border-brand-500 ${errors[k] ? "border-rose-400" : "border-line"}`;
  const a11y = (k: string) => ({
    id: `${id}-${k}`,
    "aria-invalid": !!errors[k],
    "aria-describedby": errors[k] ? `${id}-${k}-err` : undefined,
  });
  const err = (k: string) => (
    <FieldError id={`${id}-${k}-err`} message={errors[k]} />
  );

  return (
    <Card
      className={`${job ? "" : "mb-6"}border-brand-500 p-4 shadow-lg shadow-brand-900/5 sm:p-6`}
    >
      <form onSubmit={submit} noValidate aria-labelledby={`${id}-heading`}>
        <div className="mb-4 flex items-center justify-between">
          <h2 id={`${id}-heading`} className="text-lg font-semibold">
            {job ? "Auftrag bearbeiten" : "Neuer interner Auftrag"}
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
        {formError && (
          <div className="mb-4">
            <FormAlert>{formError}</FormAlert>
          </div>
        )}
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
              maxLength={120}
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
              maxLength={120}
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
              maxLength={120}
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
              {categoryOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
            {err("categoryId")}
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
          {job ? (
            <div>
              <label
                htmlFor={`${id}-status`}
                className="mb-1 block text-sm font-semibold"
              >
                Status
              </label>
              <select
                {...a11y("status")}
                value={v.status}
                onChange={(e) => set("status", e.target.value)}
                className={input("status")}
              >
                {JOB_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {JOB_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="sm:col-span-2">
              <label
                htmlFor={`${id}-note`}
                className="mb-1 block text-sm font-semibold"
              >
                Erste Notiz (optional)
              </label>
              <textarea
                {...a11y("note")}
                rows={2}
                maxLength={1000}
                value={v.note}
                onChange={(e) => set("note", e.target.value)}
                className="w-full rounded-xl border border-line bg-surface px-3 py-2 outline-none focus:border-brand-500"
              />
              {err("note")}
            </div>
          )}
        </div>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={pending}
          >
            Abbrechen
          </Button>
          <Button type="submit" disabled={pending} aria-busy={pending}>
            {pending
              ? "Wird gespeichert …"
              : job
                ? "Änderungen speichern"
                : "Auftrag speichern"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
