"use client";

import { useId, useState, type ComponentProps, type ReactNode } from "react";
import { CircleAlert, Eye, EyeOff } from "lucide-react";

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1.5 flex items-center gap-1 text-sm text-rose-700">
      <CircleAlert className="size-4 shrink-0" aria-hidden="true" /> {message}
    </p>
  );
}

export function FormAlert({
  children,
  tone = "error",
}: {
  children: ReactNode;
  tone?: "error" | "success" | "info";
}) {
  const cls =
    tone === "error"
      ? "border-rose-200 bg-rose-50 text-rose-900"
      : tone === "success"
        ? "border-brand-100 bg-brand-50 text-brand-900"
        : "border-line bg-surface text-ink";
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-xl border p-3.5 text-sm ${cls}`}
    >
      {children}
    </div>
  );
}

export const inputClass = (error?: string) =>
  `h-12 w-full rounded-xl border bg-surface px-4 text-base outline-none transition focus:border-brand-500 ${
    error ? "border-rose-400" : "border-line"
  }`;

export function Field({
  label,
  error,
  hint,
  required,
  className = "",
  ...input
}: {
  label: string;
  error?: string;
  hint?: ReactNode;
  required?: boolean;
} & ComponentProps<"input">) {
  const id = useId();
  const describedBy =
    [error && `${id}-err`, hint && `${id}-hint`].filter(Boolean).join(" ") ||
    undefined;
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block font-semibold">
        {label}
        {required && <span className="text-rose-600"> *</span>}
      </label>
      <input
        id={id}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        required={required}
        className={inputClass(error)}
        {...input}
      />
      {hint && (
        <p id={`${id}-hint`} className="mt-1.5 text-sm text-muted">
          {hint}
        </p>
      )}
      <FieldError id={`${id}-err`} message={error} />
    </div>
  );
}

export function PasswordField(
  props: Omit<ComponentProps<typeof Field>, "type">,
) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Field
        {...props}
        type={show ? "text" : "password"}
        className={props.className}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute top-[2.35rem] right-2 flex size-9 items-center justify-center rounded-lg text-muted hover:text-ink"
        aria-label={show ? "Passwort verbergen" : "Passwort anzeigen"}
        aria-pressed={show}
      >
        {show ? (
          <EyeOff className="size-5" aria-hidden="true" />
        ) : (
          <Eye className="size-5" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
