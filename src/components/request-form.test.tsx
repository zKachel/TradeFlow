// @vitest-environment jsdom
/**
 * Robustheitstests für das Kundenformular (gleiche Komponente für Demo und echte Datenbank):
 * doppelte Einsendung, Netzwerkunterbrechung, Formularabbruch (Entwurf), fehlerhafte Dateien.
 */
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
  RequestPayload,
  RequestSubmitAdapter,
} from "@/lib/request-submission";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("kategorie=reinigung"),
}));
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));
vi.mock("@/lib/image-prepare", () => ({
  assertReadableImage: async (f: File) => {
    if (f.name.startsWith("kaputt")) throw new Error("decode");
  },
  prepareImage: async (f: File) => new Blob([f.name], { type: "image/jpeg" }),
}));

import { RequestForm } from "./request-form";

const DRAFT_KEY = "test-entwurf";

beforeEach(() => {
  window.localStorage.clear();
  URL.createObjectURL = vi.fn(() => "blob:test");
  URL.revokeObjectURL = vi.fn();
  window.scrollTo = vi.fn();
});
afterEach(() => cleanup());

function renderForm(adapter: RequestSubmitAdapter) {
  return render(
    <RequestForm
      mode="live"
      listPath="/kunde"
      adapter={adapter}
      draftKey={DRAFT_KEY}
    />,
  );
}

async function fillToLastStep(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/Kurzer Titel/), "Fenster putzen");
  await user.type(
    screen.getByLabelText(/^Beschreibung/),
    "Zwölf Fenster im Einfamilienhaus, innen und außen.",
  );
  await user.click(screen.getByText("Fensterreinigung"));
  await user.click(screen.getByRole("button", { name: /Weiter/ }));
  await user.type(screen.getByLabelText(/^PLZ/), "26169");
  await user.type(screen.getByLabelText(/^Ort/), "Friesoythe");
  await user.click(screen.getByText("Zeitlich flexibel"));
  await user.click(screen.getByRole("button", { name: /Weiter/ }));
  await user.click(screen.getByRole("checkbox"));
}

