@AGENTS.md

# TradeFlow – Hinweise für Claude Code

- Produktgrundlage: `docs/MASTERPLAN.md` – vor jeder größeren Phase lesen.
- Aktueller Stand und nächste Schritte: `TASKS.md`. Entscheidungen: `DECISIONS.md`.
- Nur den freigegebenen Sprint umsetzen. Sprint 2 (Supabase, Auth) braucht ausdrückliche Freigabe.
- Benutzeroberfläche auf Deutsch, Bezeichner im Code dürfen Englisch sein.
- Vor jeder Übergabe: `npm run check` (Lint, Typecheck, Tests, Build) und ehrlich berichten:
  Fertig / Getestet / Offen / Nächster Schritt.
- Keine Secrets in Code, Logs oder Repo. Keine kostenpflichtigen Dienste, Deployments oder
  Löschaktionen ohne Freigabe.
- Demo-Daten immer als Demo kennzeichnen.
