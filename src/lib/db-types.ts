/** Typen, die den Datenbanktabellen (supabase/migrations) entsprechen. */
import type { JobStatus, MarketplaceStatus, Urgency } from "./types";

export type AccountType = "kunde" | "betrieb";
export type CompanyRole = "inhaber" | "buero" | "mitarbeiter";

export interface CompanyJobRow {
  id: string;
  company_id: string;
  title: string;
  customer_name: string;
  location: string;
  category_id: string;
  status: JobStatus;
  scheduled_date: string | null;
  scheduled_time: string | null;
  created_at: string;
  updated_at: string;
}

export interface JobNoteRow {
  id: string;
  job_id: string;
  body: string;
  created_at: string;
  author_id: string | null;
}

export interface AuditEventRow {
  id: number;
  occurred_at: string;
  actor_id: string | null;
  entity_id: string;
  action: string;
  old_status: string | null;
  new_status: string | null;
}

export interface CustomerRequestRow {
  id: string;
  client_request_id: string;
  category_id: string;
  title: string;
  description: string;
  postal_code: string;
  city: string;
  urgency: Urgency;
  budget_eur: number | null;
  details: Record<string, string | number | boolean>;
  status: MarketplaceStatus;
  created_at: string;
}
