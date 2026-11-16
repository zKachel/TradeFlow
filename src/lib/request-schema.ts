import { z } from "zod";
import { type Category, type FieldDef, getCategory } from "./categories";
import { URGENCIES, type DetailValue } from "./types";

/**
 * Validierung für Kundenanfragen.
 * Wird im Demo-Formular im Browser genutzt und ab Sprint 2 identisch serverseitig
 * (Server Action / Route Handler) wiederverwendet – der Server bleibt die maßgebliche Prüfung.
 */

const emptyToUndefined = (v: unknown) =>
  v === "" || v === null || (typeof v === "number" && Number.isNaN(v))
    ? undefined
    : v;

export const baseRequestSchema = z.object({
  categoryId: z
    .string({ error: "Bitte wählen Sie eine Kategorie." })
    .refine(
      (id) => getCategory(id) !== undefined,
      "Bitte wählen Sie eine Kategorie.",
    ),
  title: z
    .string()
    .trim()
    .min(5, "Der Titel braucht mindestens 5 Zeichen.")
    .max(100, "Der Titel darf höchstens 100 Zeichen haben."),
  description: z
    .string()
    .trim()
    .min(20, "Bitte beschreiben Sie die Arbeit in mindestens 20 Zeichen.")
    .max(2000, "Die Beschreibung darf höchstens 2000 Zeichen haben."),
  postalCode: z
    .string()
    .trim()
    .regex(/^\d{5}$/, "Bitte geben Sie eine gültige 5-stellige PLZ ein."),
  city: z
    .string()
    .trim()
    .min(2, "Bitte geben Sie einen Ort an.")
    .max(80, "Der Ort ist zu lang."),
  urgency: z.enum(URGENCIES, { error: "Bitte wählen Sie einen Zeitraum." }),
  budget: z.preprocess(
    emptyToUndefined,
    z.coerce
      .number({ error: "Bitte geben Sie eine Zahl ein." })
      .min(0, "Das Budget kann nicht negativ sein.")
      .max(1_000_000, "Bitte prüfen Sie das Budget.")
      .optional(),
  ),
  privacyAccepted: z.literal(true, {
    error: "Bitte bestätigen Sie den Datenschutzhinweis.",
  }),
});

export type BaseRequestInput = z.infer<typeof baseRequestSchema>;

function innerFieldSchema(field: FieldDef): z.ZodType {
  const unit = field.unit ? " " + field.unit : "";
  switch (field.type) {
    case "number": {
      let num = z.coerce.number({ error: "Bitte eine Zahl eingeben." });
      if (field.min !== undefined)
        num = num.min(field.min, `Mindestens ${field.min}${unit}.`);
      if (field.max !== undefined)
        num = num.max(field.max, `Höchstens ${field.max}${unit}.`);
      return num;
    }
    case "select": {
      const values = (field.options ?? []).map((o) => o.value);
      return z
        .string()
        .refine((v) => values.includes(v), "Bitte eine Option wählen.");
    }
    case "boolean":
      return z.boolean({ error: "Bitte Ja oder Nein wählen." });
    case "text":
      return z.string().trim().max(500, "Höchstens 500 Zeichen.");
  }
}

function fieldSchema(field: FieldDef): z.ZodType {
  const inner = innerFieldSchema(field);
  if (!field.required) return z.preprocess(emptyToUndefined, inner.optional());
  const missing =
    field.type === "select" || field.type === "boolean"
      ? "Bitte eine Option wählen."
      : "Bitte ausfüllen.";
  return z.preprocess(
    emptyToUndefined,
    z
      .any()
      .refine((v) => v !== undefined, missing)
      .pipe(inner),
  );
}

/** Baut das Validierungsschema für die Zusatzfelder einer Kategorie. */
export function buildDetailsSchema(category: Category) {
  const shape: Record<string, z.ZodType> = {};
  for (const field of category.fields) shape[field.id] = fieldSchema(field);
  return z.object(shape).strip();
}

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: Record<string, string> };

function toErrors(error: z.ZodError, prefix = ""): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = prefix + (issue.path.join(".") || "_form");
    if (!errors[key]) errors[key] = issue.message;
  }
  return errors;
}

export function validateBase(
  input: unknown,
): ValidationResult<BaseRequestInput> {
  const r = baseRequestSchema.safeParse(input);
  return r.success
    ? { success: true, data: r.data }
    : { success: false, errors: toErrors(r.error) };
}

export function validateDetails(
  categoryId: string,
  details: Record<string, unknown>,
): ValidationResult<Record<string, DetailValue>> {
  const category = getCategory(categoryId);
  if (!category)
    return {
      success: false,
      errors: { categoryId: "Bitte wählen Sie eine Kategorie." },
    };
  const r = buildDetailsSchema(category).safeParse(details);
  if (!r.success)
    return { success: false, errors: toErrors(r.error, "details.") };
  const clean: Record<string, DetailValue> = {};
  for (const [k, v] of Object.entries(r.data)) {
    if (v !== undefined) clean[k] = v as DetailValue;
  }
  return { success: true, data: clean };
}

/**
 * Regelbasierte Rückfragen bei fehlenden optionalen Angaben (Masterplan: "sinnvolle Rückfragen").
 * Keine KI, keine Preis- oder Diagnoseaussagen.
 */
export function followUpQuestions(
  categoryId: string,
  details: Record<string, unknown>,
): string[] {
  const category = getCategory(categoryId);
  if (!category) return [];
  return category.fields
    .filter(
      (f) =>
        f.followUp &&
        !f.required &&
        emptyToUndefined(details[f.id]) === undefined,
    )
    .map((f) => f.followUp as string);
}

/* ---------- Fotos ---------- */

export const PHOTO_LIMITS = {
  maxFiles: 6,
  maxBytes: 10 * 1024 * 1024,
  types: ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"],
} as const;

export function validatePhotos(
  files: { name: string; type: string; size: number }[],
): string[] {
  const errors: string[] = [];
  if (files.length > PHOTO_LIMITS.maxFiles)
    errors.push(`Maximal ${PHOTO_LIMITS.maxFiles} Fotos pro Anfrage.`);
  for (const f of files) {
    if (!(PHOTO_LIMITS.types as readonly string[]).includes(f.type))
      errors.push(`„${f.name}“: Nur JPG, PNG, WebP oder HEIC erlaubt.`);
    else if (f.size > PHOTO_LIMITS.maxBytes)
      errors.push(`„${f.name}“ ist größer als 10 MB.`);
  }
  return errors;
}
