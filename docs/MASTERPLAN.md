TradeFlow – Masterplan und Entwicklungsauftrag

Version: 1.0
Stand: 16. November 2026
Status: Produktkonzept; keine Funktion gilt ohne Implementierung und Test als fertig.
Sprache: Deutsche Benutzeroberfläche; technische Bezeichner dürfen Englisch sein.

An Claude Code: Lies diese Datei vor Beginn jeder größeren Entwicklungsphase. Sie ist die Produkt- und Architekturgrundlage. Setze nicht alle Funktionen gleichzeitig um. Arbeite in kleinen, getesteten Schritten, dokumentiere Entscheidungen und frage bei unklaren, sicherheitsrelevanten oder kostenpflichtigen Entscheidungen nach.

1. Vision

TradeFlow verbindet zwei Produkte auf einer Plattform:

1. Auftragsmarktplatz: Privatpersonen und gegebenenfalls Unternehmen beschreiben Arbeiten rund um Haus, Wohnung, Grundstück und Garten. Passende Handwerks- und Dienstleistungsbetriebe können Anfragen bearbeiten und Angebote abgeben.
2. Betriebssoftware: Handwerksbetriebe organisieren unabhängig vom Marktplatz auch ihre bereits vorhandenen Aufträge, Mitarbeiter, Termine, Bilder, Dokumente und Aufgaben.

Das zweite Produkt muss bereits Nutzen bieten, bevor viele Marktplatzanfragen existieren. TradeFlow ist kein automatischer Preisgarant und keine Garantie für die fachliche Eignung von Anbietern.

2. Zielgruppen und Plattformen

* Auftraggeber: Privatkunden, später eventuell Hausverwaltungen und gewerbliche Auftraggeber.
* Betriebe: Einzelunternehmer, kleine und mittlere Handwerks- und hausnahe Dienstleistungsbetriebe.
* Mitarbeiter: Büro, Disposition und ausführende Mitarbeiter mit eingeschränkten Rechten.
* Administratoren: Nur zur Plattformmoderation und zum Betrieb notwendige, besonders geschützte Zugriffe.

Geräte und Vertrieb

TradeFlow soll über Website, installierbare Handy-App und installierbare PC-App nutzbar sein.

Phase 1: Responsive Web-App mit PWA-Unterstützung (Installation, wo vom Betriebssystem/Browser unterstützt).

Später: Native iOS-/Android-Apps und gegebenenfalls Desktop-Pakete, falls echte Anforderungen dies rechtfertigen.

PWA-Funktionen und Installationsmöglichkeiten unterscheiden sich nach Gerät und Browser; native Store-Apps sind nicht automatisch durch eine PWA abgedeckt.

Eine zentrale Datenbank, ein gemeinsames Berechtigungsmodell, konsistente Ansichten auf allen Geräten. Mobile-first, aber Desktop-Dashboards für Betriebe besonders gut nutzbar.

3. Kategorien und flexible Anfrageformulare

Breites Angebot statt Beschränkung auf 2–3 Gewerke, aber die technische Umsetzung erfolgt datengetrieben und erweiterbar.

Beispielkategorien (nicht abschließend):

* Bau, Rohbau, Maurerarbeiten, Betonarbeiten
* Dach, Fassade, Dämmung, Fenster, Türen
* Elektro, Sanitär, Heizung, Klima, Lüftung
* Maler, Trockenbau, Fliesen, Bodenbeläge, Tischler/Schreiner
* Küchenmontage, Möbelmontage, Innenausbau
* Garten- und Landschaftsbau, Rasenpflege, Heckenschnitt, Baumpflege
* Zaunbau, Pflasterarbeiten, Terrassenbau
* Reinigung, Entrümpelung, Entsorgung, Umzugshilfe
* Hausmeister- und weitere haushaltsnahe Dienstleistungen
* Sonstiges / noch nicht zugeordnet

Wichtig: Nicht jede Tätigkeit ist rechtlich ein zulassungspflichtiges Handwerk; Kategorien dürfen keine Berechtigung oder Qualifikation suggerieren. Für regulierte Gewerke müssen spätere Verifikationsregeln geprüft werden.

Kundenanfrage – Grundfelder

