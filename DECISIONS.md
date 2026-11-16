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

- **Status:** angenommen; seit Sprint 2 unter `/demo` (echte App unter `/kunde`, `/betrieb`)
- **Entscheidung:** Feste Demo-Datensätze (`isDemo: true`) + `localStorage` für selbst erstellte
  Einträge. Globales Demo-Banner. Fester Demo-Tag (17.11.2026).
- **Folge:** Wird in Sprint 2 durch Supabase ersetzt. Keine echten Personendaten in der Demo.

## ADR-006 · Marktplatzanfragen und Firmenaufträge getrennt modellieren

- **Status:** angenommen (Freigabe Sprint 2, 16.11.2026)
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

## ADR-009 · Supabase: nur Publishable Key, alles über RLS

- **Status:** angenommen (Sprint 2)
- **Entscheidung:** Die App nutzt ausschließlich `NEXT_PUBLIC_SUPABASE_URL` und den Publishable Key.
  Alle Datenzugriffe laufen mit der Sitzung des Nutzers (Server Components / Server Actions über
  `@supabase/ssr`), dadurch greift RLS immer. Kein Service-Role-Key im Code. `env.ts` bricht ab, wenn
  versehentlich ein `sb_secret_…` als öffentlicher Schlüssel eingetragen wird.
- **Folge:** Moderation/Verwaltung (z. B. Anfrage auf „sichtbar“ setzen) braucht später einen
  eigenen, abgesicherten Admin-Weg.

## ADR-010 · Rechte in drei Schichten

- **Status:** angenommen
- **Entscheidung:** (1) `src/proxy.ts` leitet Nicht-Angemeldete zur Anmeldung, (2) Layouts prüfen
  serverseitig die Kontoart (Kunde/Betrieb) und Firmenzugehörigkeit, (3) die Datenbank erzwingt per RLS,
  Spaltenrechten und Triggern, was wirklich erlaubt ist. Schicht 3 ist maßgeblich; 1 und 2 sind Komfort.
- Firma anlegen nur über `create_company()` (legt Firma + Inhaber-Mitgliedschaft atomar an).
- Hilfsfunktionen im nicht öffentlichen Schema `private` (`security definer`, `search_path = ''`).

## ADR-011 · Robustes Absenden von Kundenanfragen

- **Status:** angenommen
- **Entscheidung:** Jede Anfrage bekommt im Browser eine `client_request_id` (UUID), die in der
  Datenbank je Kunde eindeutig ist. Wiederholen nach Netzwerkfehler oder Doppelklick liefert dieselbe
  Anfrage zurück. Fotos haben eine eigene `client_file_id`. Formular-Entwürfe werden lokal gesichert
  (ohne Fotos, max. 7 Tage) und beim Abmelden gelöscht.

## ADR-012 · Fotos: im Browser verkleinern, auf dem Server prüfen, privat speichern

- **Status:** angenommen
- **Entscheidung:** Browser prüft Lesbarkeit und verkleinert auf max. 2048 px als JPEG (entfernt EXIF/GPS,
  kleine Uploads auch mobil, passt unter das Vercel-Limit). Server Action prüft Anmeldung, Eigentum,
  echte Bildsignatur (Magic Bytes) und Größe (≤ 5 MB) und lädt mit der Nutzersitzung in den privaten
  Bucket `request-photos` (Pfad `user/anfrage/datei`). Anzeige nur über signierte URLs (10 Minuten).
  Bucket-Limits (Typ, Größe) zusätzlich in Supabase gesetzt.
- **Alternative:** direkter Upload aus dem Browser mit signierter Upload-URL – erst bei Bedarf (große Dateien).

## ADR-013 · Datenbanktests mit PGlite

- **Status:** angenommen
- **Entscheidung:** `supabase/tests/` startet eine echte Postgres-Engine (PGlite, WASM) im Testprozess,
  bildet die Supabase-Rollen/`auth`/`storage` nach (`supabase-stub.sql`) und spielt alle Migrationen ein.
  Läuft mit `npm test` ohne Docker und ohne Internet.
- **Grenze:** Supabase Auth/Storage-Dienste selbst werden nicht getestet → manueller Testablauf in
  `docs/SUPABASE_SETUP.md`; später ggf. Supabase CLI lokal.

## ADR-014 · Pilotregion als Konfiguration, Architektur bundesweit

- **Status:** angenommen
- **Entscheidung:** PLZ + Ländercode (`DE`) in allen Tabellen, keine Regionsbindung im Schema. Die Pilotregion
  (Friesoythe/Landkreis Cloppenburg) ist eine PLZ-Liste in `src/lib/region.ts` und steuert nur Hinweise.

## ADR-015 · Kategorien bleiben in Sprint 2 im Code

- **Status:** angenommen
- **Entscheidung:** `service_categories` / `category_fields` werden noch NICHT als Tabellen angelegt
  (Auftrag: nicht alle zukünftigen Tabellen auf einmal). Die Datenbank prüft nur das Format der
  `category_id`; die inhaltliche Prüfung macht der Server mit denselben Zod-Schemas wie das Formular.
  8 Pilot-Bereiche (11 Kategorien) haben ausführliche Fragen und werden im Formular zuerst angezeigt.

## ADR-016 · Entscheidungen aus Review Sprint 2 (16.11.2026)

- **Status:** angenommen (Luis + ChatGPT)
- **E-Mail:** Für lokale Tests Supabase Auth (Standard-Versand). Vor dem Pilot DSGVO-geeigneten SMTP-Anbieter
  mit EU-Datenverarbeitung prüfen (z. B. Brevo). Kein kostenpflichtiges Abo ohne Zustimmung.
  „Confirm email“ darf lokal vorübergehend aus sein, muss vor einem Pilot wieder an sein.
- **Kundenkonto:** Im MVP verpflichtend. Gastanfragen evtl. später, wenn Registrierung nachweislich abschreckt.
- **Moderation:** Kundenanfragen werden im Pilot manuell von einem berechtigten Plattformadministrator geprüft;
  nur geprüfte Anfragen werden für Betriebe sichtbar. (Admin-Weg wird in einem späteren Sprint gebaut, siehe ADR-009.)
- **Ablauf:** Sprint 3 erst nach erfolgreichem Integrationstest mit echtem Supabase.
