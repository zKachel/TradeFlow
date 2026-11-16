# TradeFlow

Auftragsmarktplatz für Arbeiten rund um Haus, Wohnung und Garten **plus** Betriebssoftware für
Handwerks- und Dienstleistungsbetriebe.

> **Stand: Sprint 0 + 1 – klickbare Demo.** Keine Anmeldung, keine Datenbank, keine echten Daten.
> Alle Betriebe, Kunden und Aufträge sind erfunden und als Demo gekennzeichnet.
> Produkt- und Architekturgrundlage: [`docs/MASTERPLAN.md`](docs/MASTERPLAN.md).

## Lokal starten

Voraussetzung: **Node.js 20.9 oder neuer** (empfohlen: Node 22 LTS) – prüfen mit `node -v`.

```bash
git clone https://github.com/zKachel/tradeflow.git
cd tradeflow
npm install
npm run dev
```

Dann im Browser öffnen: <http://localhost:3000>

Auf dem Handy testen (gleiches WLAN): `npm run dev -- -H 0.0.0.0` und dann
`http://<IP-deines-PCs>:3000` auf dem Handy öffnen.

## Befehle

| Befehl              | Zweck                                     |
| ------------------- | ----------------------------------------- |
| `npm run dev`       | Entwicklungsserver                        |
| `npm run build`     | Produktions-Build                         |
| `npm start`         | Produktions-Build starten (nach `build`)  |
| `npm run lint`      | ESLint                                    |
| `npm run typecheck` | TypeScript-Prüfung                        |
| `npm test`          | Unit-Tests (Vitest)                       |
| `npm run format`    | Code formatieren (Prettier)               |
| `npm run check`     | Lint + Typecheck + Tests + Build in einem |

## Was die Demo zeigt

| Pfad                  | Inhalt                                                                  |
| --------------------- | ----------------------------------------------------------------------- |
| `/`                   | Startseite mit zwei Einstiegen: Auftraggeber / Betrieb                  |
| `/kunde`              | Kunden-Dashboard „Meine Anfragen“                                       |
| `/kunde/anfrage/neu`  | Anfrageformular in 4 Schritten, 30+ Kategorien, dynamische Zusatzfragen |
| `/betrieb`            | Firmen-Übersicht: Kennzahlen, Termine heute, nicht zugewiesene Aufträge |
| `/betrieb/auftraege`  | Eigene (interne) Aufträge mit Filter, Suche und „Auftrag anlegen“       |
| `/betrieb/marktplatz` | Marktplatz-Anfragen – klar getrennt, ohne Kontaktdaten                  |
| `/betrieb/team`       | Team und Rollen-/Rechteübersicht                                        |
| `/offline`            | Offline-Seite der PWA                                                   |

In der Demo selbst erstellte Anfragen und Aufträge werden nur im eigenen Browser
(`localStorage`) gespeichert. Fotos werden nur als Vorschau gezeigt, nicht hochgeladen.

## Installation als App (PWA)

Nach `npm run build && npm start` (Service Worker ist nur im Produktionsmodus aktiv):

- **Android / Chrome:** Menü → „App installieren“ bzw. „Zum Startbildschirm hinzufügen“.
- **iPhone / Safari:** Teilen → „Zum Home-Bildschirm“.
- **PC / Chrome oder Edge:** Installieren-Symbol in der Adressleiste.

Die Möglichkeiten unterscheiden sich je nach Gerät und Browser. Eine PWA ersetzt keine App-Store-App.
Für die Installation auf anderen Geräten braucht die App HTTPS (also ein Deployment) – lokal geht
es nur über `localhost`.

## Projektstruktur

```
src/
  app/                 Seiten (Next.js App Router)
    kunde/             Bereich Auftraggeber
    betrieb/           Bereich Betrieb
    manifest.ts        PWA-Manifest
  components/          Wiederverwendbare UI-Bausteine
  lib/
    categories.ts      Kategorien + Zusatzfelder (datengetrieben)
    request-schema.ts  Validierung Kundenanfrage (Zod) + Rückfragen + Foto-Regeln
    job-schema.ts      Validierung interner Auftrag
    types.ts           Domänentypen und Status
    demo-data.ts       Erfundene Demo-Daten
    demo-store.ts      Demo-Speicher im Browser (wird in Sprint 2 ersetzt)
public/sw.js           Service Worker (Offline-Fallback)
scripts/               Hilfsskripte (Icons erzeugen)
docs/MASTERPLAN.md     Produktgrundlage
TASKS.md               Aufgaben mit Status
DECISIONS.md           Architekturentscheidungen
```

## Umgebungsvariablen

Für die Demo nicht nötig. Vorlage: [`.env.example`](.env.example). Echte Werte gehören in
`.env.local` – diese Datei ist per `.gitignore` ausgeschlossen und darf nie committet werden.