* Kategorie und gegebenenfalls Unterkategorie
* Titel und verständliche Beschreibung
* PLZ und grobe Ortsangabe; genaue Adresse erst im erforderlichen Prozessschritt
* Gewünschter Zeitraum / Dringlichkeit
* Fotos / optional Dokumente
* Optional Budget und Kontaktdaten, mit angemessener Sichtbarkeit
* Einwilligungs-/Datenschutzhinweise, wo erforderlich

Kategorieabhängige Zusatzfelder

* Maler: Fläche (m²), Innen/Außen, Zustand, Untergrund
* Bodenleger: Fläche, Bodenart, Altbelag entfernen?
* Garten: Grundstücks-/Heckenfläche, Länge/Höhe, Entsorgung?
* Entrümpelung: Räume, ungefähres Volumen, Etage, Aufzug, Entsorgung?
* Dach: Dachtyp, grobe Fläche, Problemart (keine Ferndiagnose)
* Sanitär: Art der Arbeit, vorhandene Anschlüsse, gewünschter Termin

Felder per konfigurierbarem Schema verwalten, nicht für jede Kategorie eine komplett separate Seite hardcoden.

Bei fehlenden Angaben sinnvolle Rückfragen stellen.

KI darf unterstützen, aber nicht ohne menschliche Prüfung verbindliche Preise, sicherheitsrelevante Diagnosen oder Zusagen erzeugen.

4. Nutzerrollen und Zugriffsrechte

Auftraggeber

* Eigene Anfragen erstellen, bearbeiten, zurückziehen und einsehen.
* Eigene Angebote und Nachrichten sehen.
* Keine Einsicht in fremde Anfragen oder interne Firmendaten.

Firmeninhaber / Admin

* Firma anlegen und Verifizierungsstatus sehen.
* Mitarbeiter einladen, Rollen zuweisen und Zugriffe widerrufen.
* Eigene interne Aufträge anlegen und organisieren.
* Zugewiesene oder freigegebene Marktplatzanfragen bearbeiten.
* Angebote verwalten und Teamübersicht sehen.

Büromitarbeiter / Disposition

* Je nach Berechtigung Aufträge, Termine, Kundenkommunikation und Zuweisungen bearbeiten.
* Keine Änderung von Inhaberschaft, Abrechnung oder kritischen Einstellungen ohne Berechtigung.

Ausführende Mitarbeiter

* Nur ihnen freigegebene Aufträge, Termine, Notizen und Dateien sehen.
* Status, Arbeitsnotizen und Bilder ergänzen, soweit berechtigt.
* Keine unbeschränkte Einsicht in sämtliche Kunden- oder Firmendaten.

Technische Pflicht: Mandantentrennung auf Datenbankebene, nicht nur durch versteckte UI. Rechte serverseitig prüfen, Supabase Row Level Security (RLS) einsetzen und testen. Einladungstokens sicher, einmalig und zeitlich begrenzt gestalten.

5. Auftragslebenszyklus

Marktplatzauftrag

Entwurf → Eingereicht → Prüfung/Matching → Für passende Betriebe sichtbar → Angebot(e) → Auftrag vergeben → In Arbeit → Abgeschlossen / Storniert

Interner Firmenauftrag

Neu → Geplant → In Arbeit → Erledigt / Storniert

Trennung: Interne Firmenaufträge sind niemals automatisch öffentlich. Eine explizite Aktion mit Berechtigungsprüfung wäre nötig, um sie zu veröffentlichen.

Alle Statuswechsel mit Zeitstempel und verantwortlichem Nutzer protokollieren.

Matching (später)

* Gewerke, Einsatzradius, ungefähre Entfernung, Kapazität und weitere erlaubte Kriterien.
* Keine erfundenen Verfügbarkeiten oder Qualifikationen.
* Zunächst einfache regelbasierte Zuordnung; komplexe KI erst bei erkennbarem Mehrwert.

6. Geplante Produktfunktionen

MVP (erste nutzbare interne Version)

1. Responsive Startseite mit zwei klaren Einstiegen: Auftraggeber / Betrieb.
2. Registrierung, Anmeldung, Passwort-Reset und Rollenmodell.
3. Firmenprofil mit Gewerken, Einsatzgebiet und Verifizierungsstatus unverifiziert.
4. Kundenanfrage mit Bildern und mindestens einigen dynamischen Kategoriefragen.
5. Sicherer Zugriff auf eigene Anfragen.
6. Firmendashboard und interne Auftragsverwaltung (manuelle Auftragserstellung).
7. Mitarbeiter einladen und einfache Auftragszuweisung.
8. Übersicht mit Status, Filter, Terminen und Notizen.
9. Grundlegende Vermittlung: geeignete Anfragen für freigeschaltete Betriebe anzeigen, ohne Daten unnötig offenzulegen.
10. Ereignisprotokolle, Fehlermeldungen und grundlegende Tests.

