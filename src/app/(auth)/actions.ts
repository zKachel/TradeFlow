"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  SERVICE_UNAVAILABLE,
  authErrorMessage,
  isAuthServiceError,
  fieldErrors,
  loginSchema,
  newPasswordSchema,
  registerSchema,
  resetRequestSchema,
} from "@/lib/auth-schema";
import { homePathFor } from "@/lib/auth";
import { safeNext } from "@/lib/safe-next";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export interface AuthFormState {
  error?: string;
  fieldErrors?: Record<string, string>;
  done?: boolean;
  email?: string;
  /** Eingaben zurückgeben, damit das Formular nach einem Fehler nicht leer ist (nie das Passwort). */
  values?: Record<string, string>;
}

const keep = (formData: FormData, ...names: string[]) =>
  Object.fromEntries(names.map((n) => [n, String(formData.get(n) ?? "")]));

const NOT_CONFIGURED: AuthFormState = {
  error:
    "Die Anmeldung ist noch nicht eingerichtet (Supabase fehlt). Siehe docs/SUPABASE_SETUP.md.",
};

async function siteUrl() {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto =
    h.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function registerAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const parsed = registerSchema.safeParse({
    accountType: formData.get("accountType"),
    displayName: formData.get("displayName"),
    email: formData.get("email"),
    password: formData.get("password"),
    privacyAccepted: formData.get("privacyAccepted") === "on",
  });
  const values = keep(formData, "displayName", "email", "privacyAccepted");
  if (!parsed.success)
    return { fieldErrors: fieldErrors(parsed.error), values };

  const next = safeNext(
    formData.get("weiter"),
    homePathFor(parsed.data.accountType),
  );
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${await siteUrl()}/auth/confirm?next=${encodeURIComponent(next)}`,
      // Wird vom Datenbank-Trigger in public.profiles übernommen (nur 'kunde' oder 'betrieb').
      data: {
        account_type: parsed.data.accountType,
        display_name: parsed.data.displayName,
      },
    },
  });
  if (error)
    return {
      error: isAuthServiceError(error)
        ? SERVICE_UNAVAILABLE
        : authErrorMessage(error.code),
      values,
    };

  // Ist die E-Mail-Bestätigung abgeschaltet, gibt es sofort eine Sitzung.
  if (data.session)
    redirect(
      parsed.data.accountType === "betrieb" ? "/betrieb-einrichten" : next,
    );
  // Sonst (Standard): Bestätigungs-E-Mail. Aus Datenschutzgründen dieselbe Antwort,
  // auch wenn die Adresse schon registriert ist.
  return { done: true, email: parsed.data.email };
}

export async function loginAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  const values = keep(formData, "email");
  if (!parsed.success)
    return { fieldErrors: fieldErrors(parsed.error), values };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (isAuthServiceError(error)) return { error: SERVICE_UNAVAILABLE, values };
  if (error || !data.user)
    return {
      error: authErrorMessage(error?.code, "E-Mail oder Passwort ist falsch."),
      values,
    };

  const { data: profile } = await supabase
    .from("profiles")
    .select("account_type")
    .eq("id", data.user.id)
    .maybeSingle();
  const home = homePathFor(
    (profile?.account_type ?? "kunde") as "kunde" | "betrieb",
  );
  const wanted = safeNext(formData.get("weiter"), home);
  // Nur in den eigenen Bereich weiterleiten.
  const allowed = wanted.startsWith(home) || !/^\/(kunde|betrieb)/.test(wanted);
  redirect(allowed ? wanted : home);
}

export async function requestPasswordResetAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const parsed = resetRequestSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success)
    return {
      fieldErrors: fieldErrors(parsed.error),
      values: keep(formData, "email"),
    };
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    {
      redirectTo: `${await siteUrl()}/auth/confirm?next=/passwort-neu`,
    },
  );
  if (isAuthServiceError(error))
    return { error: SERVICE_UNAVAILABLE, values: keep(formData, "email") };
  if (
    error &&
    (error.code === "over_email_send_rate_limit" ||
      error.code === "over_request_rate_limit")
  ) {
    return { error: authErrorMessage(error.code) };
  }
  // Immer gleiche Antwort – verrät nicht, ob ein Konto existiert.
  return { done: true, email: parsed.data.email };
}

export async function updatePasswordAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const parsed = newPasswordSchema.safeParse({
    password: formData.get("password"),
    passwordRepeat: formData.get("passwordRepeat"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user)
    return {
      error: "Der Link ist abgelaufen. Bitte fordern Sie einen neuen an.",
    };
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (error)
    return {
      error: isAuthServiceError(error)
        ? SERVICE_UNAVAILABLE
        : authErrorMessage(error.code),
    };
  const { data: profile } = await supabase
    .from("profiles")
    .select("account_type")
    .eq("id", userData.user.id)
    .maybeSingle();
  redirect(
    homePathFor((profile?.account_type ?? "kunde") as "kunde" | "betrieb"),
  );
}

export async function logoutAction() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/anmelden?abgemeldet=1");
}
