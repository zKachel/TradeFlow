"use client";

import { useActionState } from "react";
import { updatePasswordAction, type AuthFormState } from "../actions";
import { PASSWORD_MIN } from "@/lib/auth-schema";
import { FormAlert, PasswordField } from "@/components/form";
import { Button, Card } from "@/components/ui";

export default function NewPasswordPage() {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(
    updatePasswordAction,
    {},
  );
  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">
        Neues Passwort festlegen
      </h1>
      {state.error && (
        <div className="mt-5">
          <FormAlert>{state.error}</FormAlert>
        </div>
      )}
      <Card className="mt-5 p-5 sm:p-6">
        <form action={action} className="space-y-4" noValidate>
          <PasswordField
            label="Neues Passwort"
            name="password"
            autoComplete="new-password"
            required
            hint={`Mindestens ${PASSWORD_MIN} Zeichen, mit Buchstaben und Zahl.`}
            error={state.fieldErrors?.password}
          />
          <PasswordField
            label="Passwort wiederholen"
            name="passwordRepeat"
            autoComplete="new-password"
            required
            error={state.fieldErrors?.passwordRepeat}
          />
          <Button
            type="submit"
            className="w-full"
            disabled={pending}
            aria-busy={pending}
          >
            {pending ? "Wird gespeichert …" : "Passwort speichern"}
          </Button>
        </form>
      </Card>
    </>
  );
}