Nach MVP

* Angebotsentwürfe, Annahme/Ablehnung und strukturierter Vergleich
* Nachrichten / Chat, Benachrichtigungen, Kalender
* Dateiverwaltung, Fotochronik, Checklisten
* Firmenverifizierung mit definiertem Prüfprozess
* KI-Rückfragen und KI-Zusammenfassungen
* Dokumentenvorlagen und gegebenenfalls Rechnungsfunktionen nach fachlicher/rechtlicher Prüfung
* Abonnements und Rechnungsstellung
* Bewertungen mit Schutz gegen Missbrauch
* Mobile Push, Offline-Unterstützung, native Apps bei Bedarf

Ausdrücklich nicht im ersten Sprint

* Zahlungsabwicklung, Live-Chat, automatische Rechnungsstellung
* KI-generierte verbindliche Angebote
* Vollautomatische Firmenverifizierung
* Komplexes KI-Matching
* Öffentliche Produktion mit echten Kundendaten ohne Sicherheitsprüfung

7. Technische Architektur – Startempfehlung

* Frontend/Backend: Next.js (aktueller stabiler Stand), TypeScript, React
* UI: Tailwind CSS, zugängliche wiederverwendbare Komponenten
* Datenbank/Auth/Storage: Supabase (PostgreSQL, Auth, Storage)
* Hosting: Vercel oder geeignete Alternative, Entscheidung nach Bedarf/Kosten
* Versionsverwaltung: Git und GitHub
* Validierung: Serverseitige Schema-Validierung (z. B. Zod)
* Tests: Unit-/Integrationstests für Rechte und Kernlogik, End-to-End-Smoke-Tests für Hauptabläufe
* PWA: Manifest, Icons, installierbare Oberfläche, sinnvoller Offline-Fallback; keine falschen Versprechen zur Plattformunterstützung

Kein unnötiger Microservice-Aufbau. Saubere, modularisierte Monolith-Architektur bevorzugen.

Versionsstände der Bibliotheken beim Einrichten prüfen; keine ungetesteten Annahmen zu APIs.

Mögliche Datenmodelle (zunächst entwerfen, dann prüfen)

* users/profiles
* companies
* company_memberships
* company_invites
* service_categories
* category_fields
* customer_requests
* request_attachments
* company_jobs
* job_assignments
* job_notes
* offers
* audit_events

Jede relevante Tabelle erhält eindeutige IDs, Zeitstempel und passende Fremdschlüssel. Klare Eigentümerschaft/Mandanten-ID.

Anfragen und Firmenaufträge bewusst getrennt modellieren oder eine sauber begründete gemeinsame Struktur wählen. Migrationsdateien versionieren.

8. Sicherheit, Datenschutz und rechtliche Prüfung

Vor öffentlicher Freigabe verpflichtend:

* DSGVO-konformes Datenschutzkonzept, Datenschutzhinweise, Impressum, Auftragsverarbeitungsverträge und Lösch-/Auskunftsprozesse fachlich prüfen.
* Firmendaten und Kundendaten nur für Berechtigte sichtbar; minimale Datensammlung.
* Serverseitige Autorisierung auf jeder geschützten Operation; RLS und Negativtests.
* Dateien in privaten Buckets, zeitlich begrenzte signierte URLs, Dateityp-/Größenlimits, Schutz vor schädlichen Uploads.
* API-Schlüssel und Service-Role-Key nur serverseitig in sicheren Umgebungsvariablen, niemals in Browsercode oder Git.
* Rate-Limits, Spam-/Missbrauchsschutz, sichere Authentifizierung, Monitoring, Backups und Wiederherstellungstests.
* Verifizierungsabzeichen nur nach tatsächlicher Prüfung; klare Trennung von Identität, Firmenexistenz und fachlicher Zulassung.
* Plattformregeln, Haftungs-/Verbraucherfragen, Impressumspflichten, Handwerksrecht und mögliche Plattformpflichten vor Launch prüfen lassen.
* Keine echte Zahlung, keine sensiblen Dokumente und keine produktiven Kundendaten in der Demo.

