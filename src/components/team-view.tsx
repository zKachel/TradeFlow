import { Check, Minus, UserPlus } from "lucide-react";
import { ROLE_LABELS, type EmployeeRole } from "@/lib/types";
import { Card, DemoTag, PageHeader } from "@/components/ui";

export interface TeamMember {
  id: string;
  name: string;
  role: EmployeeRole;
  openJobs?: number;
  isDemo?: boolean;
  isMe?: boolean;
}

const PERMISSIONS: {
  label: string;
  roles: Record<EmployeeRole, boolean | "teil">;
}[] = [
  {
    label: "Alle Aufträge sehen",
    roles: { inhaber: true, buero: true, mitarbeiter: false },
  },
  {
    label: "Nur zugewiesene Aufträge sehen",
    roles: { inhaber: true, buero: true, mitarbeiter: true },
  },
  {
    label: "Aufträge anlegen und zuweisen",
    roles: { inhaber: true, buero: true, mitarbeiter: false },
  },
  {
    label: "Status, Notizen und Fotos ergänzen",
    roles: { inhaber: true, buero: true, mitarbeiter: "teil" },
  },
  {
    label: "Marktplatz-Anfragen bearbeiten",
    roles: { inhaber: true, buero: "teil", mitarbeiter: false },
  },
  {
    label: "Mitarbeiter einladen / entfernen",
    roles: { inhaber: true, buero: false, mitarbeiter: false },
  },
  {
    label: "Abrechnung und Firmeneinstellungen",
    roles: { inhaber: true, buero: false, mitarbeiter: false },
  },
];

export function TeamView({
  members,
  inviteHint,
}: {
  members: TeamMember[];
  inviteHint: string;
}) {
  return (
    <>
      <PageHeader
        title="Team"
        description="Wer im Betrieb welche Aufträge und Daten sehen darf."
        action={
          <div className="flex flex-col items-stretch gap-1 sm:items-end">
            <button
              type="button"
              disabled
              aria-describedby="einladen-hinweis"
              className="inline-flex h-11 cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-brand-700/40 px-4 font-semibold text-white"
            >
              <UserPlus className="size-4" aria-hidden="true" /> Mitarbeiter
              einladen
            </button>
            <span id="einladen-hinweis" className="text-xs text-muted">
              {inviteHint}
            </span>
          </div>
        }
      />

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {members.map((e) => {
          const initials = e.name
            .split(/\s+/)
            .map((p) => p[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();
          return (
            <li key={e.id}>
              <Card className="flex items-center gap-3 p-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700">
                  {initials}
                </span>
                <div className="min-w-0">
                  <p className="flex items-center gap-2 truncate font-semibold">
                    {e.name} {e.isDemo && <DemoTag />}
                    {e.isMe && (
                      <span className="text-xs font-medium text-muted">
                        (Sie)
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-muted">{ROLE_LABELS[e.role]}</p>
                  {e.openJobs !== undefined && (
                    <p className="text-xs text-muted">
                      {e.openJobs === 1
                        ? "1 offener Auftrag"
                        : `${e.openJobs} offene Aufträge`}
                    </p>
                  )}
                </div>
              </Card>
            </li>
          );
        })}
      </ul>

      <h2 className="mt-10 mb-3 font-semibold">Rollen und Rechte</h2>
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[34rem] text-sm">
          <caption className="sr-only">Rechte je Rolle</caption>
          <thead>
            <tr className="border-b border-line text-left">
              <th scope="col" className="p-3 font-semibold">
                Recht
              </th>
              {(Object.keys(ROLE_LABELS) as EmployeeRole[]).map((r) => (
                <th
                  key={r}
                  scope="col"
                  className="p-3 text-center font-semibold"
                >
                  {ROLE_LABELS[r]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERMISSIONS.map((p) => (
              <tr key={p.label} className="border-b border-line last:border-0">
                <th scope="row" className="p-3 text-left font-normal">
                  {p.label}
                </th>
                {(Object.keys(ROLE_LABELS) as EmployeeRole[]).map((r) => (
                  <td key={r} className="p-3 text-center">
                    {p.roles[r] === true ? (
                      <Check
                        className="mx-auto size-4 text-brand-500"
                        aria-label="Ja"
                      />
                    ) : p.roles[r] === "teil" ? (
                      <span className="text-xs font-medium text-amber-700">
                        je nach Freigabe
                      </span>
                    ) : (
                      <Minus
                        className="mx-auto size-4 text-slate-300"
                        aria-label="Nein"
                      />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <p className="mt-3 text-xs text-muted">
        Ab Sprint 2/3 werden diese Rechte serverseitig in der Datenbank (Row
        Level Security) erzwungen – nicht nur in der Oberfläche.
      </p>
    </>
  );
}
