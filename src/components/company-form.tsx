"use client";

import { useActionState, useState } from "react";
import { categoriesByGroup } from "@/lib/categories";
import { SERVICE_RADII } from "@/lib/company-schema";
import type { CompanyFormState } from "@/app/betrieb/actions";
import { Field, FieldError, FormAlert } from "./form";
import { Button, Card } from "./ui";

export interface CompanyFormValues {
  name: string;
  postalCode: string;
  city: string;
  serviceRadiusKm: number;
  tradeIds: string[];
}

export function CompanyForm({
  action,
  initial,
  submitLabel,
}: {
  action: (prev: CompanyFormState, fd: FormData) => Promise<CompanyFormState>;
  initial?: CompanyFormValues;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState<
    CompanyFormState,
    FormData
  >(action, {});
  // Kontrollierte Felder: bleiben bei Fehlern erhalten.
  const [v, setV] = useState<CompanyFormValues>(
    initial ?? {
      name: "",
      postalCode: "",
      city: "",
      serviceRadiusKm: 30,
      tradeIds: [],
    },
  );
  const toggle = (id: string) =>
    setV((s) => ({
      ...s,
      tradeIds: s.tradeIds.includes(id)
        ? s.tradeIds.filter((x) => x !== id)
        : [...s.tradeIds, id],
    }));

  return (
    <form action={formAction} noValidate className="space-y-5">
      {state.error && <FormAlert>{state.error}</FormAlert>}
      {state.saved && <FormAlert tone="success">Gespeichert.</FormAlert>}
      <Card className="space-y-4 p-5 sm:p-6">
        <Field
          label="Firmenname"
          name="name"
          required
          value={v.name}
          onChange={(e) => setV({ ...v, name: e.target.value })}
          error={state.fieldErrors?.name}
          autoComplete="organization"
        />
        <div className="grid gap-4 sm:grid-cols-[9rem_1fr]">
          <Field
            label="PLZ"
            name="postalCode"
            required
            inputMode="numeric"
            value={v.postalCode}
            onChange={(e) =>
              setV({
                ...v,
                postalCode: e.target.value.replace(/\D/g, "").slice(0, 5),
              })
            }
            error={state.fieldErrors?.postalCode}
            autoComplete="postal-code"
          />
          <Field
            label="Ort"
            name="city"
            required
            value={v.city}
            onChange={(e) => setV({ ...v, city: e.target.value })}
            error={state.fieldErrors?.city}
            autoComplete="address-level2"
          />
        </div>
        <fieldset>
          <legend className="mb-1.5 font-semibold">
            Einsatzradius <span className="text-rose-600">*</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {SERVICE_RADII.map((r) => (
              <label
                key={r}
                className={`flex min-h-11 cursor-pointer items-center rounded-xl border px-4 font-medium has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-brand-500 ${
                  v.serviceRadiusKm === r
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-line bg-surface"
                }`}
              >
                <input
                  type="radio"
                  name="serviceRadiusKm"
                  value={r}
                  checked={v.serviceRadiusKm === r}
                  onChange={() => setV({ ...v, serviceRadiusKm: r })}
                  className="sr-only"
                />
                {r} km
              </label>
            ))}
          </div>
          <FieldError
            id="radius-err"
            message={state.fieldErrors?.serviceRadiusKm}
          />
        </fieldset>
      </Card>

      <Card className="p-5 sm:p-6">
        <fieldset>
          <legend className="font-semibold">
            Ihre Gewerke <span className="text-rose-600">*</span>
          </legend>
          <p className="mt-1 text-sm text-muted">
            Wählen Sie, welche Arbeiten Sie anbieten. Das ist keine Bestätigung
            einer Qualifikation oder Zulassung.
          </p>
          <FieldError id="trades-err" message={state.fieldErrors?.tradeIds} />
          <div className="mt-4 space-y-4">
            {categoriesByGroup()
              .filter((g) => g.group.id !== "sonstiges")
              .map(({ group, categories }) => (
                <div key={group.id}>
                  <p className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">
                    {group.label}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((c) => {
                      const on = v.tradeIds.includes(c.id);
                      return (
                        <label
                          key={c.id}
                          className={`flex cursor-pointer items-center rounded-full border px-3 py-1.5 text-sm font-medium has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-brand-500 ${
                            on
                              ? "border-brand-500 bg-brand-50 text-brand-700"
                              : "border-line bg-surface hover:border-brand-500"
                          }`}
                        >
                          <input
                            type="checkbox"
                            name="tradeIds"
                            value={c.id}
                            checked={on}
                            onChange={() => toggle(c.id)}
                            className="sr-only"
                          />
                          {c.label}
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
          </div>
        </fieldset>
      </Card>

      <Button
        type="submit"
        size="lg"
        className="w-full sm:w-auto"
        disabled={pending}
        aria-busy={pending}
      >
        {pending ? "Wird gespeichert …" : submitLabel}
      </Button>
    </form>
  );
}
