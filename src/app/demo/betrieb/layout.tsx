import Link from "next/link";
import { LogOut } from "lucide-react";
import { DemoBanner } from "@/components/brand";
import { CompanyShell } from "@/components/company-shell";
import { DEMO_COMPANY } from "@/lib/demo-data";

export default function DemoCompanyLayout({
  children,
}: LayoutProps<"/demo/betrieb">) {
  return (
    <CompanyShell
      base="/demo/betrieb"
      banner={<DemoBanner />}
      companyName={DEMO_COMPANY.name}
      statusLabel="unverifiziert"
      exitAction={
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-ink"
        >
          <LogOut className="size-3.5" aria-hidden="true" /> Demo verlassen
        </Link>
      }
    >
      {children}
    </CompanyShell>
  );
}
