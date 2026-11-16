import {
  JOB_STATUS_LABELS,
  MARKETPLACE_STATUS_LABELS,
  URGENCY_LABELS,
  type JobStatus,
  type MarketplaceStatus,
  type Urgency,
} from "@/lib/types";

const tone = {
  slate: "bg-slate-100 text-slate-700 ring-slate-200",
  sky: "bg-sky-50 text-sky-800 ring-sky-200",
  amber: "bg-amber-50 text-amber-800 ring-amber-200",
  brand: "bg-brand-50 text-brand-700 ring-brand-100",
  violet: "bg-violet-50 text-violet-800 ring-violet-200",
  rose: "bg-rose-50 text-rose-800 ring-rose-200",
} as const;

const jobTone: Record<JobStatus, keyof typeof tone> = {
  neu: "sky",
  geplant: "violet",
  in_arbeit: "amber",
  erledigt: "brand",
  storniert: "slate",
};

const marketTone: Record<MarketplaceStatus, keyof typeof tone> = {
  entwurf: "slate",
  eingereicht: "sky",
  pruefung: "sky",
  sichtbar: "violet",
  angebote: "amber",
  vergeben: "brand",
  in_arbeit: "amber",
  abgeschlossen: "brand",
  storniert: "slate",
};

function Badge({ label, t }: { label: string; t: keyof typeof tone }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ring-1 ring-inset ${tone[t]}`}
    >
      <span
        className="size-1.5 rounded-full bg-current opacity-70"
        aria-hidden="true"
      />
      {label}
    </span>
  );
}

export function JobStatusBadge({ status }: { status: JobStatus }) {
  return <Badge label={JOB_STATUS_LABELS[status]} t={jobTone[status]} />;
}

export function MarketStatusBadge({ status }: { status: MarketplaceStatus }) {
  return (
    <Badge label={MARKETPLACE_STATUS_LABELS[status]} t={marketTone[status]} />
  );
}

const urgencyShort: Record<Urgency, string> = {
  dringend: "Dringend",
  in_2_wochen: "≤ 2 Wochen",
  in_4_wochen: "≤ 4 Wochen",
  flexibel: "Flexibel",
};

export function UrgencyBadge({ urgency }: { urgency: Urgency }) {
  return (
    <span
      title={URGENCY_LABELS[urgency]}
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
        urgency === "dringend"
          ? "bg-rose-50 text-rose-700"
          : "bg-slate-100 text-slate-600"
      }`}
    >
      {urgencyShort[urgency]}
    </span>
  );
}
