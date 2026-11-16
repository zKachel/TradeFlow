# TASKS

Stand: 16.11.2026 (Sprint 2 umgesetzt, wartet auf Test mit echtem Supabase-Projekt) · Grundlage: [`docs/MASTERPLAN.md`](docs/MASTERPLAN.md)

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

## Sprint 2 – Echte Kernfunktionalität ✅ (Code fertig, Test mit echtem Supabase offen)

Freigabe: 16.11.2026. Schwerpunkt: Datenbank, Login, Firmenverwaltung.

### Datenbank & Sicherheit

- [x] Migrationen (`supabase/migrations/`): profiles, companies, company_memberships, customer_requests,
      request_attachments, company_jobs, job_notes, audit_events + privater Storage-Bucket
- [x] RLS auf allen Tabellen; `anon` hat keinerlei Zugriff; Tabellenrechte spaltengenau
- [x] Kundenanfragen und Firmenaufträge getrennt (ADR-006)
- [x] Statuswechsel mit Zeit und Nutzer protokolliert (Trigger → audit_events)
- [x] Missbrauchsschutz: max. 10 Anfragen/24 h, max. 6 Fotos/Anfrage, geschützte Felder per Trigger
- [x] 38 Datenbanktests mit PGlite inkl. Negativtests (Nutzer/Firma A ↔ B, Kunde ↔ Betrieb, anon)
- [ ] Migrationen im echten Supabase-Projekt einspielen (**Luis**, Anleitung `docs/SUPABASE_SETUP.md`)

### Anmeldung

- [x] Registrierung mit Kontoart (Auftraggeber/Betrieb), Login, Logout, Passwort vergessen/neu
- [x] E-Mail-Bestätigung (token_hash und PKCE), sichere Weiterleitung (kein Open Redirect)
- [x] Routenschutz: `src/proxy.ts` (Anmeldung) + serverseitige Kontoart-Prüfung in Layouts + RLS
- [x] Keine Konto-Aufzählung über Fehlermeldungen; Unterscheidung „Server nicht erreichbar“
- [ ] Ende-zu-Ende-Test mit echtem Supabase-Projekt (**Luis**, Testablauf in SUPABASE_SETUP.md)

### Firmenverwaltung (priorisiert)

- [x] Betrieb einrichten (Name, PLZ, Ort, Einsatzradius, Gewerke) – Status „unverifiziert“
- [x] Firmenprofil bearbeiten (nur Inhaber)
- [x] Aufträge dauerhaft speichern, bearbeiten, Status ändern, filtern, suchen
- [x] Notizen und Verlauf je Auftrag
- [x] Schutz gegen gleichzeitiges Bearbeiten (Änderung wird abgelehnt, wenn inzwischen geändert)
- [x] Übersicht: offene Aufträge, Termine heute (deutsche Zeit), nächste Termine, Neue ohne Termin
- [x] Team-Ansicht mit echten Mitgliedern (Einladen: Sprint 3)

### Kundenanfragen

- [x] Anfragen dauerhaft speichern, eigene Anfragen ansehen, zurückziehen
- [x] Doppelte Einsendung verhindert (Formular-ID + Datenbank-Unique + Klick-Sperre)
- [x] Netzwerkunterbrechung: Meldung, Eingaben bleiben, Wiederholen ohne Duplikat
- [x] Formularabbruch: Entwurf wird automatisch gesichert und wiederhergestellt (7 Tage)
- [x] Fotos: Prüfung beim Auswählen (beschädigt/falscher Typ/zu groß), Verkleinerung im Browser
      (entfernt GPS-Daten), Server prüft echte Bildsignatur, privater Bucket, signierte URLs (10 Min.)
- [x] Einzelne fehlgeschlagene Foto-Uploads können wiederholt werden
- [x] Alle 32 Kategorien; 8 Pilot-Bereiche mit ausführlichen Fragen (Maler, Gartenpflege,
      Entrümpelung, Bodenverlegung, Reinigung, Möbel-/Küchenmontage, Pflaster-/Terrassenarbeiten, Sanitär)
- [x] Pilotregion Friesoythe/Landkreis Cloppenburg (Hinweis bei anderer PLZ, Architektur bundesweit)

### Qualität

- [x] `npm audit`: 0 Warnungen (Dev-Abhängigkeiten aktualisiert)
- [x] 90 automatische Tests (Unit, Datenbank/RLS, Formular-Robustheit mit jsdom)
- [x] Browser-Tests (Chrome): Weiterleitungen, Login-/Registrierungsfehler, Demo-Formular mit echten
      Bilddateien (beschädigt, SVG, PNG), Doppelklick, Entwurf nach Neuladen
- [x] Demo bleibt unter `/demo` vollständig erhalten

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

- [ ] „Confirm email“ in Supabase wieder einschalten, falls zum Testen ausgeschaltet
- [ ] Eigener E-Mail-Versand (SMTP) für Bestätigungs-/Passwort-E-Mails – Anbieter wählen (ggf. Kosten)
- [ ] Content-Security-Policy (CSP) ergänzen
- [ ] Postleitzahlen der Pilotregion prüfen (`src/lib/region.ts`)
- [ ] Rate-Limits für Login/Registrierung in Supabase prüfen

- [ ] Impressum, Datenschutzerklärung, AVV – rechtlich prüfen lassen
- [ ] Name/Logo/Markenprüfung „TradeFlow“
- [ ] Pilotmarkt und Region
- [ ] Verifizierungsprozess für Betriebe
- [ ] Preismodell
- [ ] Anfrage an einzelne oder mehrere Betriebe?
- [ ] Hosting-Anbieter (Vercel o. a.) – **Freigabe nötig**

## Bekannte Einschränkungen

- Ende-zu-Ende-Tests gegen ein echtes Supabase-Projekt waren in der Entwicklungsumgebung nicht möglich
  (kein Zugriff auf supabase.co). Datenbanklogik ist mit PGlite getestet, Oberfläche mit jsdom/Chrome.
- Ausführende Mitarbeiter sehen bis Sprint 3 (Zuweisungen) keine Aufträge.
- Wird ein Foto hochgeladen und die Zuordnung schlägt danach fehl, kann eine verwaiste Datei im
  privaten Bucket bleiben (selten; Aufräumjob später).

### Demo (`/demo`)

- Daten nur im Browser (`localStorage`), gehen bei „Browserdaten löschen“ verloren.
- Fotos werden nicht gespeichert.
- Statuswechsel, Angebote, Einladungen sind nur angedeutet (deaktivierte Buttons mit Hinweis).
- Demo-Datum ist fest auf 17.11.2026 gesetzt, damit die Termine stabil bleiben.
