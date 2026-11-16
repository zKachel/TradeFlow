"use server";

import { requireUser } from "@/lib/auth";
import { MAX_UPLOAD_BYTES, sniffImage } from "@/lib/image-sniff";
import { UUID_RE } from "@/lib/ids";
import { validateBase, validateDetails } from "@/lib/request-schema";
import type {
  RequestPayload,
  SubmitResult,
  UploadResult,
} from "@/lib/request-submission";
import { createClient } from "@/lib/supabase/server";

const BUCKET = "request-photos";
const GENERIC =
  "Die Anfrage konnte nicht gespeichert werden. Bitte erneut versuchen.";

/**
 * Speichert eine Kundenanfrage. Idempotent: Wird dieselbe clientRequestId erneut gesendet
 * (Doppelklick, Wiederholen nach Verbindungsabbruch), entsteht KEINE zweite Anfrage.
 */
export async function submitRequestAction(
  payload: RequestPayload,
): Promise<SubmitResult> {
  const user = await requireUser("kunde");
  if (
    !payload ||
    typeof payload !== "object" ||
    !UUID_RE.test(String(payload.clientRequestId))
  ) {
    return { ok: false, error: GENERIC, retryable: false };
  }
  // Server prüft erneut – der Browser ist nicht vertrauenswürdig.
  const base = validateBase({
    ...payload,
    budget: payload.budget ?? "",
    privacyAccepted: true,
  });
  const details = validateDetails(
    String(payload.categoryId),
    (payload.details ?? {}) as Record<string, unknown>,
  );
  if (!base.success || !details.success) {
    return {
      ok: false,
      error: "Bitte prüfen Sie Ihre Angaben.",
      fieldErrors: {
        ...(base.success ? {} : base.errors),
        ...(details.success ? {} : details.errors),
      },
      retryable: false,
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customer_requests")
    .insert({
      customer_id: user.id,
      client_request_id: payload.clientRequestId,
      category_id: base.data.categoryId,
      title: base.data.title,
      description: base.data.description,
      postal_code: base.data.postalCode,
      city: base.data.city,
      urgency: base.data.urgency,
      budget_eur: base.data.budget ?? null,
      details: details.data,
    })
    .select("id")
    .single();

  if (error?.code === "23505") {
    // Bereits gespeichert (Wiederholung) → vorhandene Anfrage zurückgeben.
    const existing = await supabase
      .from("customer_requests")
      .select("id")
      .eq("client_request_id", payload.clientRequestId)
      .maybeSingle();
    if (existing.data) return { ok: true, requestId: existing.data.id };
  }
  if (error?.hint === "rate_limit") {
    return {
      ok: false,
      error:
        "Sie haben heute schon viele Anfragen gestellt. Bitte morgen erneut versuchen.",
      retryable: false,
    };
  }
  if (error || !data) return { ok: false, error: GENERIC, retryable: true };
  return { ok: true, requestId: data.id };
}

/**
 * Lädt ein Foto privat hoch. Prüft serverseitig: Anmeldung, Eigentum der Anfrage,
 * echte Bildsignatur (nicht nur Dateiendung), Größe. Wiederholen ist sicher (clientFileId).
 */
export async function uploadRequestPhotoAction(
  formData: FormData,
): Promise<UploadResult> {
  const user = await requireUser("kunde");
  const requestId = String(formData.get("requestId") ?? "");
  const clientFileId = String(formData.get("clientFileId") ?? "");
  const file = formData.get("file");
  if (
    !UUID_RE.test(requestId) ||
    !UUID_RE.test(clientFileId) ||
    !(file instanceof Blob)
  ) {
    return { ok: false, error: "Ungültige Daten.", retryable: false };
  }
  if (file.size === 0 || file.size > MAX_UPLOAD_BYTES) {
    return {
      ok: false,
      error: "Das Foto ist zu groß (max. 5 MB nach Verkleinerung).",
      retryable: false,
    };
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = sniffImage(bytes);
  if (!kind)
    return {
      ok: false,
      error: "Die Datei ist kein gültiges Bild (JPG, PNG oder WebP).",
      retryable: false,
    };

  const supabase = await createClient();
  // Gehört die Anfrage dem Nutzer? (RLS liefert sonst keine Zeile)
  const { data: request } = await supabase
    .from("customer_requests")
    .select("id")
    .eq("id", requestId)
    .maybeSingle();
  if (!request)
    return { ok: false, error: "Anfrage nicht gefunden.", retryable: false };

  // Schon vorhanden? (Wiederholung nach Abbruch)
  const { data: existing } = await supabase
    .from("request_attachments")
    .select("id")
    .eq("request_id", requestId)
    .eq("client_file_id", clientFileId)
    .maybeSingle();
  if (existing) return { ok: true };

  const path = `${user.id}/${requestId}/${clientFileId}.${kind.ext}`;
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, bytes, {
      contentType: kind.mime,
      upsert: false,
      cacheControl: "3600",
    });
  const alreadyThere =
    uploadError &&
    /exist|duplicate|409/i.test(
      `${uploadError.message} ${"statusCode" in uploadError ? uploadError.statusCode : ""}`,
    );
  if (uploadError && !alreadyThere) {
    return {
      ok: false,
      error: "Upload fehlgeschlagen. Bitte erneut versuchen.",
      retryable: true,
    };
  }

  const { error: metaError } = await supabase
    .from("request_attachments")
    .insert({
      request_id: requestId,
      owner_id: user.id,
      client_file_id: clientFileId,
      storage_path: path,
      mime_type: kind.mime,
      size_bytes: bytes.byteLength,
    });
  if (metaError && metaError.code !== "23505") {
    if (metaError.hint === "too_many_files")
      return {
        ok: false,
        error: "Maximal 6 Fotos pro Anfrage.",
        retryable: false,
      };
    return {
      ok: false,
      error: "Foto konnte nicht zugeordnet werden. Bitte erneut versuchen.",
      retryable: true,
    };
  }
  return { ok: true };
}

export async function cancelRequestAction(
  requestId: string,
): Promise<{ ok: boolean; error?: string }> {
  await requireUser("kunde");
  if (!UUID_RE.test(requestId))
    return { ok: false, error: "Ungültige Anfrage." };
  const supabase = await createClient();
  const { error, count } = await supabase
    .from("customer_requests")
    .update({ status: "storniert" }, { count: "exact" })
    .eq("id", requestId);
  if (error)
    return {
      ok: false,
      error: "Diese Anfrage kann nicht mehr zurückgezogen werden.",
    };
  if (count === 0) return { ok: false, error: "Anfrage nicht gefunden." };
  return { ok: true };
}