9. UX- und Designregeln

* Modern, ruhig, vertrauenswürdig, professionell; keine überladenen Dashboards.
* Mobile-first, aber starke Desktop-Ansichten.
* Deutsche Texte, verständliche Fachbegriffe, große klare Aktionen.
* Auftrag erstellen in möglichst wenigen Schritten, Fortschritt sichtbar.
* Firmen können zwischen Marktplatzanfragen und eigenen Aufträgen klar unterscheiden.
* Leere Zustände, Ladezustände, Fehlerzustände und Formularvalidierung gestalten.
* Barrierearme Bedienung: Tastatur, Kontrast, Beschriftungen, Fokus und responsive Darstellung.
* Demo-Daten immer sichtbar als Demo kennzeichnen; keine erfundenen Bewertungen, Kunden oder Aufträge als echt darstellen.

10. Geschäftsmodell (Hypothesen, keine beschlossenen Preise)

* Auftraggeber zunächst kostenlos.
* Firmen-Basiszugang kostenlos oder günstige Einstiegsstufe.
* Pro-Abo als Hypothese ca. 39 €/Monat; Business ca. 99 €/Monat.
* Wertversprechen: eigene Aufträge und Team verwalten, später zusätzliche passende Kundenanfragen.
* Keine garantierten Leads, Umsätze oder Auftragszahlen versprechen.
* Zahlungs- und Preisgestaltung erst nach Gesprächen mit echten Betrieben validieren.

11. Umsetzung in kurzen, überprüfbaren Phasen

Sprint 0 – Projektstart (sofort)

* Repository und Next.js/TypeScript/Tailwind-Projekt initialisieren.
* README, .env.example, .gitignore, Formatierung und Linting.
* Projektstruktur und Architekturentscheidung dokumentieren.
* Lokale Startanleitung schreiben.

Abnahme: Projekt startet lokal; keine Secrets eingecheckt; lint und build erfolgreich.

Sprint 1 – Klickbare Demo

* Landingpage mit den beiden Nutzerwegen.
* Kunden-Dashboard, Firmen-Dashboard, interne Auftragsliste.
* Anfrageformular mit Kategorieauswahl und dynamischen Feldern.
* Beispielaufträge nur als Demo; Navigation funktioniert.
* Responsive PWA-Grundgerüst.

Abnahme: Auf Handygröße und Desktop testbar; alle Hauptansichten erreichbar; keine irreführenden Echtdaten.

Sprint 2 – Echte Kernfunktionalität

* Supabase-Projekt und sichere Authentifizierung.
* Datenmodell/Migrationen und RLS-Policies.
* Eigene Kundenanfragen erstellen/ansehen; private Bilduploads.
* Eigene Firmenaufträge erstellen, bearbeiten und filtern.
* Negativtests: Nutzer A darf Daten von Nutzer B nicht lesen/ändern.

Abnahme: Daten bleiben nach Neuladen erhalten; Zugriffsschutz nachweislich getestet.

Sprint 3 – Betriebe und Mitarbeiter

* Firmenprofile und Mitgliedschaften.
* Einladungen, Rollen, Zuweisungen und Terminübersicht.
* Rechteprüfung für Inhaber, Büro und Mitarbeiter.

Abnahme: Mitarbeiter sehen nur freigegebene Aufträge; Rollenänderungen wirken serverseitig.

Sprint 4 – Erste Vermittlung und geschlossene Pilotphase

* Freigabe-/Matching-Regeln und Anfragenliste für passende Betriebe.
* Datenschutzfreundliche Kontakt-/Angebotsanbahnung.
* Moderations- und Missbrauchsgrundlagen.
* Sicherheits-, Nutzbarkeits- und Lasttests im angemessenen Umfang.
* Kleine Testgruppe mit ausdrücklicher Zustimmung; kein unkontrollierter öffentlicher Launch.

Abnahme: Vollständiger Testablauf vom Auftraggeber zur Firma; dokumentierte offene Risiken.

Zeitrahmen: Schnelle Demo gegebenenfalls in 1–3 konzentrierten Tagen; funktionaler interner Prototyp in Wochen. Dies sind Zielwerte, keine Zusagen. Sicherheit, Testaufwand und Umfang bestimmen den tatsächlichen Termin.

12. Arbeitsregeln für Claude Code

