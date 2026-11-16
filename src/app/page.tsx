import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CalendarDays,
  Camera,
  Check,
  ClipboardList,
  Droplets,
  EyeOff,
  Fence,
  House,
  Inbox,
  Paintbrush,
  ShieldCheck,
  Sparkles,
  Trees,
  Truck,
  Users,
  Zap,
  Hammer,
} from "lucide-react";
import { Logo } from "@/components/brand";
import { PilotBanner } from "@/components/brand-pilot";
import { LinkButton } from "@/components/ui";

const categoryTiles = [
  { icon: Paintbrush, label: "Maler", id: "maler" },
  { icon: Droplets, label: "Sanitär", id: "sanitaer" },
  { icon: Zap, label: "Elektro", id: "elektro" },
  { icon: House, label: "Dach", id: "dach" },
  { icon: Trees, label: "Garten", id: "heckenschnitt" },
  { icon: Fence, label: "Zaun & Pflaster", id: "zaunbau" },
  { icon: Truck, label: "Entrümpelung", id: "entruempelung" },
  { icon: Sparkles, label: "Reinigung", id: "reinigung" },
  { icon: Hammer, label: "Bau", id: "maurer" },
];

export default function LandingPage() {
  return (
    <>
      <PilotBanner />
      <header className="sticky top-0 z-30 border-b border-line/70 bg-canvas/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <nav
            aria-label="Hauptnavigation"
            className="flex items-center gap-1 sm:gap-2"
          >
            <a
              href="#so-gehts"
              className="hidden rounded-lg px-3 py-2 text-sm font-medium text-muted hover:text-ink md:block"
            >
              So funktioniert&apos;s
            </a>
            <a
              href="#betriebe"
              className="hidden rounded-lg px-3 py-2 text-sm font-medium text-muted hover:text-ink md:block"
            >
              Für Betriebe
            </a>
            <LinkButton href="/anmelden" variant="ghost" size="sm">
              Anmelden
            </LinkButton>
            <span className="hidden sm:block">
              <LinkButton href="/registrieren" size="sm">
                Registrieren
              </LinkButton>
            </span>
          </nav>
        </div>
      </header>

      <main id="inhalt" className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(60rem_30rem_at_80%_-10%,var(--color-brand-100),transparent)]"
          />
          <div className="relative mx-auto grid max-w-6xl gap-12 px-4 pt-12 pb-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:pt-20 lg:pb-24">
            <div>
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs font-semibold text-muted">
                <span
                  className="size-1.5 rounded-full bg-accent-500"
                  aria-hidden="true"
                />
                Rund um Haus, Wohnung und Garten
              </p>
              <h1 className="text-4xl leading-[1.05] font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl">
                Arbeiten beschreiben.
                <br />
                <span className="text-brand-700">Betriebe organisieren.</span>
              </h1>
              <p className="mt-5 max-w-xl text-lg text-pretty text-muted">
                Auftraggeber beschreiben, was zu tun ist – passende Betriebe aus
                der Region melden sich. Und Betriebe verwalten hier ihre eigenen
                Aufträge, ihr Team und ihre Termine.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <EntryCard
                  href="/kunde/anfrage/neu"
                  icon={<House className="size-5" />}
                  title="Ich suche einen Betrieb"
                  text="Anfrage in wenigen Schritten stellen"
                  primary
                />
                <EntryCard
                  href="/registrieren?typ=betrieb"
                  icon={<Building2 className="size-5" />}
                  title="Ich bin ein Betrieb"
                  text="Aufträge, Team und Termine im Griff"
                />
              </div>
              <p className="mt-4 text-sm text-muted">
                Für Auftraggeber kostenlos. Erst mal schauen?{" "}
                <Link
                  href="/demo"
                  className="font-semibold text-brand-700 underline-offset-4 hover:underline"
                >
                  Demo ansehen
                </Link>
              </p>
            </div>

            <HeroPreview />
          </div>
        </section>

        {/* Kategorien */}
        <section
          aria-labelledby="kategorien"
          className="border-y border-line bg-surface"
        >
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
              <h2 id="kategorien" className="text-2xl font-bold tracking-tight">
                Was soll gemacht werden?
              </h2>
              <Link
                href="/kunde/anfrage/neu"
                className="text-sm font-semibold text-brand-700 hover:underline"
              >
                Alle 30+ Kategorien →
              </Link>
            </div>
            <ul className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-9">
              {categoryTiles.map(({ icon: Icon, label, id }) => (
                <li key={id}>
                  <Link
                    href={`/kunde/anfrage/neu?kategorie=${id}`}
                    className="group flex h-full flex-col items-center gap-2 rounded-xl border border-line bg-canvas/50 px-2 py-4 text-center text-sm font-medium transition hover:border-brand-500 hover:bg-brand-50"
                  >
                    <Icon
                      className="size-6 text-brand-700 transition group-hover:scale-110"
                      aria-hidden="true"
                    />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* So geht's */}
        <section
          id="so-gehts"
          aria-labelledby="so-gehts-titel"
          className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6"
        >
          <p className="text-sm font-semibold text-accent-600">
            Für Auftraggeber
          </p>
          <h2
            id="so-gehts-titel"
            className="mt-1 text-3xl font-bold tracking-tight"
          >
            In drei Schritten zur Anfrage
          </h2>
          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              {
                icon: ClipboardList,
                t: "Arbeit beschreiben",
                d: "Kategorie wählen, ein paar gezielte Fragen beantworten, Fotos hinzufügen.",
              },
              {
                icon: EyeOff,
                t: "Daten bleiben geschützt",
                d: "Betriebe sehen zunächst nur PLZ und Ort – keine Adresse, keine Kontaktdaten.",
              },
              {
                icon: Inbox,
                t: "Angebote vergleichen",
                d: "Passende Betriebe melden sich. Sie entscheiden, mit wem Sie weitermachen.",
              },
            ].map((s, i) => (
              <li
                key={s.t}
                className="relative rounded-2xl border border-line bg-surface p-6"
              >
                <span
                  className="absolute top-5 right-5 text-5xl font-bold text-line"
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <s.icon className="size-7 text-brand-700" aria-hidden="true" />
                <h3 className="mt-4 text-lg font-semibold">{s.t}</h3>
                <p className="mt-1 text-muted">{s.d}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Betriebe */}
        <section
          id="betriebe"
          aria-labelledby="betriebe-titel"
          className="scroll-mt-20 bg-brand-900 text-white"
        >
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-sm font-semibold text-accent-500">
                Für Betriebe
              </p>
              <h2
                id="betriebe-titel"
                className="mt-1 text-3xl font-bold tracking-tight text-balance"
              >
                Ihr Betrieb läuft hier – auch ohne neue Anfragen.
              </h2>
              <p className="mt-4 text-white/75">
                TradeFlow ist zuerst eine Betriebssoftware: Sie organisieren
                Ihre bestehenden Aufträge. Passende Anfragen aus der Region
                kommen als Extra dazu – klar getrennt.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <LinkButton
                  href="/registrieren?typ=betrieb"
                  variant="accent"
                  size="lg"
                >
                  Als Betrieb registrieren{" "}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </LinkButton>
                <Link
                  href="/demo/betrieb"
                  className="inline-flex h-13 items-center justify-center rounded-xl border border-white/25 px-6 font-semibold text-white transition hover:bg-white/10"
                >
                  Demo ansehen
                </Link>
              </div>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {[
                {
                  icon: ClipboardList,
                  t: "Eigene Aufträge",
                  d: "Anlegen, Status verfolgen, filtern.",
                },
                {
                  icon: Users,
                  t: "Team & Rollen",
                  d: "Mitarbeiter sehen nur, was sie brauchen.",
                },
                {
                  icon: CalendarDays,
                  t: "Termine",
                  d: "Wochenübersicht für das ganze Team.",
                },
                {
                  icon: Inbox,
                  t: "Marktplatz",
                  d: "Passende Anfragen in Ihrem Einsatzgebiet.",
                },
              ].map((f) => (
                <li
                  key={f.t}
                  className="rounded-2xl bg-white/[0.06] p-5 ring-1 ring-white/10"
                >
                  <f.icon
                    className="size-6 text-accent-500"
                    aria-hidden="true"
                  />
                  <h3 className="mt-3 font-semibold">{f.t}</h3>
                  <p className="mt-1 text-sm text-white/70">{f.d}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Ehrlichkeit */}
        <section
          aria-labelledby="vertrauen"
          className="mx-auto max-w-6xl px-4 py-16 sm:px-6"
        >
          <h2 id="vertrauen" className="text-2xl font-bold tracking-tight">
            Klare Regeln statt großer Versprechen
          </h2>
          <ul className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              {
                icon: ShieldCheck,
                t: "Datenschutz zuerst",
                d: "Kunden- und Firmendaten sind nur für Berechtigte sichtbar. Wir sammeln nur, was nötig ist.",
              },
              {
                icon: BadgeCheck,
                t: "Prüfabzeichen nur nach Prüfung",
                d: "Betriebe sind zunächst „unverifiziert“. Ein Abzeichen gibt es erst nach einer echten Prüfung.",
              },
              {
                icon: Check,
                t: "Keine Garantien",
                d: "TradeFlow ist kein Preisgarant und bestätigt keine fachliche Eignung. Sie entscheiden selbst.",
              },
            ].map((f) => (
              <li
                key={f.t}
                className="flex gap-4 rounded-2xl border border-line bg-surface p-5"
              >
                <f.icon
                  className="mt-0.5 size-6 shrink-0 text-brand-700"
                  aria-hidden="true"
                />
                <div>
                  <h3 className="font-semibold">{f.t}</h3>
                  <p className="mt-1 text-sm text-muted">{f.d}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="border-t border-line bg-surface">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>
            © 2026 TradeFlow · Geschlossene Testphase, kein öffentlicher Betrieb
          </p>
          <p>
            Impressum und Datenschutzerklärung folgen vor dem öffentlichen
            Start.
          </p>
        </div>
      </footer>
    </>
  );
}

function EntryCard({
  href,
  icon,
  title,
  text,
  primary,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  text: string;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group flex items-center gap-4 rounded-2xl p-4 transition ${
        primary
          ? "bg-brand-700 text-white shadow-lg shadow-brand-900/15 hover:bg-brand-600"
          : "border border-line bg-surface hover:border-brand-500"
      }`}
    >
      <span
        className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${
          primary ? "bg-white/15" : "bg-brand-50 text-brand-700"
        }`}
      >
        {icon}
      </span>
      <span className="flex-1">
        <span className="block font-semibold">{title}</span>
        <span
          className={`block text-sm ${primary ? "text-white/75" : "text-muted"}`}
        >
          {text}
        </span>
      </span>
      <ArrowRight
        className="size-5 shrink-0 transition group-hover:translate-x-0.5"
        aria-hidden="true"
      />
    </Link>
  );
}

/** Rein dekorative Vorschau – keine echten Daten. */
function HeroPreview() {
  return (
    <div
      aria-hidden="true"
      className="relative mx-auto w-full max-w-md select-none lg:max-w-none"
    >
      <div className="rotate-[1.5deg] rounded-3xl border border-line bg-surface p-5 shadow-xl shadow-brand-900/10">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted uppercase">
            Neue Anfrage · Beispiel
          </span>
          <span className="rounded-full bg-violet-50 px-2 py-0.5 text-xs font-semibold text-violet-800">
            Für Betriebe sichtbar
          </span>
        </div>
        <p className="mt-3 text-lg font-semibold">3-Zimmer-Wohnung streichen</p>
        <div className="mt-2 flex flex-wrap gap-2 text-sm text-muted">
          <span className="rounded-md bg-canvas px-2 py-1">Maler</span>
          <span className="rounded-md bg-canvas px-2 py-1">ca. 180 m²</span>
          <span className="rounded-md bg-canvas px-2 py-1">Innen</span>
          <span className="flex items-center gap-1 rounded-md bg-canvas px-2 py-1">
            <Camera className="size-3.5" /> 3
          </span>
        </div>
        <div className="mt-4 h-24 rounded-xl bg-[repeating-linear-gradient(135deg,var(--color-canvas)_0_10px,var(--color-surface)_10px_20px)] ring-1 ring-line" />
      </div>
      <div className="-mt-6 ml-8 -rotate-[2deg] rounded-3xl border border-line bg-surface p-5 shadow-xl shadow-brand-900/10 sm:ml-16">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted uppercase">
            Heute im Betrieb
          </span>
          <CalendarDays className="size-4 text-muted" />
        </div>
        <ul className="mt-3 space-y-2 text-sm">
          {[
            ["08:00", "Wohnzimmer streichen", "bg-amber-400"],
            ["13:00", "Vinylboden verlegen", "bg-violet-400"],
            ["16:00", "Aufmaß Bad", "bg-sky-400"],
          ].map(([t, l, c]) => (
            <li
              key={t}
              className="flex items-center gap-3 rounded-lg bg-canvas px-3 py-2"
            >
              <span className={`size-2 rounded-full ${c}`} />
              <span className="w-11 font-mono text-xs text-muted">{t}</span>
              <span className="font-medium">{l}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
