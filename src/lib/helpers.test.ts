import { describe, expect, it } from "vitest";
import {
  authErrorMessage,
  isAuthServiceError,
  loginSchema,
  newPasswordSchema,
  registerSchema,
} from "./auth-schema";
import { shortTime, todayInBerlin } from "./dates";
import { newUuid, UUID_RE } from "./ids";
import { sniffImage } from "./image-sniff";
import { isInPilotRegion } from "./region";
import { safeNext } from "./safe-next";

describe("safeNext (Schutz vor Open Redirect)", () => {
  it("erlaubt nur relative Pfade", () => {
    expect(safeNext("/kunde/anfrage/neu")).toBe("/kunde/anfrage/neu");
    expect(safeNext("https://boese.example")).toBe("/");
    expect(safeNext("//boese.example")).toBe("/");
    expect(safeNext("/\\boese.example")).toBe("/");
    expect(safeNext("/kunde\r\nSet-Cookie: x")).toBe("/");
    expect(safeNext(null, "/kunde")).toBe("/kunde");
  });
});

describe("Auth-Validierung", () => {
  const ok = {
    accountType: "kunde",
    displayName: "Anna Muster",
    email: " Anna@Example.DE ",
    password: "sicheresPasswort1",
    privacyAccepted: true,
  };
  it("akzeptiert gültige Registrierung und normalisiert die E-Mail", () => {
    const r = registerSchema.safeParse(ok);
    expect(r.success && r.data.email).toBe("anna@example.de");
  });
  it("lehnt schwache Passwörter, falsche Kontoart und fehlende Zustimmung ab", () => {
    expect(registerSchema.safeParse({ ...ok, password: "kurz1" }).success).toBe(
      false,
    );
    expect(
      registerSchema.safeParse({ ...ok, password: "nurbuchstabenlang" })
        .success,
    ).toBe(false);
    expect(
      registerSchema.safeParse({ ...ok, accountType: "admin" }).success,
    ).toBe(false);
    expect(
      registerSchema.safeParse({ ...ok, privacyAccepted: false }).success,
    ).toBe(false);
    expect(
      loginSchema.safeParse({ email: "kein-email", password: "x" }).success,
    ).toBe(false);
  });
  it("prüft Passwort-Wiederholung", () => {
    expect(
      newPasswordSchema.safeParse({
        password: "neuesPasswort9",
        passwordRepeat: "anders123456",
      }).success,
    ).toBe(false);
    expect(
      newPasswordSchema.safeParse({
        password: "neuesPasswort9",
        passwordRepeat: "neuesPasswort9",
      }).success,
    ).toBe(true);
  });
  it("unterscheidet Server-nicht-erreichbar von falschen Zugangsdaten", () => {
    expect(
      isAuthServiceError({ name: "AuthRetryableFetchError", status: 0 }),
    ).toBe(true);
    expect(isAuthServiceError({ status: 503 })).toBe(true);
    expect(isAuthServiceError({ status: 400, name: "AuthApiError" })).toBe(
      false,
    );
    expect(isAuthServiceError(null)).toBe(false);
  });

  it("verrät bei falschen Zugangsdaten nicht, ob es das Konto gibt", () => {
    expect(authErrorMessage("invalid_credentials")).toBe(
      "E-Mail oder Passwort ist falsch.",
    );
    expect(
      authErrorMessage("user_not_found", "E-Mail oder Passwort ist falsch."),
    ).toBe("E-Mail oder Passwort ist falsch.");
  });
});

describe("sniffImage (echte Dateitypen)", () => {
  const pad = (b: number[]) => new Uint8Array([...b, ...new Array(16).fill(0)]);
  it("erkennt JPEG, PNG und WebP", () => {
    expect(sniffImage(pad([0xff, 0xd8, 0xff, 0xe0]))?.mime).toBe("image/jpeg");
    expect(
      sniffImage(pad([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))?.mime,
    ).toBe("image/png");
    const webp = new TextEncoder().encode("RIFF\0\0\0\0WEBPVP8 ");
    expect(sniffImage(webp)?.mime).toBe("image/webp");
  });
  it("lehnt getarnte Dateien ab (HTML, SVG, PDF, EXE, leer)", () => {
    for (const text of [
      "<html><script>alert(1)</script>",
      "<svg xmlns='http://www.w3.org/2000/svg'>",
      "%PDF-1.7 ......",
      "MZ\x90\0\x03\0\0\0\x04\0\0\0",
    ]) {
      expect(sniffImage(new TextEncoder().encode(text))).toBeNull();
    }
    expect(sniffImage(new Uint8Array())).toBeNull();
  });
});

describe("Hilfsfunktionen", () => {
  it("UUIDs sind gültig und eindeutig", () => {
    const a = newUuid();
    expect(a).toMatch(UUID_RE);
    expect(newUuid()).not.toBe(a);
  });
  it("Pilotregion Friesoythe / Landkreis Cloppenburg", () => {
    expect(isInPilotRegion("26169")).toBe(true);
    expect(isInPilotRegion("49661")).toBe(true);
    expect(isInPilotRegion("10115")).toBe(false);
  });
  it("Datum in deutscher Zeit", () => {
    // 23:30 UTC am 16.11. ist in Berlin schon der 17.11.
    expect(todayInBerlin(new Date("2026-11-16T23:30:00Z"))).toBe("2026-11-17");
    expect(shortTime("08:00:00")).toBe("08:00");
  });
});
