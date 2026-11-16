import type { Metadata } from "next";
import { LiveRequestList, type LiveRequest } from "./live-request-list";
import type { CustomerRequestRow } from "@/lib/db-types";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata: Metadata = { title: "Meine Anfragen" };

const SIGNED_URL_SECONDS = 600;

export default async function CustomerDashboardPage() {
  if (!isSupabaseConfigured()) return null; // Layout zeigt den Einrichtungshinweis
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customer_requests")
    .select(
      "id, client_request_id, category_id, title, description, postal_code, city, urgency, budget_eur, details, status, created_at, request_attachments(storage_path, created_at)",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  const rows = (data ?? []) as (CustomerRequestRow & {
    request_attachments: { storage_path: string }[];
  })[];
  // Private Fotos: kurzlebige, signierte Links (10 Minuten), nur für den Eigentümer erzeugbar (RLS).
  const paths = rows.flatMap((r) =>
    r.request_attachments.map((a) => a.storage_path),
  );
  const urls = new Map<string, string>();
  if (paths.length > 0) {
    const signed = await supabase.storage
      .from("request-photos")
      .createSignedUrls(paths, SIGNED_URL_SECONDS);
    for (const s of signed.data ?? [])
      if (s.signedUrl && s.path) urls.set(s.path, s.signedUrl);
  }

  const requests: LiveRequest[] = rows.map((r) => ({
    id: r.id,
    categoryId: r.category_id,
    title: r.title,
    description: r.description,
    postalCode: r.postal_code,
    city: r.city,
    urgency: r.urgency,
    budget: r.budget_eur ?? undefined,
    details: r.details,
    status: r.status,
    createdAt: r.created_at,
    photos: r.request_attachments
      .map((a) => urls.get(a.storage_path))
      .filter((u): u is string => Boolean(u)),
    photoCount: r.request_attachments.length,
  }));

  return <LiveRequestList requests={requests} loadError={Boolean(error)} />;
}
