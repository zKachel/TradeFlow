import Link from "next/link";
import { FlaskConical } from "lucide-react";

/** Hinweis für den echten (nicht-Demo) Bereich während der geschlossenen Testphase. */
export function PilotBanner() {
  return (
    <div
      role="note"
      className="flex items-center justify-center gap-2 bg-accent-600 px-4 py-1.5 text-center text-xs text-white"
    >
      <FlaskConical className="size-3.5 shrink-0" aria-hidden="true" />
      <span>
        <strong className="font-semibold">Geschlossene Testphase</strong> ·
        Nicht öffentlich. Bitte nur Testdaten eingeben.
      </span>
    </div>
  );
}

export function SetupNotice() {
  return (
    <div
      role="status"
      className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
    >
      <p className="font-semibold">Die Datenbank ist noch nicht verbunden.</p>
      <p className="mt-1">
        Anmeldung und Speichern funktionieren erst, wenn Supabase eingerichtet
        ist (Anleitung:{" "}
        <code className="rounded bg-white/60 px-1">docs/SUPABASE_SETUP.md</code>
        ). Bis dahin können Sie die{" "}
        <Link href="/demo" className="font-semibold underline">
          Demo
        </Link>{" "}
        ansehen.
      </p>
    </div>
  );
}
