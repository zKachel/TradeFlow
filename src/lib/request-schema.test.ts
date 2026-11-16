import { describe, expect, it } from "vitest";
import { CATEGORIES, getCategory } from "./categories";
import {
  followUpQuestions,
  validateBase,
  validateDetails,
  validatePhotos,
} from "./request-schema";

const validBase = {
  categoryId: "maler",
  title: "Wohnzimmer streichen",
  description:
    "Zwei Wände und die Decke im Wohnzimmer sollen neu gestrichen werden.",
  postalCode: "26169",
  city: "Friesoythe",
  urgency: "in_4_wochen",
  budget: "",
  privacyAccepted: true,
};

describe("Kategorien", () => {
  it("haben eindeutige IDs", () => {
    const ids = CATEGORIES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("haben eindeutige Feld-IDs je Kategorie und Optionen für Auswahlfelder", () => {
    for (const c of CATEGORIES) {
      const ids = c.fields.map((f) => f.id);
      expect(new Set(ids).size, c.id).toBe(ids.length);
      for (const f of c.fields) {
        if (f.type === "select")
          expect(f.options?.length, `${c.id}.${f.id}`).toBeGreaterThan(0);
      }
    }
  });

  it("enthalten die Kategorien aus dem Masterplan", () => {
    for (const id of [
      "maler",
      "bodenbelaege",
      "heckenschnitt",
      "entruempelung",
      "dach",
      "sanitaer",
      "sonstiges",
    ]) {
      expect(getCategory(id), id).toBeDefined();
    }
  });
});

describe("Pilot-Kategorien", () => {
  const PILOT = [
    "maler",
    "rasenpflege",
    "heckenschnitt",
    "entruempelung",
    "bodenbelaege",
    "reinigung",
    "moebelmontage",
    "kuechenmontage",
    "pflaster",
    "terrassenbau",
    "sanitaer",
  ];

  it("alle 32 Kategorien bleiben erhalten", () => {
    expect(CATEGORIES).toHaveLength(32);
  });

  it("die 8 Pilot-Bereiche (11 Kategorien) haben ausführliche Fragen", () => {
    for (const id of PILOT) {
      const c = getCategory(id)!;
      expect(c.featured, id).toBe(true);
      expect(c.fields.length, id).toBeGreaterThanOrEqual(4);
      expect(
        c.fields.some((f) => f.required),
        id,
      ).toBe(true);
    }
  });

  it("Pflichtfelder der Pilot-Kategorien werden geprüft", () => {
    expect(validateDetails("reinigung", {}).success).toBe(false);
    expect(validateDetails("reinigung", { art: "fenster" }).success).toBe(true);
    expect(
      validateDetails("entruempelung", {
        raeume: "2",
        inhalt: "hausrat",
        etage: "eg",
      }).success,
    ).toBe(true);
    expect(validateDetails("sanitaer", { art: "leck" }).success).toBe(false);
    expect(
      validateDetails("sanitaer", { art: "leck", objekt: "haus" }).success,
    ).toBe(true);
  });
});

describe("validateBase", () => {
  it("akzeptiert eine gültige Anfrage", () => {
    const r = validateBase(validBase);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.budget).toBeUndefined();
  });

  it("lehnt ungültige PLZ ab", () => {
    const r = validateBase({ ...validBase, postalCode: "123" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.errors.postalCode).toMatch(/PLZ/);
  });

  it("verlangt die Datenschutz-Bestätigung", () => {
    const r = validateBase({ ...validBase, privacyAccepted: false });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.errors.privacyAccepted).toBeDefined();
  });

  it("lehnt unbekannte Kategorie ab", () => {
    const r = validateBase({ ...validBase, categoryId: "gibt-es-nicht" });
    expect(r.success).toBe(false);
  });

  it("lehnt negatives Budget ab und wandelt gültiges Budget in Zahl um", () => {
    expect(validateBase({ ...validBase, budget: "-5" }).success).toBe(false);
    const ok = validateBase({ ...validBase, budget: "1500" });
    expect(ok.success && ok.data.budget).toBe(1500);
  });
});

describe("validateDetails", () => {
  it("verlangt Pflichtfelder der Kategorie", () => {
    const r = validateDetails("maler", {});
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.errors["details.flaeche"]).toBeDefined();
      expect(r.errors["details.bereich"]).toBeDefined();
    }
  });

  it("akzeptiert gültige Angaben und wandelt Zahlen um", () => {
    const r = validateDetails("maler", {
      flaeche: "45",
      bereich: "innen",
      zustand: "",
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data).toEqual({ flaeche: 45, bereich: "innen" });
  });

  it("lehnt Werte außerhalb des Bereichs und ungültige Optionen ab", () => {
    expect(
      validateDetails("maler", { flaeche: "0", bereich: "innen" }).success,
    ).toBe(false);
    expect(
      validateDetails("maler", { flaeche: "10", bereich: "dach" }).success,
    ).toBe(false);
  });

  it("entfernt unbekannte Felder", () => {
    const r = validateDetails("sonstiges", { hacker: "<script>" });
    expect(r.success && r.data).toEqual({});
  });
});

describe("followUpQuestions", () => {
  it("stellt Rückfragen für leere optionale Felder", () => {
    const q = followUpQuestions("maler", { flaeche: 20, bereich: "innen" });
    // raeume, zustand, untergrund, moebliert
    expect(q.length).toBe(4);
  });

  it("stellt keine Rückfragen, wenn alles ausgefüllt ist", () => {
    const q = followUpQuestions("maler", {
      flaeche: 20,
      bereich: "innen",
      zustand: "gut",
      untergrund: "putz",
      raeume: 3,
      moebliert: false,
    });
    expect(q).toEqual([]);
  });
});

describe("validatePhotos", () => {
  it("akzeptiert gültige Bilder", () => {
    expect(
      validatePhotos([{ name: "a.jpg", type: "image/jpeg", size: 1000 }]),
    ).toEqual([]);
  });

  it("lehnt falsche Typen, zu große Dateien und zu viele Dateien ab", () => {
    expect(
      validatePhotos([
        { name: "x.exe", type: "application/x-msdownload", size: 10 },
      ]),
    ).toHaveLength(1);
    expect(
      validatePhotos([
        { name: "big.png", type: "image/png", size: 11 * 1024 * 1024 },
      ]),
    ).toHaveLength(1);
    const many = Array.from({ length: 7 }, (_, i) => ({
      name: `${i}.png`,
      type: "image/png",
      size: 10,
    }));
    expect(validatePhotos(many).length).toBeGreaterThan(0);
  });
});
