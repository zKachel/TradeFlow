import { describe, expect, it } from "vitest";
import { validateJob } from "./job-schema";

const valid = {
  title: "Flur streichen",
  customerName: "Fam. Muster",
  location: "26169 Musterort",
  categoryId: "maler",
  scheduledDate: "2026-11-20",
  scheduledTime: "08:00",
  assigneeIds: ["e3"],
  note: "",
};

describe("validateJob", () => {
  it("akzeptiert einen gültigen Auftrag", () => {
    expect(validateJob(valid).success).toBe(true);
  });

  it("erlaubt Aufträge ohne Termin", () => {
    const r = validateJob({ ...valid, scheduledDate: "", scheduledTime: "" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.scheduledDate).toBeUndefined();
  });

  it("verlangt ein Datum, wenn eine Uhrzeit gesetzt ist", () => {
    const r = validateJob({ ...valid, scheduledDate: "" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.errors.scheduledDate).toBeDefined();
  });

  it("lehnt fehlende Pflichtfelder und ungültige Werte ab", () => {
    const r = validateJob({
      ...valid,
      title: "x",
      categoryId: "nope",
      scheduledTime: "25:00",
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.errors.title).toBeDefined();
      expect(r.errors.categoryId).toBeDefined();
      expect(r.errors.scheduledTime).toBeDefined();
    }
  });
});
