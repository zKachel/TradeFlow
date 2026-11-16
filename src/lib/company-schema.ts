import { z } from "zod";
import { getCategory } from "./categories";
import { JOB_STATUSES } from "./types";
import { jobSchema } from "./job-schema";

export const SERVICE_RADII = [10, 20, 30, 50, 100] as const;

export const companySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Bitte den Firmennamen angeben.")
    .max(120, "Höchstens 120 Zeichen."),
  postalCode: z
    .string()
    .trim()
    .regex(/^\d{5}$/, "Bitte eine gültige 5-stellige PLZ eingeben."),
  city: z
    .string()
    .trim()
    .min(2, "Bitte einen Ort angeben.")
    .max(80, "Der Ort ist zu lang."),
  serviceRadiusKm: z.coerce
    .number()
    .refine(
      (n) => (SERVICE_RADII as readonly number[]).includes(n),
      "Bitte einen Einsatzradius wählen.",
    ),
  tradeIds: z
    .array(z.string())
    .min(1, "Bitte mindestens ein Gewerk wählen.")
    .max(40)
    .refine(
      (ids) => ids.every((id) => getCategory(id) !== undefined),
      "Unbekanntes Gewerk.",
    )
    .transform((ids) => Array.from(new Set(ids))),
});
export type CompanyInput = z.infer<typeof companySchema>;

/** Bearbeiten eines internen Auftrags (inkl. Status). */
export const jobUpdateSchema = z
  .object({
    title: jobSchema.shape.title,
    customerName: jobSchema.shape.customerName,
    location: jobSchema.shape.location,
    categoryId: jobSchema.shape.categoryId,
    scheduledDate: jobSchema.shape.scheduledDate,
    scheduledTime: jobSchema.shape.scheduledTime,
    status: z.enum(JOB_STATUSES, { error: "Ungültiger Status." }),
  })
  .refine((v) => !v.scheduledTime || v.scheduledDate, {
    message: "Bitte auch ein Datum wählen.",
    path: ["scheduledDate"],
  });

export const noteSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "Bitte eine Notiz eingeben.")
    .max(1000, "Höchstens 1000 Zeichen."),
});

export function zodErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of error.issues) {
    const k = i.path.join(".") || "_form";
    if (!out[k]) out[k] = i.message;
  }
  return out;
}
