"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordResetAction, type AuthFormState } from "../actions";
import { Field, FormAlert } from "@/components/form";
import { Button, Card } from "@/components/ui";

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(
    requestPasswordResetAction,
    {},
  );

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">Passwort vergessen</h1>
      <p className="mt-1 text-muted">
        Wir schicken Ihnen einen Link zum Zurücksetzen.
      </p>
      <div className="mt-5">
        {state.done ? (
          <FormAlert tone="success">
            Falls ein Konto mit <strong>{state.email}</strong> existiert, haben
            wir eine E-Mail geschickt. Der Link ist eine Stunde gültig.
          </FormAlert>
        ) : (
          state.error && <FormAlert>{state.error}</FormAlert>
        )}
      </div>
      {!state.done && (
        <Card className="mt-5 p-5 sm:p-6">
          <form action={action} className="space-y-4" noValidate>
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
            <Button
              type="submit"
              className="w-full"
              disabled={pending}
              aria-busy={pending}
            >
              {pending ? "Wird gesendet …" : "Link senden"}
            </Button>
          </form>
        </Card>
      )}
      <p className="mt-6 text-center text-sm">
        <Link
          href="/anmelden"
          className="font-semibold text-brand-700 hover:underline"
        >
          Zurück zur Anmeldung
        </Link>
      </p>
    </>
  );
}
