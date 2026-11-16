"use client";

import { useState } from "react";
import {
  Camera,
  ChevronRight,
  Inbox,
  MapPin,
  Plus,
  RotateCcw,
} from "lucide-react";
import { describeDetails, getCategoryLabel } from "@/lib/categories";
import { DEMO_CUSTOMER_REQUESTS } from "@/lib/demo-data";
import { resetDemoData, useDemoRequests } from "@/lib/demo-store";
import { formatDate, formatEuro } from "@/lib/format";
import {
  URGENCY_LABELS,
  type CustomerRequest,
  type MarketplaceStatus,
} from "@/lib/types";
import { MarketStatusBadge } from "@/components/status-badge";
import {
  Button,
  Card,
  DemoTag,
  EmptyState,
  LinkButton,
  PageHeader,
} from "@/components/ui";

const TIMELINE: { status: MarketplaceStatus; label: string }[] = [
  { status: "eingereicht", label: "Eingereicht" },
  { status: "pruefung", label: "Prüfung" },
  { status: "sichtbar", label: "Sichtbar" },
  { status: "angebote", label: "Angebote" },
  { status: "vergeben", label: "Vergeben" },
];
const ORDER: MarketplaceStatus[] = [
  "entwurf",
  "eingereicht",
  "pruefung",
  "sichtbar",
  "angebote",
  "vergeben",
  "in_arbeit",
  "abgeschlossen",
];

export function CustomerRequestList() {
  const own = useDemoRequests();
  const requests = [...own, ...DEMO_CUSTOMER_REQUESTS];

  return (
    <>
      <PageHeader
        title="Meine Anfragen"
        description="Hier sehen Sie nur Ihre eigenen Anfragen und deren Stand."
        action={
          <LinkButton
            href="/demo/kunde/anfrage/neu"
            className="w-full sm:w-auto"
          >
            <Plus className="size-4" aria-hidden="true" /> Neue Anfrage stellen
          </LinkButton>
        }
      />

      {requests.length === 0 ? (
        <EmptyState
          icon={<Inbox className="size-6" />}
          title="Noch keine Anfragen"
          text="Beschreiben Sie Ihre erste Arbeit – das dauert nur ein paar Minuten."
          action={
            <LinkButton href="/demo/kunde/anfrage/neu">
              Anfrage stellen
            </LinkButton>
          }
        />
      ) : (
        <ul className="space-y-3">
          {requests.map((r) => (
            <li key={r.id}>
              <RequestCard request={r} isNew={own.some((o) => o.id === r.id)} />
            </li>
          ))}
        </ul>
      )}

      {own.length > 0 && (
        <div className="mt-8 flex justify-center">
          <Button variant="ghost" size="sm" onClick={resetDemoData}>
            <RotateCcw className="size-4" aria-hidden="true" /> Selbst erstellte
            Demo-Anfragen löschen
          </Button>
        </div>
      )}
    </>
  );
}

function RequestCard({
  request: r,
  isNew,
}: {
  request: CustomerRequest;
  isNew: boolean;
}) {
  const [open, setOpen] = useState(false);
  const details = describeDetails(r.categoryId, r.details);
  const current = ORDER.indexOf(r.status);
  const panelId = `anfrage-${r.id}`;

  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-start gap-3 p-4 text-left hover:bg-canvas/60 sm:p-5"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <MarketStatusBadge status={r.status} />
            <DemoTag />
            {isNew && (
              <span className="text-xs font-semibold text-brand-700">
                Gerade erstellt
              </span>
            )}
          </div>
          <p className="mt-2 truncate font-semibold sm:text-lg">{r.title}</p>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
            <span>{getCategoryLabel(r.categoryId)}</span>
            <span className="flex items-center gap-1">
              <MapPin className="size-3.5" aria-hidden="true" /> {r.postalCode}{" "}
              {r.city}
            </span>
            <span>seit {formatDate(r.createdAt)}</span>
            {r.photoCount > 0 && (
              <span className="flex items-center gap-1">
                <Camera className="size-3.5" aria-hidden="true" />{" "}
                {r.photoCount}
              </span>
            )}
          </p>
        </div>
        <ChevronRight
          className={`mt-1 size-5 shrink-0 text-muted transition ${open ? "rotate-90" : ""}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          id={panelId}
          className="border-t border-line bg-canvas/40 p-4 sm:p-5"
        >
          <ol className="mb-5 grid grid-cols-5 gap-1" aria-label="Fortschritt">
            {TIMELINE.map((step) => {
              const done = current >= ORDER.indexOf(step.status);
              return (
                <li key={step.status} className="flex flex-col gap-1.5">
                  <span
                    className={`h-1.5 rounded-full ${done ? "bg-brand-500" : "bg-line"}`}
                  />
                  <span
                    className={`text-[11px] sm:text-xs ${done ? "font-semibold text-ink" : "text-muted"}`}
                  >
                    {step.label}
                  </span>
                </li>
              );
            })}
          </ol>

          <p className="text-sm whitespace-pre-line">{r.description}</p>

          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <Detail label="Zeitraum" value={URGENCY_LABELS[r.urgency]} />
            {r.budget !== undefined && (
              <Detail
                label="Budget (Vorstellung)"
                value={formatEuro(r.budget)}
              />
            )}
            {details.map((d) => (
              <Detail key={d.label} label={d.label} value={d.value} />
            ))}
          </dl>

          <div className="mt-5 rounded-xl border border-line bg-surface p-4 text-sm">
            {r.offerCount > 0 ? (
              <>
                <p className="font-semibold">
                  {r.offerCount} Angebote eingegangen (Demo)
                </p>
                <p className="mt-1 text-muted">
                  Der Angebotsvergleich mit Annahme/Ablehnung kommt nach dem
                  MVP.
                </p>
              </>
            ) : (
              <>
                <p className="font-semibold">Noch keine Angebote</p>
                <p className="mt-1 text-muted">
                  Passende Betriebe sehen Ihre Anfrage ohne Ihre Kontaktdaten
                  und genaue Adresse.
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface px-3 py-2 ring-1 ring-line">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
