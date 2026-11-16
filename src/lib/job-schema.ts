import { z } from "zod";
import { getCategory } from "./categories";

/** Validierung für interne Firmenaufträge (manuelle Erstellung). */
export const jobSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, "Bitte einen Titel mit mindestens 3 Zeichen.")
      .max(120, "Höchstens 120 Zeichen."),
    customerName: z
      .string()
      .trim()
      .min(2, "Bitte einen Kundennamen angeben.")
      .max(120, "Höchstens 120 Zeichen."),
    location: z
      .string()
      .trim()
      .min(2, "Bitte einen Ort angeben.")
      .max(120, "Höchstens 120 Zeichen."),
    categoryId: z
      .string()
      .refine(
        (id) => getCategory(id) !== undefined,
        "Bitte ein Gewerk wählen.",
      ),
    scheduledDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Ungültiges Datum.")
      .optional()
      .or(z.literal("").transform(() => undefined)),
    scheduledTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Ungültige Uhrzeit.")
      .optional()
      .or(z.literal("").transform(() => undefined)),
    assigneeIds: z.array(z.string()).max(20),
    note: z.string().trim().max(1000, "Höchstens 1000 Zeichen.").optional(),
  })
  .refine((v) => !v.scheduledTime || v.scheduledDate, {
    message: "Bitte auch ein Datum wählen.",
    path: ["scheduledDate"],
  });

export type JobInput = z.infer<typeof jobSchema>;

export function validateJob(
  input: unknown,
):
  | { success: true; data: JobInput }
  | { success: false; errors: Record<string, string> } {
  const r = jobSchema.safeParse(input);
  if (r.success) return { success: true, data: r.data };
  const errors: Record<string, string> = {};
  for (const i of r.error.issues) {
    const k = i.path.join(".") || "_form";
    if (!errors[k]) errors[k] = i.message;
  }
  return { success: false, errors };
}
