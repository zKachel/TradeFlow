import { Logo } from "@/components/brand";
import { PilotBanner, SetupNotice } from "@/components/brand-pilot";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <PilotBanner />
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-16 max-w-md items-center px-4">
          <Logo />
        </div>
      </header>
      <main
        id="inhalt"
        className="mx-auto w-full max-w-md flex-1 px-4 py-8 sm:py-12"
      >
        {!isSupabaseConfigured() && (
          <div className="mb-6">
            <SetupNotice />
          </div>
        )}
        {children}
      </main>
    </>
  );
}
