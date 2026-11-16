@AGENTS.md

# TradeFlow – Hinweise für Claude Code

- Produktgrundlage: `docs/MASTERPLAN.md` – vor jeder größeren Phase lesen.
- Aktueller Stand und nächste Schritte: `TASKS.md`. Entscheidungen: `DECISIONS.md`.
- Nur den freigegebenen Sprint umsetzen. Sprint 2 ist umgesetzt; Sprint 3 (Einladungen, Rollen, Zuweisungen) braucht Freigabe.
- Datenbank: neue Änderungen immer als NEUE Migration in `supabase/migrations/` + Tests in `supabase/tests/`.
- Kein Service-Role-Key. Alle Zugriffe mit Nutzersitzung, RLS ist maßgeblich.
- Benutzeroberfläche auf Deutsch, Bezeichner im Code dürfen Englisch sein.
- Vor jeder Übergabe: `npm run check` (Lint, Typecheck, Tests, Build) und ehrlich berichten:
  Fertig / Getestet / Offen / Nächster Schritt.
- Keine Secrets in Code, Logs oder Repo. Keine kostenpflichtigen Dienste, Deployments oder
  Löschaktionen ohne Freigabe.
- Demo-Daten immer als Demo kennzeichnen.
