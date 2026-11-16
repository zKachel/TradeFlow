"use server";

import { redirect } from "next/navigation";
import { getMyCompany, requireUser } from "@/lib/auth";
import {
  companySchema,
  jobUpdateSchema,
  noteSchema,
  zodErrors,
} from "@/lib/company-schema";
import type { AuditEventRow, JobNoteRow } from "@/lib/db-types";
import { validateJob } from "@/lib/job-schema";
import { UUID_RE } from "@/lib/ids";
import { createClient } from "@/lib/supabase/server";

export type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? object : { data: T }))
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

const GENERIC = "Speichern fehlgeschlagen. Bitte erneut versuchen.";
const CONFLICT =
  "Der Auftrag wurde inzwischen von jemand anderem geändert. Bitte Seite neu laden.";

async function managerContext() {
  await requireUser("betrieb");
  const company = await getMyCompany();
  if (!company || (company.role !== "inhaber" && company.role !== "buero"))
    return null;
  return company;
}

/* ---------------- Firma ---------------- */

export interface CompanyFormState {
  error?: string;
  fieldErrors?: Record<string, string>;
  saved?: boolean;
}

function parseCompany(formData: FormData) {
  return companySchema.safeParse({
    name: formData.get("name"),
    postalCode: formData.get("postalCode"),
    city: formData.get("city"),
    serviceRadiusKm: formData.get("serviceRadiusKm"),
    tradeIds: formData.getAll("tradeIds").map(String),
  });
}

export async function createCompanyAction(
  _prev: CompanyFormState,
  formData: FormData,
): Promise<CompanyFormState> {
  await requireUser("betrieb");
  const parsed = parseCompany(formData);
  if (!parsed.success) return { fieldErrors: zodErrors(parsed.error) };
  const supabase = await createClient();
  const { error } = await supabase.rpc("create_company", {
    p_name: parsed.data.name,
    p_postal_code: parsed.data.postalCode,
    p_city: parsed.data.city,
    p_service_radius_km: parsed.data.serviceRadiusKm,
    p_trade_ids: parsed.data.tradeIds,
  });
  if (error) {
    if (error.code === "23505") redirect("/betrieb");
    return { error: GENERIC };
  }
  redirect("/betrieb");
}

export async function updateCompanyAction(
  _prev: CompanyFormState,
  formData: FormData,
): Promise<CompanyFormState> {
  await requireUser("betrieb");
  const company = await getMyCompany();
  if (!company || company.role !== "inhaber")
    return { error: "Nur der Inhaber kann das Firmenprofil ändern." };
  const parsed = parseCompany(formData);
  if (!parsed.success) return { fieldErrors: zodErrors(parsed.error) };
  const supabase = await createClient();
  const { error, count } = await supabase
    .from("companies")
    .update(
      {
        name: parsed.data.name,
        postal_code: parsed.data.postalCode,
        city: parsed.data.city,
        service_radius_km: parsed.data.serviceRadiusKm,
        trade_ids: parsed.data.tradeIds,
      },
      { count: "exact" },
    )
    .eq("id", company.companyId);
  if (error || count === 0) return { error: GENERIC };
  return { saved: true };
}

/* ---------------- Aufträge ---------------- */

export interface JobFormInput {
  title: string;
  customerName: string;
  location: string;
  categoryId: string;
  scheduledDate: string;
  scheduledTime: string;
  note?: string;
}

export async function createJobAction(
  input: JobFormInput,
): Promise<ActionResult<{ id: string }>> {
  const company = await managerContext();
  if (!company) return { ok: false, error: "Keine Berechtigung." };
  const parsed = validateJob({ ...input, assigneeIds: [] });
  if (!parsed.success)
    return {
      ok: false,
      error: "Bitte Eingaben prüfen.",
      fieldErrors: parsed.errors,
    };
  const supabase = await createClient();
  const d = parsed.data;
  const { data, error } = await supabase
    .from("company_jobs")
    .insert({
      company_id: company.companyId,
      title: d.title,
      customer_name: d.customerName,
      location: d.location,
      category_id: d.categoryId,
      status: d.scheduledDate ? "geplant" : "neu",
      scheduled_date: d.scheduledDate ?? null,
      scheduled_time: d.scheduledTime ?? null,
    })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: GENERIC };
  if (d.note) {
    await supabase.from("job_notes").insert({ job_id: data.id, body: d.note });
  }
  return { ok: true, data: { id: data.id } };
}

