# TASKS

Stand: 16.11.2026 · Grundlage: [`docs/MASTERPLAN.md`](docs/MASTERPLAN.md)

Legende: `[x]` fertig und getestet · `[~]` nur als Demo/Mock · `[ ]` offen

## Sprint 0 – Projektstart ✅

- [x] Next.js 16 + TypeScript + Tailwind CSS 4 eingerichtet
- [x] README mit Startanleitung, `.env.example`, `.gitignore` (keine Secrets im Repo)
- [x] ESLint, Prettier (mit Tailwind-Sortierung), Vitest
- [x] Projektstruktur und Architekturentscheidungen dokumentiert (`DECISIONS.md`)
- [x] Abnahme: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` erfolgreich

## Sprint 1 – Klickbare Demo ✅

- [x] Landingpage mit zwei Nutzerwegen (Auftraggeber / Betrieb)
- [~] Kunden-Dashboard „Meine Anfragen“ (Demo-Daten + lokal erstellte Anfragen)
- [x] Anfrageformular: Kategorieauswahl mit Suche, 4 Schritte, Fortschrittsanzeige
- [x] Dynamische Zusatzfelder per Schema (`src/lib/categories.ts`) für alle Kategorien aus Abschnitt 3
- [x] Validierung mit Zod inkl. Unit-Tests; regelbasierte Rückfragen bei fehlenden Angaben
- [~] Foto-Auswahl mit Vorschau und Typ-/Größenprüfung (kein Upload)
- [~] Firmen-Dashboard: Übersicht, Termine heute/nächste, nicht zugewiesene Aufträge
- [~] Eigene Aufträge: Statusfilter, Suche, Mitarbeiterfilter, Notizen, „Auftrag anlegen“ (lokal)
- [~] Marktplatz-Anfragen getrennt von eigenen Aufträgen, ohne Kontaktdaten/Adresse
- [~] Team- und Rechteübersicht (nur Anzeige)
- [x] Demo-Kennzeichnung auf allen Seiten (Banner + „Demo“-Markierung an Datensätzen)
- [x] PWA-Grundgerüst: Manifest, Icons (inkl. maskable), Service Worker mit Offline-Seite
- [x] Leere Zustände, Fehlermeldungen, 404-Seite, Lade-Skelette
- [x] Barrierearmut: Labels, Fokus-Ring, Tastaturbedienung, `aria-*`, reduzierte Bewegung
- [x] Abnahme: auf 390 px (Handy) und 1440 px (Desktop) per Screenshot geprüft; Klicktest Anfrage → Dashboard → Neuladen, Auftrag anlegen → Liste

## Sprint 2 – Echte Kernfunktionalität ⏸ wartet auf Freigabe

- [ ] Supabase-Projekt anlegen (Region EU, kostenloser Plan) – **Freigabe nötig**
- [ ] Authentifizierung: Registrierung, Login, Passwort-Reset
- [ ] Datenmodell + versionierte Migrationen (siehe `DECISIONS.md`, ADR-006)
- [ ] RLS-Policies für alle Tabellen
- [ ] Kundenanfragen serverseitig speichern (gleiche Zod-Schemas wie im Formular)
- [ ] Private Bild-Uploads (privater Bucket, signierte URLs, Typ-/Größenlimits)
- [ ] Eigene Firmenaufträge erstellen, bearbeiten, filtern
- [ ] Negativtests: Nutzer A kann Daten von Nutzer B weder lesen noch ändern
- [ ] `demo-store.ts` und Demo-Daten durch echte Daten ersetzen (Demo-Modus optional behalten)

## Sprint 3 – Betriebe und Mitarbeiter

- [ ] Firmenprofile und Mitgliedschaften
- [ ] Einladungen (sichere, einmalige, zeitlich begrenzte Tokens)
- [ ] Rollen und Zuweisungen serverseitig
- [ ] Terminübersicht

## Sprint 4 – Erste Vermittlung / geschlossene Pilotphase

- [ ] Freigabe-/Matching-Regeln
- [ ] Datenschutzfreundliche Kontakt-/Angebotsanbahnung
- [ ] Moderation und Missbrauchsschutz
- [ ] Sicherheits-, Nutzbarkeits- und Lasttests

## Offen / vor öffentlichem Start (nicht eigenmächtig entscheiden)

- [ ] Impressum, Datenschutzerklärung, AVV – rechtlich prüfen lassen
- [ ] Name/Logo/Markenprüfung „TradeFlow“
- [ ] Pilotmarkt und Region
- [ ] Verifizierungsprozess für Betriebe
- [ ] Preismodell
- [ ] Anfrage an einzelne oder mehrere Betriebe?
- [ ] Hosting-Anbieter (Vercel o. a.) – **Freigabe nötig**

## Bekannte Einschränkungen der Demo

- Daten nur im Browser (`localStorage`), gehen bei „Browserdaten löschen“ verloren.
- Fotos werden nicht gespeichert.
- Statuswechsel, Angebote, Einladungen sind nur angedeutet (deaktivierte Buttons mit Hinweis).
- Demo-Datum ist fest auf 17.11.2026 gesetzt, damit die Termine stabil bleiben.
- `npm audit` meldet moderate Hinweise in Entwicklungsabhängigkeiten; vor Sprint 2 prüfen.
