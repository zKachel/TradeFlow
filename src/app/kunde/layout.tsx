import { Plus } from "lucide-react";
import { Suspense } from "react";
import { Logo } from "@/components/brand";
import { PilotBanner, SetupNotice } from "@/components/brand-pilot";
import { LogoutButton } from "@/components/logout-button";
import { LinkButton } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/** Prüft serverseitig Anmeldung und Kontoart, bevor Inhalte gezeigt werden. */
async function CustomerGate({ children }: { children: React.ReactNode }) {
  await requireUser("kunde");
  return <>{children}</>;
}

async function UserName() {
  const user = await requireUser("kunde");
  return (
    <span className="hidden max-w-40 truncate text-sm text-muted sm:inline">
      {user.displayName}
    </span>
  );
}

export default function CustomerLayout({ children }: LayoutProps<"/kunde">) {
  const configured = isSupabaseConfigured();
  return (
    <>
      <PilotBanner />
      <header className="sticky top-0 z-30 border-b border-line bg-surface/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between gap-3 px-4 sm:px-6">
          <Logo href="/kunde" subtitle="Auftraggeber" />
          {configured && (
            <div className="flex items-center gap-3">
              <Suspense fallback={null}>
                <UserName />
              </Suspense>
              <LogoutButton />
              <LinkButton href="/kunde/anfrage/neu" size="sm">
                <Plus className="size-4" aria-hidden="true" />{" "}
                <span className="hidden sm:inline">Neue Anfrage</span>
                <span className="sm:hidden">Neu</span>
              </LinkButton>
            </div>
          )}
        </div>
      </header>
      <main
        id="inhalt"
        className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6"
      >
        {configured ? (
          <Suspense
            fallback={
              <div
                aria-busy="true"
                aria-label="Wird geladen"
                className="h-96 animate-pulse rounded-2xl bg-line/60"
              />
            }
          >
            <CustomerGate>{children}</CustomerGate>
          </Suspense>
        ) : (
          <SetupNotice />
        )}
      </main>
    </>
  );
}
