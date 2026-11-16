# DECISIONS

Architekturentscheidungen (kurz). Neue Entscheidungen unten anhängen, alte nicht löschen,
sondern als „ersetzt durch ADR-xxx“ markieren.

---

## ADR-001 · Next.js 16 (App Router) + TypeScript als modularer Monolith

- **Status:** angenommen (16.11.2026)
- **Kontext:** Masterplan Abschnitt 7 – eine Codebasis für Web, PWA, später Server-Logik.
- **Entscheidung:** Next.js 16.4 mit App Router, React 19, TypeScript strict. Keine Microservices.
  `cacheComponents` und `partialPrefetching` sind aktiv (Standard der Vorlage, wird in Next 17 Pflicht).
- **Folge:** Komponenten, die URL-Parameter lesen (`useSearchParams`), stehen in `<Suspense>`.

## ADR-002 · Tailwind CSS 4, eigene schlanke UI-Bausteine statt UI-Bibliothek

- **Status:** angenommen
- **Entscheidung:** Farben/Schrift als Theme-Variablen in `globals.css`; Buttons, Karten usw. in
  `src/components/ui.tsx`. Icons: `lucide-react`. Schrift: Inter, lokal über `@fontsource-variable`
  (kein Abruf bei Google zur Laufzeit → datenschutzfreundlich).
- **Alternative:** shadcn/ui – später möglich, wenn komplexere Komponenten (Dialoge, Datepicker) nötig werden.

## ADR-003 · Kategorien und Zusatzfelder datengetrieben

- **Status:** angenommen
- **Entscheidung:** Eine Liste in `src/lib/categories.ts` beschreibt Kategorien und Felder
  (Typ, Pflicht, Einheit, Grenzen, Optionen, Rückfrage). Das Formular rendert daraus generisch,
  Zod-Schemas werden daraus erzeugt. Keine eigene Seite je Kategorie.
- **Folge:** In Sprint 2 wandert die Struktur 1:1 in `service_categories` / `category_fields`.

## ADR-004 · Zod-Schemas als gemeinsame Validierung für Client und Server

- **Status:** angenommen
- **Entscheidung:** `request-schema.ts` und `job-schema.ts` sind framework-unabhängig. Im Formular
  für schnelle Rückmeldung, ab Sprint 2 identisch serverseitig (Server Action) – der Server bleibt maßgeblich.

## ADR-005 · Demo-Daten nur im Browser, klar gekennzeichnet

- **Status:** angenommen (nur Sprint 1)
- **Entscheidung:** Feste Demo-Datensätze (`isDemo: true`) + `localStorage` für selbst erstellte
  Einträge. Globales Demo-Banner. Fester Demo-Tag (17.11.2026).
- **Folge:** Wird in Sprint 2 durch Supabase ersetzt. Keine echten Personendaten in der Demo.

## ADR-006 · Marktplatzanfragen und Firmenaufträge getrennt modellieren (Vorschlag für Sprint 2)

- **Status:** vorgeschlagen – vor Sprint 2 bestätigen
- **Entscheidung:** Getrennte Tabellen `customer_requests` und `company_jobs`. Wird eine Anfrage
  vergeben, entsteht ein `company_job` mit Verweis `source_request_id`.
- **Gründe:** unterschiedliche Eigentümer (Kunde vs. Betrieb), unterschiedliche Lebenszyklen,
  einfachere und sicherere RLS-Policies, interne Aufträge können nie versehentlich öffentlich werden.
- **Betriebe sehen Anfragen** über eine eingeschränkte Ansicht (ohne Name, Kontakt, Adresse).

## ADR-007 · PWA ohne Zusatzbibliothek

- **Status:** angenommen
- **Entscheidung:** `app/manifest.ts` + handgeschriebener `public/sw.js`: Netzwerk zuerst, offline
  nur die Offline-Seite. Es werden **keine Seiten mit Nutzerdaten** gecacht. Registrierung nur in Produktion.
- **Alternative:** Serwist – erst wenn echte Offline-Funktionen gebraucht werden.

## ADR-008 · Sicherheits-Header von Anfang an

- **Status:** angenommen
- **Entscheidung:** `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`,
  `Permissions-Policy` in `next.config.ts`; `poweredByHeader: false`. Eine vollständige CSP folgt mit Sprint 2.
