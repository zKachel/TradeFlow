import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { PilotBanner, SetupNotice } from "@/components/brand-pilot";
import { CompanyShell } from "@/components/company-shell";
import { LogoutButton } from "@/components/logout-button";
import { getMyCompany, requireUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const VERIFICATION_LABELS: Record<string, string> = {
  unverifiziert: "unverifiziert",
  in_pruefung: "in Prüfung",
  verifiziert: "verifiziert",
  abgelehnt: "nicht verifiziert",
};

async function CompanyGate({ children }: { children: React.ReactNode }) {
  const user = await requireUser("betrieb");
  const company = await getMyCompany();
  if (!company) redirect("/betrieb-einrichten");
  return (
    <CompanyShell
      base="/betrieb"
      banner={<PilotBanner />}
      companyName={company.companyName}
      statusLabel={
        VERIFICATION_LABELS[company.verification] ?? company.verification
      }
      exitAction={
        <div className="space-y-2">
          <p
            className="hidden truncate text-xs text-muted lg:block"
            title={user.email}
          >
            {user.displayName}
          </p>
          {company.role === "inhaber" && (
            <Link
              href="/betrieb/profil"
              className="hidden text-xs font-semibold text-brand-700 hover:underline lg:block"
            >
              Firmenprofil bearbeiten
            </Link>
          )}
          <LogoutButton />
        </div>
      }
    >
      {children}
    </CompanyShell>
  );
}

function ShellSkeleton() {
  return (
    <div aria-busy="true" aria-label="Wird geladen" className="flex flex-1">
      <div className="hidden w-64 border-r border-line bg-surface lg:block" />
      <div className="flex-1 animate-pulse space-y-4 p-8">
        <div className="h-8 w-1/3 rounded-lg bg-line" />
        <div className="h-32 rounded-2xl bg-line/60" />
        <div className="h-64 rounded-2xl bg-line/60" />
      </div>
    </div>
  );
}

export default function CompanyLayout({ children }: LayoutProps<"/betrieb">) {
  if (!isSupabaseConfigured()) {
    return (
      <>
        <PilotBanner />
        <main id="inhalt" className="mx-auto w-full max-w-xl flex-1 px-4 py-12">
          <SetupNotice />
        </main>
      </>
    );
  }
  return (
    <Suspense fallback={<ShellSkeleton />}>
      <CompanyGate>{children}</CompanyGate>
    </Suspense>
  );
}
