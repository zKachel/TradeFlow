"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { loginAction, type AuthFormState } from "../actions";
import { Field, FormAlert, PasswordField } from "@/components/form";
import { Button, Card } from "@/components/ui";

export function LoginForm() {
  const params = useSearchParams();
  const weiter = params.get("weiter") ?? "";
  const [state, action, pending] = useActionState<AuthFormState, FormData>(
    loginAction,
    {},
  );

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">Anmelden</h1>
      <p className="mt-1 text-muted">Für Auftraggeber und Betriebe.</p>

      <div className="mt-5 space-y-3">
        {params.get("abgemeldet") && (
          <FormAlert tone="success">Sie wurden abgemeldet.</FormAlert>
        )}
        {params.get("bestaetigt") && (
          <FormAlert tone="success">
            E-Mail bestätigt. Bitte melden Sie sich an.
          </FormAlert>
        )}
        {params.get("fehler") === "link" && (
          <FormAlert>
            Der Link ist ungültig oder abgelaufen. Bitte melden Sie sich an oder
            fordern Sie einen neuen Link an.
          </FormAlert>
        )}
        {state.error && <FormAlert>{state.error}</FormAlert>}
      </div>

      <Card className="mt-5 p-5 sm:p-6">
        <form action={action} className="space-y-4" noValidate>
          <input type="hidden" name="weiter" value={weiter} />
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
            autoComplete="current-password"
            required
            error={state.fieldErrors?.password}
          />
          <div className="text-right text-sm">
            <Link
              href="/passwort-vergessen"
              className="font-semibold text-brand-700 hover:underline"
            >
              Passwort vergessen?
            </Link>
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={pending}
            aria-busy={pending}
          >
            {pending ? "Wird angemeldet …" : "Anmelden"}
          </Button>
        </form>
      </Card>

      <p className="mt-6 text-center text-sm text-muted">
        Noch kein Konto?{" "}
        <Link
          href={
            weiter
              ? `/registrieren?weiter=${encodeURIComponent(weiter)}`
              : "/registrieren"
          }
          className="font-semibold text-brand-700 hover:underline"
        >
          Jetzt registrieren
        </Link>
      </p>
    </>
  );
}
