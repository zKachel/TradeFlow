import Link from "next/link";
import { Info } from "lucide-react";

export function LogoMark({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#0f5045" />
      <path d="M8 10h16v3.2h-6.4V24h-3.2V13.2H8z" fill="#fff" />
      <path d="M19.2 18.4h4.8v3.2h-4.8z" fill="#dd7428" />
    </svg>
  );
}

export function Logo({
  href = "/",
  subtitle,
}: {
  href?: string;
  subtitle?: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5"
      aria-label="TradeFlow – Startseite"
    >
      <LogoMark />
      <span className="flex flex-col leading-none">
        <span className="text-[17px] font-bold tracking-tight">TradeFlow</span>
        {subtitle && (
          <span className="mt-0.5 text-xs font-medium text-muted">
            {subtitle}
          </span>
        )}
      </span>
    </Link>
  );
}

export function DemoBanner() {
  return (
    <div
      role="note"
      className="flex items-center justify-center gap-2 bg-brand-900 px-4 py-1.5 text-center text-xs text-white/90"
    >
      <Info className="size-3.5 shrink-0" aria-hidden="true" />
      <span>
        <strong className="font-semibold text-white">Demo-Version</strong> ·
        Alle Betriebe, Kunden und Aufträge sind erfunden. Bitte keine echten
        Daten eingeben.
      </span>
    </div>
  );
}
