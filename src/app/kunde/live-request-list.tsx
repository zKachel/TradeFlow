"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Camera, ChevronRight, Inbox, MapPin, Plus } from "lucide-react";
import { cancelRequestAction } from "./actions";
import { FormAlert } from "@/components/form";
import { MarketStatusBadge } from "@/components/status-badge";
import {
  Button,
  Card,
  EmptyState,
  LinkButton,
  PageHeader,
} from "@/components/ui";
import { describeDetails, getCategoryLabel } from "@/lib/categories";
import { formatDate, formatEuro } from "@/lib/format";
import { safeCall } from "@/lib/request-submission";
import {
  URGENCY_LABELS,
  type MarketplaceStatus,
  type Urgency,
} from "@/lib/types";

export interface LiveRequest {
  id: string;
  categoryId: string;
  title: string;
  description: string;
  postalCode: string;
  city: string;
  urgency: Urgency;
  budget?: number;
  details: Record<string, string | number | boolean>;
  status: MarketplaceStatus;
  createdAt: string;
  photos: string[];
  photoCount: number;
}

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
const CANCELLABLE: MarketplaceStatus[] = [
  "entwurf",
  "eingereicht",
  "pruefung",
  "sichtbar",
  "angebote",
];

export function LiveRequestList({
  requests,
  loadError,
}: {
  requests: LiveRequest[];
  loadError: boolean;
}) {
  return (
    <>
      <PageHeader
        title="Meine Anfragen"
        description="Nur Sie sehen Ihre Anfragen und Fotos."
        action={
          <LinkButton href="/kunde/anfrage/neu" className="w-full sm:w-auto">
            <Plus className="size-4" aria-hidden="true" /> Neue Anfrage stellen
          </LinkButton>
        }
      />
      {loadError && (
        <div className="mb-4">
          <FormAlert>
            Ihre Anfragen konnten nicht geladen werden. Bitte Seite neu laden.
          </FormAlert>
        </div>
      )}
      {requests.length === 0 && !loadError ? (
        <EmptyState
          icon={<Inbox className="size-6" />}
          title="Noch keine Anfragen"
          text="Beschreiben Sie Ihre erste Arbeit – das dauert nur ein paar Minuten."
          action={
            <LinkButton href="/kunde/anfrage/neu">Anfrage stellen</LinkButton>
          }
        />
      ) : (
        <ul className="space-y-3">
          {requests.map((r) => (
            <li key={r.id}>
              <RequestCard request={r} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function RequestCard({ request: r }: { request: LiveRequest }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const details = describeDetails(r.categoryId, r.details);
  const current = ORDER.indexOf(r.status);
  const panelId = `anfrage-${r.id}`;

  function cancel() {
    startTransition(async () => {
      const res = await safeCall(() => cancelRequestAction(r.id));
      if (!res.ok) setError(("error" in res && res.error) || "Fehler");
      setConfirming(false);
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
        className="flex w-full items-start gap-3 p-4 text-left hover:bg-canvas/60 sm:p-5"
      >
        <div className="min-w-0 flex-1">
          <MarketStatusBadge status={r.status} />
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
          {r.status !== "storniert" && (
            <ol
              className="mb-5 grid grid-cols-5 gap-1"
              aria-label="Fortschritt"
            >
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
          )}
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
          {r.photos.length > 0 && (
            <ul
              className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6"
              aria-label="Fotos"
            >
              {r.photos.map((url, i) => (
                <li
                  key={url}
                  className="aspect-square overflow-hidden rounded-lg bg-canvas ring-1 ring-line"
                >
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element -- privates Foto über signierte URL */}
                    <img
                      src={url}
                      alt={`Foto ${i + 1} zu „${r.title}“`}
                      className="size-full object-cover"
                      loading="lazy"
                    />
                  </a>
                </li>
              ))}
            </ul>
          )}

          {error && (
            <div className="mt-4">
              <FormAlert>{error}</FormAlert>
            </div>
          )}

          {CANCELLABLE.includes(r.status) && (
            <div className="mt-5 border-t border-line pt-4">
              {confirming ? (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <p className="text-sm font-medium">
                    Anfrage wirklich zurückziehen?
                  </p>
                  <div className="flex gap-2 sm:ml-auto">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setConfirming(false)}
                      disabled={pending}
                    >
                      Abbrechen
                    </Button>
                    <Button
                      size="sm"
                      className="bg-rose-700 hover:bg-rose-800"
                      onClick={cancel}
                      disabled={pending}
                    >
                      {pending ? "…" : "Ja, zurückziehen"}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirming(true)}
                >
                  Anfrage zurückziehen
                </Button>
              )}
            </div>
          )}
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
