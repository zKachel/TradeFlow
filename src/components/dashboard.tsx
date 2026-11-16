import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function Kpi({
  href,
  icon,
  label,
  value,
  market,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  value: number;
  market?: boolean;
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex h-full flex-col rounded-2xl border border-line bg-surface p-4 transition hover:border-brand-500"
      >
        <span
          className={`flex size-9 items-center justify-center rounded-lg ${
            market
              ? "bg-accent-50 text-accent-600"
              : "bg-brand-50 text-brand-700"
          }`}
          aria-hidden="true"
        >
          {icon}
        </span>
        <span className="mt-3 text-3xl font-bold tracking-tight">{value}</span>
        <span className="text-sm text-muted">{label}</span>
      </Link>
    </li>
  );
}

export function SectionHead({
  id,
  title,
  href,
  market,
  className = "",
}: {
  id: string;
  title: string;
  href?: string;
  market?: boolean;
  className?: string;
}) {
  return (
    <div className={`mb-3 flex items-center justify-between ${className}`}>
      <h2
        id={id}
        className={`font-semibold ${market ? "text-accent-600" : ""}`}
      >
        {title}
      </h2>
      {href && (
        <Link
          href={href}
          className="flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline"
        >
          Alle <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