1. Zuerst Repository inspizieren und Ist-Zustand zusammenfassen. Bestehenden Code nicht blind überschreiben.
2. Vor jedem Schritt kurz erklären: Ziel, betroffene Dateien, Risiken und Test.
3. Kleine Änderungen liefern; nicht 20 Features in einem Schritt implementieren.
4. Nach jeder Änderung geeignete Tests, Linting und Build ausführen und Ergebnisse ehrlich nennen.
5. Fehler nicht verstecken oder Tests ohne Begründung deaktivieren.
6. Keine Funktionen als fertig markieren, solange sie nur gemockt sind.
7. Keine kostenpflichtigen Services, Deployments, Löschaktionen oder externen Veröffentlichungen ohne Freigabe.
8. Keine API-Schlüssel in Chat-Antworten, Logs, Frontendcode oder Repository schreiben.
9. Bei sicherheitskritischen Fragen die sichere Option wählen und den Eigentümer informieren.
10. Vor größeren Architekturänderungen Alternativen mit Vor-/Nachteilen darstellen.
11. Bei jeder Übergabe berichten: Fertig / Getestet / Offen / Nächster Schritt.
12. Eine TASKS.md mit Checkboxen und eine DECISIONS.md mit Architekturentscheidungen pflegen.
13. Keine unnötigen Abhängigkeiten oder überkomplizierte Architektur.
14. Benutzeroberfläche standardmäßig auf Deutsch.
15. Die gesamte Produktvision beachten, aber immer nur den aktuell freigegebenen Sprint umsetzen.

13. Zusammenarbeit mit ChatGPT und Claude

* Diese Datei ist die gemeinsame Produktquelle. Ergänzungen und Änderungen werden versioniert.
* Claude Code programmiert im Repository und dokumentiert den aktuellen Stand in TASKS.md, DECISIONS.md und README.
* ChatGPT unterstützt bei Priorisierung, UX, Testfällen, Produktentscheidungen und Review von Berichten/Dateien.
* Die beiden Assistenten sind nicht automatisch synchronisiert. Relevante Änderungen müssen über GitHub/Dateien oder bewusst geteilte Statusberichte übermittelt werden.
* Claude Max ist nicht dasselbe wie API-Guthaben für eigene Produktfunktionen. Für KI-Funktionen in TradeFlow später separate API-Kosten und Limits planen.

14. Erste konkrete Anweisung an Claude Code

Beginne jetzt ausschließlich mit Sprint 0 und Sprint 1.

1. Prüfe, ob im Projekt bereits Dateien vorhanden sind.
2. Lege eine saubere Next.js-/TypeScript-/Tailwind-Struktur an, ohne bestehende Arbeit zu zerstören.
3. Implementiere eine hochwertige responsive Landingpage und klickbare Kunden-/Firmen-Dashboards.
4. Erstelle ein dynamisches Demo-Auftragsformular mit den Kategorien aus Abschnitt 3.
5. Zeige Firmenaufträge und Marktplatzanfragen in klar getrennten Demo-Ansichten.
6. Ergänze eine grundlegende PWA-Konfiguration.
7. Schreibe TASKS.md, DECISIONS.md und die lokalen Startanweisungen.
8. Führe Lint/Build aus, behebe Fehler und gib mir anschließend den lokalen Startbefehl.
9. Stoppe vor echter Authentifizierung, Supabase-Anbindung, Deployment oder Kosten und hole meine Freigabe für Sprint 2 ein.

Ergebnis der ersten Session: Eine lokal startbare, auf Handy und PC gut bedienbare Demo, keine scheinbar fertige Produktionsplattform.

15. Offene Entscheidungen (nicht eigenmächtig erfinden)

* Name/Logo/Markenprüfung für „TradeFlow“.
* Genauer Pilotmarkt und anfängliche geografische Reichweite.
* Firmenverifizierungsprozess und erforderliche Nachweise.
* Rechtliche und betriebliche Verantwortlichkeiten der Vermittlung.
* Konkrete Preismodelle und Limits.
* Ob und wann native App-Store-Versionen nötig sind.
* Ob Kunden eine Anfrage an einzelne Betriebe oder mehrere geeignete Betriebe senden können.

Grundsatz: Früh funktionierende Software bauen, mit realen Nutzern validieren und Sicherheit niemals als nachträgliche Kosmetik behandeln.