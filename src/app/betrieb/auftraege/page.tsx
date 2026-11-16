import type { Metadata } from "next";
import { Suspense } from "react";
import { LiveJobsView } from "./live-jobs-view";
import { getMyCompany } from "@/lib/auth";
import type { CompanyJobRow } from "@/lib/db-types";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Eigene Aufträge" };

const LIMIT = 500;

export default async function JobsPage() {
  const company = await getMyCompany();
  if (!company) return null;
  const supabase = await createClient();
  const [jobs, comp] = await Promise.all([
    supabase
      .from("company_jobs")
      .select(
        "id, company_id, title, customer_name, location, category_id, status, scheduled_date, scheduled_time, created_at, updated_at",
      )
      .eq("company_id", company.companyId)
      .order("scheduled_date", { ascending: true, nullsFirst: false })
      .order("scheduled_time", { ascending: true, nullsFirst: true })
      .limit(LIMIT),
    supabase
      .from("companies")
      .select("trade_ids")
      .eq("id", company.companyId)
      .single(),
  ]);

  return (
    // Suspense, weil die Ansicht URL-Parameter liest (?neu=1)
    <Suspense
      fallback={
        <div
          aria-busy="true"
          className="h-96 animate-pulse rounded-2xl bg-line/60"
        />
      }
    >
      <LiveJobsView
        jobs={(jobs.data ?? []) as CompanyJobRow[]}
        loadError={Boolean(jobs.error)}
        truncated={(jobs.data?.length ?? 0) >= LIMIT}
        tradeIds={(comp.data?.trade_ids as string[] | undefined) ?? []}
        canManage={company.role === "inhaber" || company.role === "buero"}
      />
    </Suspense>
  );
}
