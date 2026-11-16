import { Plus } from "lucide-react";
import { DemoBanner, Logo } from "@/components/brand";
import { LinkButton } from "@/components/ui";

export default function CustomerLayout({
  children,
}: LayoutProps<"/demo/kunde">) {
  return (
    <>
      <DemoBanner />
      <header className="sticky top-0 z-30 border-b border-line bg-surface/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
          <Logo href="/demo/kunde" subtitle="Auftraggeber" />
          <LinkButton href="/demo/kunde/anfrage/neu" size="sm">
            <Plus className="size-4" aria-hidden="true" /> Neue Anfrage
          </LinkButton>
        </div>
      </header>
      <main
        id="inhalt"
        className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6"
      >
        {children}
      </main>
    </>
  );
}
