"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState, useState } from "react";
import { Building2, House, MailCheck } from "lucide-react";
import { registerAction, type AuthFormState } from "../actions";
import { PASSWORD_MIN } from "@/lib/auth-schema";
import { Field, FieldError, FormAlert, PasswordField } from "@/components/form";
import { Button, Card } from "@/components/ui";

export function RegisterForm() {
  const params = useSearchParams();
  const weiter = params.get("weiter") ?? "";
  const initialType =
    params.get("typ") === "betrieb" || weiter.startsWith("/betrieb")
      ? "betrieb"
      : params.get("typ") === "kunde" || weiter.startsWith("/kunde")
        ? "kunde"
        : "";
  const [type, setType] = useState<string>(initialType);
  const [state, action, pending] = useActionState<AuthFormState, FormData>(
    registerAction,
    {},
  );

  if (state.done) {
    return (
      <Card className="p-6 text-center sm:p-8">
        <MailCheck
          className="mx-auto size-12 text-brand-500"
          aria-hidden="true"
        />
        <h1 className="mt-4 text-2xl font-bold tracking-tight">
          Bitte E-Mail bestätigen
        </h1>
        <p className="mt-2 text-muted">
          Wir haben eine E-Mail an{" "}
          <strong className="text-ink">{state.email}</strong> geschickt. Klicken
          Sie auf den Link darin, um Ihr Konto zu aktivieren.
        </p>
        <p className="mt-4 text-sm text-muted">
          Keine E-Mail? Prüfen Sie den Spam-Ordner.
        </p>
      </Card>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">Konto erstellen</h1>
      <p className="mt-1 text-muted">Kostenlos in der Testphase.</p>
      {state.error && (
        <div className="mt-5">
          <FormAlert>{state.error}</FormAlert>
        </div>
      )}

      <Card className="mt-5 p-5 sm:p-6">
        <form action={action} className="space-y-5" noValidate>
          <input type="hidden" name="weiter" value={weiter} />
          <fieldset>
            <legend className="mb-2 font-semibold">
              Ich bin … <span className="text-rose-600">*</span>
            </legend>
            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  v: "kunde",
                  label: "Auftraggeber",
                  sub: "Ich suche einen Betrieb",
                  icon: House,
                },
                {
                  v: "betrieb",
                  label: "Betrieb",
                  sub: "Ich biete Leistungen an",
                  icon: Building2,
                },
              ].map((o) => (
                <label
                  key={o.v}
                  className={`flex cursor-pointer flex-col gap-1 rounded-xl border p-3 transition has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-brand-500 ${
                    type === o.v
                      ? "border-brand-500 bg-brand-50"
                      : "border-line hover:border-brand-500"
                  }`}
                >
                  <input
                    type="radio"
                    name="accountType"
                    value={o.v}
                    checked={type === o.v}
                    onChange={() => setType(o.v)}
                    className="sr-only"
                  />
                  <o.icon
                    className="size-5 text-brand-700"
                    aria-hidden="true"
                  />
                  <span className="font-semibold">{o.label}</span>
                  <span className="text-xs text-muted">{o.sub}</span>
                </label>
              ))}
            </div>
            <FieldError
              id="type-err"
              message={state.fieldErrors?.accountType}
            />
          </fieldset>

          <Field
            label={
              type === "betrieb" ? "Ihr Name (Ansprechpartner)" : "Ihr Name"
            }
            name="displayName"
            defaultValue={state.values?.displayName}
            autoComplete="name"
            required
            error={state.fieldErrors?.displayName}
          />
          <Field
            label="E-Mail"
            name="email"
            defaultValue={state.values?.email}
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            error={state.fieldErrors?.email}
          />
          <PasswordField
            label="Passwort"
            name="password"
            autoComplete="new-password"
            required
            minLength={PASSWORD_MIN}
            hint={`Mindestens ${PASSWORD_MIN} Zeichen, mit Buchstaben und Zahl.`}
            error={state.fieldErrors?.password}
          />
          <label className="flex cursor-pointer items-start gap-3 text-sm">
            <input
              type="checkbox"
              name="privacyAccepted"
              defaultChecked={state.values?.privacyAccepted === "on"}
              className="mt-0.5 size-5 shrink-0 accent-brand-700"
            />
            <span>
              Ich habe die Datenschutzhinweise gelesen.{" "}
              <span className="text-muted">
                (Testphase – endgültige Texte folgen vor dem Start.)
              </span>
            </span>
          </label>
          <FieldError
            id="privacy-err"
            message={state.fieldErrors?.privacyAccepted}
          />

          <Button
            type="submit"
            className="w-full"
            disabled={pending}
            aria-busy={pending}
          >
            {pending ? "Konto wird erstellt …" : "Konto erstellen"}
          </Button>
        </form>
      </Card>

      <p className="mt-6 text-center text-sm text-muted">
        Schon registriert?{" "}
        <Link
          href="/anmelden"
          className="font-semibold text-brand-700 hover:underline"
        >
          Anmelden
        </Link>
      </p>
    </>
  );
}
