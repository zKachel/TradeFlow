import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createCompanyAction } from "@/app/betrieb/actions";
import { Logo } from "@/components/brand";
import { PilotBanner, SetupNotice } from "@/components/brand-pilot";
import { CompanyForm } from "@/components/company-form";
import { LogoutButton } from "@/components/logout-button";
import { getMyCompany, requireUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata: Metadata = { title: "Betrieb einrichten" };

async function Onboarding() {
  const user = await requireUser("betrieb");
  if (await getMyCompany()) redirect("/betrieb");
  return (
    <>
      <p className="text-sm font-medium text-muted">
        Willkommen, {user.displayName}
      </p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
        Betrieb einrichten
      </h1>
      <p className="mt-2 mb-6 text-muted">
        Danach können Sie sofort Ihre eigenen Aufträge anlegen. Ihr Profil
        startet als „unverifiziert“.
      </p>
      <CompanyForm action={createCompanyAction} submitLabel="Betrieb anlegen" />
    </>
  );
}

export default function OnboardingPage() {
  return (
    <>
      <PilotBanner />
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-16 max-w-2xl items-center justify-between px-4">
          <Logo />
          {isSupabaseConfigured() && <LogoutButton />}
        </div>
      </header>
      <main id="inhalt" className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        {isSupabaseConfigured() ? (
          <Suspense
            fallback={
              <div
                aria-busy="true"
                className="h-96 animate-pulse rounded-2xl bg-line/60"
              />
            }
          >
            <Onboarding />
          </Suspense>
        ) : (
          <SetupNotice />
        )}
      </main>
    </>
  );
}
