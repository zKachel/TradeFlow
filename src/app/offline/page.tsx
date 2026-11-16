import type { Metadata } from "next";
import { WifiOff } from "lucide-react";
import { LogoMark } from "@/components/brand";

export const metadata: Metadata = { title: "Offline" };

export default function OfflinePage() {
  return (
    <main
      id="inhalt"
      className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center"
    >
      <LogoMark className="size-12" />
      <WifiOff className="mt-8 size-10 text-muted" aria-hidden="true" />
      <h1 className="mt-4 text-2xl font-bold tracking-tight">
        Keine Internetverbindung
      </h1>
      <p className="mt-2 max-w-sm text-muted">
        TradeFlow braucht eine Verbindung, um Ihre Aufträge zu laden. Bitte
        prüfen Sie Ihr Netz und versuchen Sie es erneut.
      </p>
      {/* Bewusst <a> statt <Link>: vollständiges Neuladen, damit offline kein Client-Routing versucht wird. */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a
        href="/"
        className="mt-6 inline-flex h-11 items-center rounded-xl bg-brand-700 px-5 font-semibold text-white"
      >
        Erneut versuchen
      </a>
    </main>
  );
}
