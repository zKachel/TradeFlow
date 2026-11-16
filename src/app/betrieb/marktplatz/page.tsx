import type { Metadata } from "next";
import { EyeOff, Inbox } from "lucide-react";
import { Card, LinkButton, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Marktplatz-Anfragen" };

export default function MarketplacePage() {
  return (
    <>
      <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-accent-50 px-3 py-1 text-xs font-semibold text-accent-600">
        Marktplatz · Anfragen von Auftraggebern
      </div>
      <PageHeader
        title="Passende Anfragen"
        description="Getrennt von Ihren eigenen Aufträgen."
      />
      <Card className="flex flex-col items-center px-6 py-12 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-accent-50 text-accent-600">
          <Inbox className="size-6" aria-hidden="true" />
        </span>
        <p className="mt-3 font-semibold">
          Der Marktplatz startet mit der Pilotphase
        </p>
        <p className="mt-1 max-w-md text-sm text-muted">
          Dann sehen Sie hier Anfragen aus Ihren Gewerken und Ihrem
          Einsatzgebiet – zunächst nur mit PLZ und Ort, ohne Namen und
          Kontaktdaten der Auftraggeber.
        </p>
        <p className="mt-4 flex items-center gap-1.5 text-xs text-muted">
          <EyeOff className="size-3.5" aria-hidden="true" /> Kundendaten werden
          erst nach Freigabe sichtbar.
        </p>
        <LinkButton
          href="/demo/betrieb/marktplatz"
          variant="secondary"
          className="mt-6"
        >
          So wird es aussehen (Demo)
        </LinkButton>
      </Card>
    </>
  );
}
