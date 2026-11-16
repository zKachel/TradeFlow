/**
 * Ablauf beim Absenden einer Kundenanfrage – unabhängig von Demo oder echter Datenbank.
 * Wichtig für Robustheit:
 *  - clientRequestId bleibt über Wiederholungen gleich → keine doppelten Anfragen.
 *  - Fotos werden einzeln hochgeladen, jedes mit eigener clientFileId → Wiederholen ist sicher.
 *  - Netzwerkfehler werden erkannt und als "erneut versuchen" gemeldet.
 */
import type { DetailValue, Urgency } from "./types";

export interface RequestPayload {
  clientRequestId: string;
  categoryId: string;
  title: string;
  description: string;
  postalCode: string;
  city: string;
  urgency: Urgency;
  budget?: number;
  details: Record<string, DetailValue>;
}

export type SubmitResult =
  | { ok: true; requestId: string }
  | {
      ok: false;
      error: string;
      fieldErrors?: Record<string, string>;
      retryable: boolean;
    };

export type UploadResult =
  { ok: true } | { ok: false; error: string; retryable: boolean };

export interface RequestSubmitAdapter {
  submitRequest(payload: RequestPayload): Promise<SubmitResult>;
  uploadPhoto(
    requestId: string,
    clientFileId: string,
    file: Blob,
  ): Promise<UploadResult>;
}

export type PhotoStatus = "wartet" | "laedt" | "ok" | "fehler";

export const OFFLINE_MESSAGE =
  "Keine Verbindung zum Server. Ihre Eingaben sind gespeichert – bitte prüfen Sie Ihr Internet und versuchen Sie es erneut.";

/** Erkennt typische Netzwerkfehler von fetch/Server Actions (offline, Abbruch, Timeout). */
export function isNetworkError(e: unknown): boolean {
  if (typeof navigator !== "undefined" && navigator.onLine === false)
    return true;
  if (e instanceof TypeError) return true; // "Failed to fetch", "Load failed", "NetworkError…"
  if (
    e instanceof DOMException &&
    (e.name === "AbortError" ||
      e.name === "TimeoutError" ||
      e.name === "NetworkError")
  )
    return true;
  const msg = e instanceof Error ? e.message : String(e);
  return /network|failed to fetch|load failed|fetch failed|ECONNRESET|connection/i.test(
    msg,
  );
}

/** Ruft eine Server-Funktion auf und wandelt geworfene Netzwerkfehler in ein Ergebnis um. */
export async function safeCall<T extends { ok: boolean }>(
  fn: () => Promise<T>,
): Promise<T | { ok: false; error: string; retryable: boolean }> {
  try {
    return await fn();
  } catch (e) {
    if (isNetworkError(e))
      return { ok: false, error: OFFLINE_MESSAGE, retryable: true };
    return {
      ok: false,
      error: "Unerwarteter Fehler. Bitte erneut versuchen.",
      retryable: true,
    };
  }
}

/**
 * Lädt Fotos nacheinander hoch. Bereits erfolgreiche werden übersprungen (Wiederholen-sicher).
 * Gibt den neuen Status je Foto zurück.
 */
export async function uploadPhotos<
  P extends { id: string; status: PhotoStatus },
>(
  requestId: string,
  photos: P[],
  prepare: (p: P) => Promise<Blob>,
  upload: RequestSubmitAdapter["uploadPhoto"],
  onChange: (id: string, status: PhotoStatus, error?: string) => void,
): Promise<{ ok: number; failed: number }> {
  let ok = 0;
  let failed = 0;
  for (const p of photos) {
    if (p.status === "ok") {
      ok++;
      continue;
    }
    onChange(p.id, "laedt");
    let result: UploadResult;
    try {
      const blob = await prepare(p);
      result = await safeCall(() => upload(requestId, p.id, blob));
    } catch {
      result = {
        ok: false,
        error: "Das Bild konnte nicht gelesen werden.",
        retryable: false,
      };
    }
    if (result.ok) {
      ok++;
      onChange(p.id, "ok");
    } else {
      failed++;
      onChange(p.id, "fehler", result.error);
    }
  }
  return { ok, failed };
}

/* ---------- Entwurf sichern (Formularabbruch) ---------- */

export interface DraftStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface RequestDraft<V> {
  version: 1;
  savedAt: number;
  clientRequestId: string;
  step: number;
  values: V;
}

const DRAFT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function saveDraft<V>(
  storage: DraftStorage | undefined,
  key: string,
  draft: Omit<RequestDraft<V>, "version" | "savedAt">,
) {
  if (!storage) return;
  try {
    storage.setItem(
      key,
      JSON.stringify({ ...draft, version: 1, savedAt: Date.now() }),
    );
  } catch {
    // Speicher voll oder gesperrt (privater Modus) – Formular funktioniert trotzdem.
  }
}

export function loadDraft<V>(
  storage: DraftStorage | undefined,
  key: string,
  now = Date.now(),
): RequestDraft<V> | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    const d = JSON.parse(raw) as RequestDraft<V>;
    if (
      d?.version !== 1 ||
      typeof d.clientRequestId !== "string" ||
      typeof d.values !== "object" ||
      !d.values
    )
      return null;
    if (typeof d.savedAt !== "number" || now - d.savedAt > DRAFT_MAX_AGE_MS) {
      storage.removeItem(key);
      return null;
    }
    return d;
  } catch {
    return null;
  }
}

export function clearDraft(storage: DraftStorage | undefined, key: string) {
  try {
    storage?.removeItem(key);
  } catch {
    // ignorieren
  }
}
