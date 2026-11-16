import type { Metadata } from "next";
import { Camera, EyeOff, MapPin, Send } from "lucide-react";
import { getCategoryLabel } from "@/lib/categories";
import { DEMO_COMPANY, DEMO_LEADS } from "@/lib/demo-data";
import { formatDate, formatEuro } from "@/lib/format";
import { UrgencyBadge } from "@/components/status-badge";
import { Card, DemoTag, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Marktplatz-Anfragen" };

export default function MarketplacePage() {
  const leads = [...DEMO_LEADS].sort((a, b) => a.distanceKm - b.distanceKm);

  return (
    <>
      <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-accent-50 px-3 py-1 text-xs font-semibold text-accent-600">
        Marktplatz · Anfragen von Auftraggebern
      </div>
      <PageHeader
        title="Passende Anfragen"
        description={`Anfragen in Ihren Gewerken und Ihrem Einsatzgebiet (${DEMO_COMPANY.serviceArea}). Getrennt von Ihren eigenen Aufträgen.`}
      />

      <div className="mb-6 flex gap-3 rounded-xl border border-line bg-surface p-4 text-sm">
        <EyeOff
          className="mt-0.5 size-5 shrink-0 text-brand-700"
          aria-hidden="true"
        />
        <p className="text-muted">
          <strong className="text-ink">Datenschutz:</strong> Sie sehen nur
          Kategorie, Beschreibung, PLZ und Ort. Name, Kontaktdaten und genaue
          Adresse gibt der Auftraggeber erst frei, wenn er sich für Sie
          entscheidet.
        </p>
      </div>

      <ul className="grid gap-4 md:grid-cols-2">
        {leads.map((l) => (
          <li key={l.id}>
            <Card className="flex h-full flex-col p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-canvas px-2 py-0.5 text-xs font-semibold">
                  {getCategoryLabel(l.categoryId)}
                </span>
                <UrgencyBadge urgency={l.urgency} />
                <DemoTag />
              </div>
              <h2 className="mt-3 text-lg font-semibold">{l.title}</h2>
              <p className="mt-1 flex-1 text-sm text-muted">{l.summary}</p>
              <dl className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                <div className="flex items-center gap-1">
                  <dt className="sr-only">Ort</dt>
                  <MapPin className="size-4 text-muted" aria-hidden="true" />
                  <dd>
                    {l.postalCode} {l.city}{" "}
                    <span className="text-muted">· ca. {l.distanceKm} km</span>
                  </dd>
                </div>
                <div className="flex items-center gap-1">
                  <dt className="sr-only">Fotos</dt>
                  <Camera className="size-4 text-muted" aria-hidden="true" />
                  <dd>{l.photoCount}</dd>
                </div>
                {l.budget !== undefined && (
                  <div>
                    <dt className="inline text-muted">Budget: </dt>
                    <dd className="inline">{formatEuro(l.budget)}</dd>
                  </div>
                )}
                <div>
                  <dt className="inline text-muted">Eingestellt: </dt>
                  <dd className="inline">{formatDate(l.createdAt)}</dd>
                </div>
              </dl>
              <div className="mt-4 border-t border-line pt-4">
                <button
                  type="button"
                  disabled
                  aria-describedby={`hinweis-${l.id}`}
                  className="inline-flex h-11 w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-accent-500/40 font-semibold text-white"
                >
                  <Send className="size-4" aria-hidden="true" /> Angebot abgeben
                </button>
                <p
                  id={`hinweis-${l.id}`}
                  className="mt-2 text-center text-xs text-muted"
                >
                  Angebote abgeben kommt nach dem MVP.
                </p>
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </>
  );
}