export async function updateJobAction(
  jobId: string,
  expectedUpdatedAt: string,
  input: JobFormInput & { status: string },
): Promise<ActionResult> {
  const company = await managerContext();
  if (!company) return { ok: false, error: "Keine Berechtigung." };
  if (!UUID_RE.test(jobId)) return { ok: false, error: "Ungültiger Auftrag." };
  const parsed = jobUpdateSchema.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      error: "Bitte Eingaben prüfen.",
      fieldErrors: zodErrors(parsed.error),
    };
  const d = parsed.data;
  const supabase = await createClient();
  const { error, count } = await supabase
    .from("company_jobs")
    .update(
      {
        title: d.title,
        customer_name: d.customerName,
        location: d.location,
        category_id: d.categoryId,
        status: d.status,
        scheduled_date: d.scheduledDate ?? null,
        scheduled_time: d.scheduledTime ?? null,
      },
      { count: "exact" },
    )
    .eq("id", jobId)
    .eq("updated_at", expectedUpdatedAt);
  if (error) return { ok: false, error: GENERIC };
  if (count === 0) return { ok: false, error: CONFLICT };
  return { ok: true };
}

export async function setJobStatusAction(
  jobId: string,
  expectedUpdatedAt: string,
  status: string,
): Promise<ActionResult> {
  const company = await managerContext();
  if (!company) return { ok: false, error: "Keine Berechtigung." };
  const parsed = jobUpdateSchema.shape.status.safeParse(status);
  if (!UUID_RE.test(jobId) || !parsed.success)
    return { ok: false, error: "Ungültige Eingabe." };
  const supabase = await createClient();
  const { error, count } = await supabase
    .from("company_jobs")
    .update({ status: parsed.data }, { count: "exact" })
    .eq("id", jobId)
    .eq("updated_at", expectedUpdatedAt);
  if (error) return { ok: false, error: GENERIC };
  if (count === 0) return { ok: false, error: CONFLICT };
  return { ok: true };
}

export async function addJobNoteAction(
  jobId: string,
  body: string,
): Promise<ActionResult> {
  const company = await managerContext();
  if (!company) return { ok: false, error: "Keine Berechtigung." };
  const parsed = noteSchema.safeParse({ body });
  if (!UUID_RE.test(jobId)) return { ok: false, error: "Ungültiger Auftrag." };
  if (!parsed.success)
    return { ok: false, error: zodErrors(parsed.error).body };
  const supabase = await createClient();
  const { error } = await supabase
    .from("job_notes")
    .insert({ job_id: jobId, body: parsed.data.body });
  if (error) return { ok: false, error: GENERIC };
  return { ok: true };
}

export interface JobDetails {
  notes: (JobNoteRow & { author: string })[];
  history: (AuditEventRow & { actor: string })[];
}

export async function getJobDetailsAction(
  jobId: string,
): Promise<ActionResult<JobDetails>> {
  const company = await managerContext();
  if (!company) return { ok: false, error: "Keine Berechtigung." };
  if (!UUID_RE.test(jobId)) return { ok: false, error: "Ungültiger Auftrag." };
  const supabase = await createClient();
  const [notes, history, people] = await Promise.all([
    supabase
      .from("job_notes")
      .select("id, job_id, body, created_at, author_id")
      .eq("job_id", jobId)
      .order("created_at"),
    supabase
      .from("audit_events")
      .select(
        "id, occurred_at, actor_id, entity_id, action, old_status, new_status",
      )
      .eq("entity_type", "company_job")
      .eq("entity_id", jobId)
      .order("occurred_at", { ascending: false })
      .limit(30),
    supabase.from("profiles").select("id, display_name"),
  ]);
  if (notes.error || history.error)
    return { ok: false, error: "Details konnten nicht geladen werden." };
  const names = new Map(
    (people.data ?? []).map((p) => [p.id as string, p.display_name as string]),
  );
  const name = (id: string | null) =>
    id ? (names.get(id) ?? "Unbekannt") : "System";
  return {
    ok: true,
    data: {
      notes: (notes.data as JobNoteRow[]).map((n) => ({
        ...n,
        author: name(n.author_id),
      })),
      history: (history.data as AuditEventRow[]).map((h) => ({
        ...h,
        actor: name(h.actor_id),
      })),
    },
  };
}
