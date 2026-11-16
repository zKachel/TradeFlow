# Supabase einrichten (Testphase)

Diese Anleitung machst du **einmal**. Dauer: ca. 20 Minuten. Kosten: **0 €** (Free-Plan).
Danach funktionieren Registrierung, Login und Speichern auf deinem PC.

> **Wichtig – Schlüssel:** Du brauchst nur die **Project URL** und den **Publishable Key**
> (`sb_publishable_…`). Den **Secret Key** / **service_role** NIEMALS kopieren, nicht in
> Dateien schreiben, nicht in Chats einfügen. TradeFlow braucht ihn nicht.

---

## 1. Projekt anlegen

1. <https://supabase.com> → **Start your project** → mit GitHub oder E-Mail anmelden.
2. **New project**:
   - Organization: deine (Free)
   - Name: `tradeflow-test`
   - Database Password: auf **Generate** klicken und im Passwort-Manager speichern
   - Region: **Central EU (Frankfurt)**
   - Plan: **Free** – keine kostenpflichtigen Add-ons aktivieren
3. Warten, bis das Projekt bereit ist (1–2 Minuten).

## 2. Datenbank-Struktur einspielen

1. Links **SQL Editor** → **New query**.
2. Datei `supabase/migrations/20261116200000_core_schema.sql` aus dem Projekt öffnen,
   **kompletten Inhalt** kopieren, einfügen, **Run**. Erwartet: „Success. No rows returned“.
3. Neue Query → Inhalt von `supabase/migrations/20261116200100_storage_request_photos.sql` → **Run**.
4. Kontrolle: Links **Table Editor** → es gibt `profiles`, `companies`, `company_jobs`,
   `customer_requests` usw. Bei jeder Tabelle steht „RLS enabled“.
   Unter **Storage** gibt es den Bucket `request-photos` mit „Private“.

Reihenfolge einhalten. Jede Datei nur **einmal** ausführen.

## 3. Anmeldung einstellen

**Authentication → URL Configuration**

- Site URL: `http://localhost:3000`
- Redirect URLs → **Add URL**: `http://localhost:3000/**`

**Authentication → Sign In / Providers → Email**

- Email: an
- Confirm email: an _(siehe Hinweis unten zum Testen)_
- Minimum password length: `10`

**Authentication → Emails → Templates**

_Confirm signup_ – im Feld „Message body“ den Link ersetzen durch:

```html
<h2>E-Mail bestätigen</h2>
<p>Bitte bestätige deine Registrierung bei TradeFlow:</p>
<p>
  <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email"
    >E-Mail bestätigen</a
  >
</p>
```

_Reset password_:

```html
<h2>Passwort zurücksetzen</h2>
<p>Du kannst hier ein neues Passwort für TradeFlow festlegen:</p>
<p>
  <a
    href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery"
    >Neues Passwort festlegen</a
  >
</p>
```

(Mit diesen Vorlagen funktionieren die Links auch, wenn du die E-Mail auf dem Handy öffnest.)

### Hinweis: E-Mails in der Testphase

Der eingebaute E-Mail-Versand von Supabase ist stark begrenzt (wenige E-Mails pro Stunde) und
schickt nur an Adressen von Mitgliedern deiner Supabase-Organisation. Für Tests mit mehreren
Konten zwei Möglichkeiten:

- **Einfach (nur lokal testen):** „Confirm email“ vorübergehend **aus**schalten. Dann ist man nach
  der Registrierung direkt angemeldet. **Vor jeder Pilotphase wieder einschalten** (steht in TASKS.md).
- **Richtig (vor dem Pilot):** eigenen E-Mail-Dienst (SMTP) eintragen – Entscheidung später,
  evtl. kostenpflichtig.

## 4. Schlüssel lokal eintragen

1. **Project Settings → API Keys**: „Publishable key“ kopieren (`sb_publishable_…`).
2. **Project Settings → Data API** (oder „API“): „Project URL“ kopieren (`https://xxxx.supabase.co`).
3. Im Projektordner auf deinem PC eine Datei **`.env.local`** anlegen (gleiche Ebene wie
   `package.json`) mit:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxx
```

`.env.local` wird von Git ignoriert und landet nicht auf GitHub. Prüfen mit `git status` –
die Datei darf dort **nicht** auftauchen.

## 5. Starten und testen

```bash
npm install
npm run dev
```

Dann <http://localhost:3000> öffnen und diesen Ablauf testen:

1. **Als Betrieb registrieren** → Betrieb einrichten → Auftrag anlegen → Seite neu laden
   (Auftrag ist noch da) → Auftrag bearbeiten, Status ändern, Notiz schreiben → Verlauf ansehen.
2. Abmelden. **Als Auftraggeber registrieren** (andere E-Mail) → Anfrage mit 1–2 Fotos stellen →
   „Meine Anfragen“ → Fotos sichtbar.
3. **Zugriffsschutz prüfen:** Als Auftraggeber `http://localhost:3000/betrieb` aufrufen → du
   wirst zurück in deinen Bereich geleitet. Als Betrieb siehst du keine Kundenanfragen.
4. **Zweiter Betrieb** (dritte E-Mail) → sieht die Aufträge des ersten Betriebs nicht.
5. Passwort vergessen testen (nur wenn E-Mail-Bestätigung an ist und die E-Mail ankommt).

### Testkonto nachträglich zum Betrieb machen (falls nötig)

Wenn du ein Konto im Supabase-Dashboard unter _Authentication → Users → Add user_ anlegst,
wird es automatisch ein Auftraggeber-Konto. Zum Betrieb machen (SQL Editor):

```sql
update public.profiles set account_type = 'betrieb'
where id = (select id from auth.users where email = 'deine-test-adresse@example.de');
```

## Wenn etwas nicht klappt

| Problem                                  | Lösung                                                                                            |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------- |
| „Die Datenbank ist noch nicht verbunden“ | `.env.local` fehlt oder falsch benannt; danach `npm run dev` neu starten                          |
| „Anmeldedienst nicht erreichbar“         | Project URL prüfen, Internet prüfen, Projekt im Dashboard nicht pausiert?                         |
| Link in E-Mail führt zu „Link ungültig“  | E-Mail-Vorlage aus Schritt 3 prüfen; Link nur einmal verwendbar                                   |
| Fehler beim SQL-Ausführen                | Reihenfolge beachten; nicht doppelt ausführen. Fehlermeldung an Claude schicken (ohne Schlüssel!) |

Free-Projekte werden nach ca. 1 Woche ohne Nutzung pausiert – im Dashboard einfach wieder starten.
