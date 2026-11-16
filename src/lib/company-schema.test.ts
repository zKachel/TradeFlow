import { describe, expect, it } from "vitest";
import { companySchema, jobUpdateSchema, noteSchema } from "./company-schema";

describe("companySchema", () => {
  const valid = {
    name: "Malerei Muster",
    postalCode: "26169",
    city: "Friesoythe",
    serviceRadiusKm: "30",
    tradeIds: ["maler", "maler", "fliesen"],
  };

  it("akzeptiert gültige Firmendaten und entfernt doppelte Gewerke", () => {
    const r = companySchema.safeParse(valid);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.tradeIds).toEqual(["maler", "fliesen"]);
      expect(r.data.serviceRadiusKm).toBe(30);
    }
  });

  it("verlangt mindestens ein bekanntes Gewerk und einen erlaubten Radius", () => {
    expect(companySchema.safeParse({ ...valid, tradeIds: [] }).success).toBe(
      false,
    );
    expect(
      companySchema.safeParse({ ...valid, tradeIds: ["hacken"] }).success,
    ).toBe(false);
    expect(
      companySchema.safeParse({ ...valid, serviceRadiusKm: "7" }).success,
    ).toBe(false);
    expect(
      companySchema.safeParse({ ...valid, postalCode: "2616" }).success,
    ).toBe(false);
  });
});

describe("jobUpdateSchema", () => {
  const valid = {
    title: "Flur streichen",
    customerName: "Fam. Muster",
    location: "26169 Friesoythe",
    categoryId: "maler",
    scheduledDate: "2026-11-20",
    scheduledTime: "08:00",
    status: "geplant",
  };
  it("akzeptiert gültige Änderungen", () => {
    expect(jobUpdateSchema.safeParse(valid).success).toBe(true);
  });
  it("lehnt unbekannten Status und Uhrzeit ohne Datum ab", () => {
    expect(
      jobUpdateSchema.safeParse({ ...valid, status: "bezahlt" }).success,
    ).toBe(false);
    expect(
      jobUpdateSchema.safeParse({ ...valid, scheduledDate: "" }).success,
    ).toBe(false);
  });
});

describe("noteSchema", () => {
  it("verlangt Text und begrenzt die Länge", () => {
    expect(noteSchema.safeParse({ body: "  " }).success).toBe(false);
    expect(noteSchema.safeParse({ body: "x".repeat(1001) }).success).toBe(
      false,
    );
    expect(
      noteSchema.safeParse({ body: "Schlüssel beim Nachbarn" }).success,
    ).toBe(true);
  });
});