describe("Kundenformular – Robustheit", () => {
  it("doppelter Klick auf Absenden erzeugt nur EINE Anfrage", async () => {
    const user = userEvent.setup();
    let resolve!: (v: { ok: true; requestId: string }) => void;
    const submitRequest = vi.fn(
      () => new Promise<{ ok: true; requestId: string }>((r) => (resolve = r)),
    );
    renderForm({ submitRequest, uploadPhoto: vi.fn() });
    await fillToLastStep(user);

    const button = screen.getByRole("button", { name: "Anfrage absenden" });
    await user.click(button);
    await user.click(button);
    await user.click(button);
    expect(submitRequest).toHaveBeenCalledTimes(1);
    expect(
      (
        screen.getByRole("button", {
          name: /Wird gesendet/,
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);

    await act(async () => resolve({ ok: true, requestId: "r1" }));
    expect(await screen.findByText("Anfrage eingereicht")).toBeTruthy();
    // Entwurf ist nach Erfolg gelöscht
    expect(window.localStorage.getItem(DRAFT_KEY)).toBeNull();
  });

  it("Netzwerkunterbrechung: verständliche Meldung, Eingaben bleiben, Wiederholen nutzt dieselbe Formular-ID", async () => {
    const user = userEvent.setup();
    const calls: RequestPayload[] = [];
    const submitRequest = vi.fn(async (p: RequestPayload) => {
      calls.push(p);
      if (calls.length === 1) throw new TypeError("Failed to fetch");
      return { ok: true as const, requestId: "r1" };
    });
    renderForm({ submitRequest, uploadPhoto: vi.fn() });
    await fillToLastStep(user);

    await user.click(screen.getByRole("button", { name: "Anfrage absenden" }));
    expect(await screen.findByText(/Keine Verbindung zum Server/)).toBeTruthy();
    // Eingaben sind noch da (Entwurf gesichert)
    expect(window.localStorage.getItem(DRAFT_KEY)).toContain("Fenster putzen");

    await user.click(screen.getByRole("button", { name: "Erneut senden" }));
    expect(await screen.findByText("Anfrage eingereicht")).toBeTruthy();
    expect(calls).toHaveLength(2);
    expect(calls[1].clientRequestId).toBe(calls[0].clientRequestId);
  });

  it("Formularabbruch: Entwurf wird beim nächsten Öffnen wiederhergestellt", async () => {
    const user = userEvent.setup();
    const adapter = { submitRequest: vi.fn(), uploadPhoto: vi.fn() };
    const { unmount } = renderForm(adapter);
    await user.type(
      screen.getByLabelText(/Kurzer Titel/),
      "Treppenhaus reinigen",
    );
    await waitFor(() =>
      expect(window.localStorage.getItem(DRAFT_KEY)).toContain(
        "Treppenhaus reinigen",
      ),
    );
    unmount();

    renderForm(adapter);
    expect(
      await screen.findByText(/Entwurf wurde wiederhergestellt/),
    ).toBeTruthy();
    expect(
      (screen.getByLabelText(/Kurzer Titel/) as HTMLInputElement).value,
    ).toBe("Treppenhaus reinigen");

    await user.click(screen.getByRole("button", { name: "Neu beginnen" }));
    expect(window.localStorage.getItem(DRAFT_KEY)).toBeNull();
  });

  it("fehlerhafte Dateien werden abgelehnt, gültige angenommen", async () => {
    const user = userEvent.setup({ applyAccept: false });
    renderForm({ submitRequest: vi.fn(), uploadPhoto: vi.fn() });
    await fillToLastStep(user);
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    await user.upload(
      input,
      new File(["%PDF"], "rechnung.pdf", { type: "application/pdf" }),
    );
    expect(
      await screen.findByText(/Nur JPG, PNG, WebP oder HEIC/),
    ).toBeTruthy();

    const big = new File([new Uint8Array(11 * 1024 * 1024)], "riesig.jpg", {
      type: "image/jpeg",
    });
    await user.upload(input, big);
    expect(await screen.findByText(/größer als 10 MB/)).toBeTruthy();

    await user.upload(
      input,
      new File(["xx"], "kaputt.jpg", { type: "image/jpeg" }),
    );
    expect(
      await screen.findByText(/beschädigt oder kein lesbares Bild/),
    ).toBeTruthy();

    await user.upload(
      input,
      new File(["ok"], "garten.jpg", { type: "image/jpeg" }),
    );
    expect(await screen.findByAltText("Vorschau garten.jpg")).toBeTruthy();
  });

  it("fehlgeschlagener Foto-Upload kann gezielt wiederholt werden", async () => {
    const user = userEvent.setup();
    let fail = true;
    const uploadPhoto = vi.fn(async () =>
      fail
        ? {
            ok: false as const,
            error: "Upload fehlgeschlagen.",
            retryable: true,
          }
        : { ok: true as const },
    );
    renderForm({
      submitRequest: vi.fn(async () => ({
        ok: true as const,
        requestId: "r1",
      })),
      uploadPhoto,
    });
    await fillToLastStep(user);
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    await user.upload(
      input,
      new File(["ok"], "bad.jpg", { type: "image/jpeg" }),
    );
    await screen.findByAltText("Vorschau bad.jpg");

    await user.click(screen.getByRole("button", { name: "Anfrage absenden" }));
    expect(
      await screen.findByText(/1 Foto konnte nicht hochgeladen werden/),
    ).toBeTruthy();

    fail = false;
    await user.click(screen.getByRole("button", { name: /Erneut versuchen/ }));
    await waitFor(() =>
      expect(screen.queryByText(/konnte nicht hochgeladen werden/)).toBeNull(),
    );
    expect(screen.getByText("Hochgeladen")).toBeTruthy();
    expect(uploadPhoto).toHaveBeenCalledTimes(2);
  });

  it("Serverseitige Prüffehler werden angezeigt, ohne die Eingaben zu verlieren", async () => {
    const user = userEvent.setup();
    const submitRequest = vi.fn(async () => ({
      ok: false as const,
      error:
        "Sie haben heute schon viele Anfragen gestellt. Bitte morgen erneut versuchen.",
      retryable: false,
    }));
    renderForm({ submitRequest, uploadPhoto: vi.fn() });
    await fillToLastStep(user);
    await user.click(screen.getByRole("button", { name: "Anfrage absenden" }));
    expect(await screen.findByText(/schon viele Anfragen/)).toBeTruthy();
    expect(screen.getByText("Fenster putzen")).toBeTruthy();
  });
});
