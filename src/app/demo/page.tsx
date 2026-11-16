import type { Metadata } from "next";
import { Building2, House } from "lucide-react";
import Link from "next/link";
import { DemoBanner, Logo } from "@/components/brand";

export const metadata: Metadata = { title: "Demo" };

export default function DemoIndexPage() {
  return (
    <>
      <DemoBanner />
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-16 max-w-3xl items-center px-4">
          <Logo />
        </div>
      </header>
      <main id="inhalt" className="mx-auto w-full max-w-3xl flex-1 px-4 py-12">
        <h1 className="text-3xl font-bold tracking-tight">Demo ansehen</h1>
        <p className="mt-2 text-muted">
          Ohne Anmeldung, mit erfundenen Beispieldaten. Eingaben bleiben nur in
          Ihrem Browser.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {[
            {
              href: "/demo/kunde",
              icon: House,
              t: "Als Auftraggeber",
              d: "Anfrage stellen und Anfragen verfolgen",
            },
            {
              href: "/demo/betrieb",
              icon: Building2,
              t: "Als Betrieb",
              d: "Aufträge, Team und Marktplatz",
            },
          ].map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="rounded-2xl border border-line bg-surface p-6 transition hover:border-brand-500"
            >
              <c.icon className="size-7 text-brand-700" aria-hidden="true" />
              <p className="mt-3 text-lg font-semibold">{c.t}</p>
              <p className="text-sm text-muted">{c.d}</p>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
