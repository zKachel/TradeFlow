import { z } from "zod";

/** Validierung der Auth-Formulare – identisch im Browser und in den Server Actions. */

const email = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, "E-Mail-Adresse ist zu lang.")
  .pipe(z.email("Bitte eine gültige E-Mail-Adresse eingeben."));

export const PASSWORD_MIN = 10;
const password = z
  .string()
  .min(PASSWORD_MIN, `Mindestens ${PASSWORD_MIN} Zeichen.`)
  .max(72, "Höchstens 72 Zeichen.")
  .refine(
    (p) => /[A-Za-zÄÖÜäöüß]/.test(p) && /[0-9]/.test(p),
    "Bitte Buchstaben und mindestens eine Zahl verwenden.",
  );

export const registerSchema = z.object({
  accountType: z.enum(["kunde", "betrieb"], {
    error: "Bitte wählen Sie eine Kontoart.",
  }),
  displayName: z
    .string()
    .trim()
    .min(2, "Bitte geben Sie Ihren Namen an.")
    .max(80, "Höchstens 80 Zeichen."),
  email,
  password,
  privacyAccepted: z.literal(true, {
    error: "Bitte bestätigen Sie den Datenschutzhinweis.",
  }),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Bitte Passwort eingeben.").max(200),
});

export const resetRequestSchema = z.object({ email });

export const newPasswordSchema = z
  .object({ password, passwordRepeat: z.string() })
  .refine((v) => v.password === v.passwordRepeat, {
    message: "Die Passwörter stimmen nicht überein.",
    path: ["passwordRepeat"],
  });

export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of error.issues) {
    const k = i.path.join(".") || "_form";
    if (!out[k]) out[k] = i.message;
  }
  return out;
}

export const SERVICE_UNAVAILABLE =
  "Der Anmeldedienst ist gerade nicht erreichbar. Bitte prüfen Sie Ihre Verbindung und versuchen Sie es gleich noch einmal.";

/** Netzwerk-/Serverfehler (Auth-Server nicht erreichbar) von falschen Zugangsdaten unterscheiden. */
export function isAuthServiceError(
  error: { status?: number; name?: string } | null | undefined,
): boolean {
  if (!error) return false;
  return (
    error.name === "AuthRetryableFetchError" ||
    error.status === 0 ||
    (typeof error.status === "number" && error.status >= 500)
  );
}

/** Übersetzt Supabase-Auth-Fehler in verständliche deutsche Meldungen (ohne Konten zu verraten). */
export function authErrorMessage(
  code: string | undefined,
  fallback = "Das hat nicht geklappt. Bitte später erneut versuchen.",
): string {
  switch (code) {
    case "invalid_credentials":
      return "E-Mail oder Passwort ist falsch.";
    case "email_not_confirmed":
      return "Bitte bestätigen Sie zuerst Ihre E-Mail-Adresse (Link in der E-Mail).";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Zu viele Versuche. Bitte warten Sie ein paar Minuten.";
    case "weak_password":
      return "Das Passwort ist zu schwach. Bitte ein längeres Passwort wählen.";
    case "same_password":
      return "Das neue Passwort muss sich vom alten unterscheiden.";
    case "signup_disabled":
      return "Registrierungen sind derzeit geschlossen.";
    default:
      return fallback;
  }
}
