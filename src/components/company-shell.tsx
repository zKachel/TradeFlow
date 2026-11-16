"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { ClipboardList, Inbox, LayoutDashboard, Users } from "lucide-react";
import { Logo } from "./brand";

const NAV = [
  {
    href: "",
    label: "Übersicht",
    short: "Übersicht",
    icon: LayoutDashboard,
    section: "own",
  },
  {
    href: "/auftraege",
    label: "Eigene Aufträge",
    short: "Aufträge",
    icon: ClipboardList,
    section: "own",
  },
  {
    href: "/team",
    label: "Team",
    short: "Team",
    icon: Users,
    section: "own",
  },
  {
    href: "/marktplatz",
    label: "Marktplatz-Anfragen",
    short: "Marktplatz",
    icon: Inbox,
    section: "market",
  },
] as const;

function isActive(pathname: string, base: string, href: string) {
  return href === "" ? pathname === base : pathname.startsWith(base + href);
}

export interface CompanyShellProps {
  children: ReactNode;
  /** Basis-Pfad: "/betrieb" (echt) oder "/demo/betrieb" (Demo). */
  base: string;
  banner: ReactNode;
  companyName: string;
  statusLabel: string;
  /** Aktion unten in der Seitenleiste / oben rechts mobil (z. B. Abmelden-Formular). */
  exitAction: ReactNode;
}

export function CompanyShell({
  children,
  base,
  banner,
  companyName,
  statusLabel,
  exitAction,
}: CompanyShellProps) {
  const pathname = usePathname();

  return (
    <>
      {banner}
      <div className="flex flex-1">
        {/* Desktop-Seitenleiste */}
        <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-line bg-surface lg:flex">
          <div className="flex h-16 items-center px-5">
            <Logo href={base} subtitle="Betrieb" />
          </div>
          <nav
            aria-label="Betriebsnavigation"
            className="flex-1 space-y-6 px-3 pt-4"
          >
            <NavGroup title="Mein Betrieb">
              {NAV.filter((n) => n.section === "own").map((n) => (
                <SideLink
                  key={n.href}
                  {...n}
                  href={base + n.href}
                  active={isActive(pathname, base, n.href)}
                />
              ))}
            </NavGroup>
            <NavGroup title="Neue Kunden">
              {NAV.filter((n) => n.section === "market").map((n) => (
                <SideLink
                  key={n.href}
                  {...n}
                  href={base + n.href}
                  active={isActive(pathname, base, n.href)}
                  market
                />
              ))}
            </NavGroup>
          </nav>
          <div className="m-3 rounded-xl bg-canvas p-3 text-sm">
            <p className="leading-snug font-semibold">{companyName}</p>
            <p className="mt-1 text-xs text-muted">Status: {statusLabel}</p>
            <div className="mt-3">{exitAction}</div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Mobile Kopfzeile */}
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-surface/90 px-4 backdrop-blur lg:hidden">
            <Logo href={base} subtitle="Betrieb" />
            {exitAction}
          </header>

          <main
            id="inhalt"
            className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-28 sm:px-6 lg:px-8 lg:pt-8 lg:pb-12"
          >
            {children}
          </main>
        </div>
      </div>

      {/* Mobile Tab-Leiste */}
      <nav
        aria-label="Betriebsnavigation"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      >
        {NAV.map((n) => {
          const active = isActive(pathname, base, n.href);
          return (
            <Link
              key={n.href}
              href={base + n.href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold ${
                active
                  ? n.section === "market"
                    ? "text-accent-600"
                    : "text-brand-700"
                  : "text-muted"
              }`}
            >
              <n.icon className="size-5" aria-hidden="true" />
              {n.short}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

function NavGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-1 px-3 text-[11px] font-semibold tracking-wider text-muted uppercase">
        {title}
      </p>
      <ul className="space-y-0.5">{children}</ul>
    </div>
  );
}

function SideLink({
  href,
  label,
  icon: Icon,
  active,
  market,
}: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  active: boolean;
  market?: boolean;
}) {
  return (
    <li>
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
          active
            ? market
              ? "bg-accent-50 text-accent-600"
              : "bg-brand-50 text-brand-700"
            : "text-muted hover:bg-canvas hover:text-ink"
        }`}
      >
        <Icon className="size-5" aria-hidden="true" />
        {label}
      </Link>
    </li>
  );
}
