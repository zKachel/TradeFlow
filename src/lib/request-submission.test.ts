import { describe, expect, it, vi } from "vitest";
import {
  clearDraft,
  isNetworkError,
  loadDraft,
  OFFLINE_MESSAGE,
  safeCall,
  saveDraft,
  uploadPhotos,
  type PhotoStatus,
} from "./request-submission";

function memoryStorage() {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
  };
}

describe("Netzwerkfehler", () => {
  it("erkennt typische Fehler bei Verbindungsabbruch", () => {
    expect(isNetworkError(new TypeError("Failed to fetch"))).toBe(true);
    expect(isNetworkError(new Error("Load failed"))).toBe(true);
    expect(isNetworkError(new DOMException("aborted", "AbortError"))).toBe(
      true,
    );
    expect(isNetworkError(new Error("Validierung"))).toBe(false);
  });

  it("safeCall wandelt Abbruch in eine verständliche, wiederholbare Meldung um", async () => {
    const r = await safeCall(async () => {
      throw new TypeError("Failed to fetch");
    });
    expect(r).toEqual({ ok: false, error: OFFLINE_MESSAGE, retryable: true });
  });
});

describe("Foto-Uploads", () => {
  it("lädt der Reihe nach, meldet Fehler einzeln und überspringt Erfolgreiche beim Wiederholen", async () => {
    const photos: { id: string; status: PhotoStatus }[] = [
      { id: "a", status: "wartet" },
      { id: "b", status: "wartet" },
      { id: "c", status: "wartet" },
    ];
    const statuses: Record<string, PhotoStatus> = {};
    let failB = true;
    const upload = vi.fn(async (_req: string, id: string) => {
      if (id === "b" && failB) throw new TypeError("Failed to fetch");
      return { ok: true as const };
    });
    const onChange = (id: string, s: PhotoStatus) => {
      statuses[id] = s;
      const p = photos.find((x) => x.id === id)!;
      p.status = s;
    };
    const first = await uploadPhotos(
      "req",
      photos,
      async () => new Blob(["x"]),
      upload,
      onChange,
    );
    expect(first).toEqual({ ok: 2, failed: 1 });
    expect(statuses).toEqual({ a: "ok", b: "fehler", c: "ok" });

    failB = false;
    upload.mockClear();
    const second = await uploadPhotos(
      "req",
      photos,
      async () => new Blob(["x"]),
      upload,
      onChange,
    );
    expect(second).toEqual({ ok: 3, failed: 0 });
    // Nur das fehlgeschlagene Foto wurde erneut gesendet → keine Duplikate
    expect(upload).toHaveBeenCalledTimes(1);
    expect(upload.mock.calls[0][1]).toBe("b");
  });

  it("beschädigte Bilder werden als Fehler gemeldet, ohne Upload", async () => {
    const upload = vi.fn();
    const changes: [string, PhotoStatus, string?][] = [];
    const r = await uploadPhotos(
      "req",
      [{ id: "kaputt", status: "wartet" as PhotoStatus }],
      async () => {
        throw new Error("decode");
      },
      upload,
      (id, s, e) => changes.push([id, s, e]),
    );
    expect(r).toEqual({ ok: 0, failed: 1 });
    expect(upload).not.toHaveBeenCalled();
    expect(changes.at(-1)?.[2]).toMatch(/nicht gelesen/);
  });
});

describe("Entwurf (Formularabbruch)", () => {
  it("speichert, lädt und löscht den Entwurf inkl. Formular-ID", () => {
    const s = memoryStorage();
    saveDraft(s, "k", {
      clientRequestId: "id-1",
      step: 2,
      values: { title: "Hecke" },
    });
    expect(loadDraft<{ title: string }>(s, "k")).toMatchObject({
      clientRequestId: "id-1",
      step: 2,
      values: { title: "Hecke" },
    });
    clearDraft(s, "k");
    expect(loadDraft(s, "k")).toBeNull();
  });

  it("verwirft alte (>7 Tage) und kaputte Entwürfe", () => {
    const s = memoryStorage();
    saveDraft(s, "k", { clientRequestId: "id-1", step: 1, values: {} });
    expect(loadDraft(s, "k", Date.now() + 8 * 24 * 3600 * 1000)).toBeNull();
    s.setItem("k", "{kaputt");
    expect(loadDraft(s, "k")).toBeNull();
    s.setItem("k", JSON.stringify({ version: 99 }));
    expect(loadDraft(s, "k")).toBeNull();
  });

  it("funktioniert ohne Speicher (privater Modus) ohne Absturz", () => {
    const broken = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("quota");
      },
      removeItem: () => {
        throw new Error("blocked");
      },
    };
    expect(() =>
      saveDraft(broken, "k", { clientRequestId: "x", step: 0, values: {} }),
    ).not.toThrow();
    expect(loadDraft(broken, "k")).toBeNull();
    expect(() => clearDraft(broken, "k")).not.toThrow();
  });
});
