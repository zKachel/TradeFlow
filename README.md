# TradeFlow

Auftragsmarktplatz für Arbeiten rund um Haus, Wohnung und Garten **plus** Betriebssoftware für
Handwerks- und Dienstleistungsbetriebe.

> **Stand: Sprint 2 – geschlossene Testphase.** Login, Datenbank (Supabase) und private Fotos sind
> eingebaut. Nicht öffentlich, nur Testdaten. Die Demo mit erfundenen Daten liegt unter `/demo`.
> Produkt- und Architekturgrundlage: [`docs/MASTERPLAN.md`](docs/MASTERPLAN.md).
> **Supabase einrichten:** [`docs/SUPABASE_SETUP.md`](docs/SUPABASE_SETUP.md).

## Lokal starten

Voraussetzung: **Node.js 20.9 oder neuer** (empfohlen: Node 22 LTS) – prüfen mit `node -v`.

```bash
git clone https://github.com/zKachel/tradeflow.git
cd tradeflow
npm install
npm run dev
```

Dann im Browser öffnen: <http://localhost:3000>

Ohne `.env.local` läuft nur die Demo (`/demo`). Für Login und Speichern zuerst
[`docs/SUPABASE_SETUP.md`](docs/SUPABASE_SETUP.md) durchgehen.

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

## Bereiche

| Pfad                                                | Inhalt                                                         |
| --------------------------------------------------- | -------------------------------------------------------------- |
| `/`                                                 | Startseite                                                     |
| `/registrieren`, `/anmelden`, `/passwort-vergessen` | Konto (Auftraggeber oder Betrieb)                              |
| `/kunde`                                            | Meine Anfragen (echt, nur eigene)                              |
| `/kunde/anfrage/neu`                                | Anfrage stellen mit privaten Fotos                             |
| `/betrieb-einrichten`                               | Firma anlegen (nach Registrierung als Betrieb)                 |
| `/betrieb`                                          | Firmen-Übersicht                                               |
| `/betrieb/auftraege`                                | Eigene Aufträge: anlegen, bearbeiten, Status, Notizen, Verlauf |
| `/betrieb/team`                                     | Team und Rechte                                                |
| `/betrieb/marktplatz`                               | Hinweis: startet in der Pilotphase                             |
| `/betrieb/profil`                                   | Firmenprofil (nur Inhaber)                                     |
| `/demo`                                             | Klickbare Demo mit erfundenen Daten (ohne Login)               |

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
  proxy.ts               Sitzung auffrischen, Anmeldung erzwingen
  app/
    (auth)/              Registrieren, Anmelden, Passwort
    auth/confirm/        Ziel der E-Mail-Links
    kunde/               Auftraggeber (echt) + Server Actions
    betrieb/             Betrieb (echt) + Server Actions
    betrieb-einrichten/  Firma anlegen
    demo/                Demo mit erfundenen Daten
  components/            UI-Bausteine (u. a. request-form.tsx für Demo und echt)
  lib/
    supabase/            Supabase-Clients (nur Publishable Key)
    auth.ts              Nutzer/Firma ermitteln, Kontoart prüfen
    categories.ts        32 Kategorien + Zusatzfelder (datengetrieben)
    request-schema.ts    Validierung Kundenanfrage
    request-submission.ts  Absenden: Doppelschutz, Wiederholen, Entwurf
    image-*.ts           Foto-Prüfung (Browser + Server)
supabase/
  migrations/            Datenbankschema, RLS, Storage (in dieser Reihenfolge einspielen)
  tests/                 Datenbank-/Rechtetests mit PGlite
docs/                    Masterplan, Supabase-Anleitung
TASKS.md / DECISIONS.md  Aufgaben / Architekturentscheidungen
```

## Umgebungsvariablen

Vorlage: [`.env.example`](.env.example). Echte Werte gehören in `.env.local` – diese Datei ist per
`.gitignore` ausgeschlossen und darf nie committet werden. Es wird **nur** der öffentliche
Publishable Key verwendet; der Secret/Service-Role-Key wird nicht gebraucht.
