"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  CircleAlert,
  CircleCheck,
  Lightbulb,
  Lock,
  Search,
  X,
} from "lucide-react";
import {
  categoriesByGroup,
  describeDetails,
  getCategory,
  type FieldDef,
} from "@/lib/categories";
import { addDemoRequest, newDemoId } from "@/lib/demo-store";
import {
  PHOTO_LIMITS,
  followUpQuestions,
  validateBase,
  validateDetails,
  validatePhotos,
} from "@/lib/request-schema";
import { URGENCIES, URGENCY_LABELS, type Urgency } from "@/lib/types";
import { Button, Card, LinkButton } from "@/components/ui";

const STEPS = [
  "Kategorie",
  "Beschreibung",
  "Ort & Zeit",
  "Fotos & Prüfen",
] as const;

type DetailInput = Record<string, string | boolean>;

interface FormValues {
  categoryId: string;
  title: string;
  description: string;
  postalCode: string;
  city: string;
  urgency: Urgency | "";
  budget: string;
  details: DetailInput;
  privacyAccepted: boolean;
}

interface Photo {
  id: string;
  file: File;
  url: string;
}

function omit(obj: Record<string, string>, key: string) {
  const copy = { ...obj };
  delete copy[key];
  return copy;
}

const STEP_FIELDS: Record<number, string[]> = {
  1: ["title", "description"],
  2: ["postalCode", "city", "urgency", "budget"],
};

export function RequestForm() {
  const params = useSearchParams();
  const preselected = params.get("kategorie");
  const initialCategory =
    preselected && getCategory(preselected) ? preselected : "";

  const [step, setStep] = useState(initialCategory ? 1 : 0);
  const [values, setValues] = useState<FormValues>({
    categoryId: initialCategory,
    title: "",
    description: "",
    postalCode: "",
    city: "",
    urgency: "",
    budget: "",
    details: {},
    privacyAccepted: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [photoErrors, setPhotoErrors] = useState<string[]>([]);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  const category = getCategory(values.categoryId);

  // Fokus beim Schrittwechsel auf die Überschrift setzen (Screenreader, Tastatur).
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step, submittedId]);

  // Objekt-URLs der Vorschaubilder freigeben.
  const objectUrls = useRef(new Set<string>());
  useEffect(() => {
    const urls = objectUrls.current;
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  function update<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => omit(e, key));
  }

  function updateDetail(id: string, value: string | boolean) {
    setValues((v) => ({ ...v, details: { ...v.details, [id]: value } }));
    setErrors((e) => omit(e, `details.${id}`));
  }

  function chooseCategory(id: string) {
    setValues((v) => ({
      ...v,
      categoryId: id,
      details: id === v.categoryId ? v.details : {},
    }));
    setErrors({});
    setStep(1);
  }

  function validateStep(s: number): Record<string, string> {
    if (s === 0)
      return values.categoryId
        ? {}
        : { categoryId: "Bitte wählen Sie eine Kategorie." };
    const base = validateBase({ ...values, privacyAccepted: true });
    const baseErrors = base.success ? {} : base.errors;
    const stepErrors: Record<string, string> = {};
    for (const k of STEP_FIELDS[s] ?? [])
      if (baseErrors[k]) stepErrors[k] = baseErrors[k];
    if (s === 1) {
      const d = validateDetails(values.categoryId, values.details);
      if (!d.success) Object.assign(stepErrors, d.errors);
    }
    return stepErrors;
  }

  function next() {
    const e = validateStep(step);
    setErrors(e);
    if (Object.keys(e).length === 0)
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function back() {
    setErrors({});
    setStep((s) => Math.max(s - 1, 0));
  }

  function addPhotos(list: FileList | null) {
    if (!list) return;
    const incoming = Array.from(list);
    const all = [...photos.map((p) => p.file), ...incoming];
    const errs = validatePhotos(
      all.map((f) => ({ name: f.name, type: f.type, size: f.size })),
    );
    setPhotoErrors(errs);
    if (errs.length) return;
    const added = incoming.map((file) => ({
      id: newDemoId("foto"),
      file,
      url: URL.createObjectURL(file),
    }));
    added.forEach((p) => objectUrls.current.add(p.url));
    setPhotos((p) => [...p, ...added]);
  }

  function removePhoto(id: string) {
    setPhotos((p) => {
      const target = p.find((x) => x.id === id);
      if (target) {
        URL.revokeObjectURL(target.url);
        objectUrls.current.delete(target.url);
      }
      return p.filter((x) => x.id !== id);
    });
    setPhotoErrors([]);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (step < STEPS.length - 1) {
      next();
      return;
    }
    const base = validateBase(values);
    const details = validateDetails(values.categoryId, values.details);
    if (!base.success || !details.success) {
      const all = {
        ...(base.success ? {} : base.errors),
        ...(details.success ? {} : details.errors),
      };
      setErrors(all);
      // Zum ersten Schritt mit Fehler springen (außer es fehlt nur die Datenschutz-Bestätigung).
      const firstStep = [1, 2].find((s) =>
        Object.keys(all).some(
          (k) =>
            (s === 1 && k.startsWith("details.")) || STEP_FIELDS[s].includes(k),
        ),
      );
      if (firstStep !== undefined) setStep(firstStep);
      return;
    }
    const id = newDemoId("anfrage");
    addDemoRequest({
      id,
      isDemo: true,
      categoryId: base.data.categoryId,
      title: base.data.title,
      description: base.data.description,
      postalCode: base.data.postalCode,
      city: base.data.city,
      urgency: base.data.urgency,
      budget: base.data.budget,
      details: details.data,
      photoCount: photos.length,
      status: "eingereicht",
      createdAt: new Date().toISOString().slice(0, 10),
      offerCount: 0,
    });
    setSubmittedId(id);
  }

  if (submittedId) {
    return (
      <Card className="p-6 text-center sm:p-10">
        <CircleCheck
          className="mx-auto size-14 text-brand-500"
          aria-hidden="true"
        />
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="mt-4 text-2xl font-bold tracking-tight"
        >
          Anfrage eingereicht (Demo)
        </h1>
        <p className="mx-auto mt-2 max-w-md text-muted">
          In der echten Version wird Ihre Anfrage jetzt kurz geprüft und dann
          passenden Betrieben angezeigt – ohne Ihre Kontaktdaten. In dieser Demo
          ist sie nur in Ihrem Browser gespeichert.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <LinkButton href="/kunde">Zu meinen Anfragen</LinkButton>
          <LinkButton href="/" variant="secondary">
            Zur Startseite
          </LinkButton>
        </div>
      </Card>
    );
  }

  const fieldLabels: Record<string, string> = {
    categoryId: "Kategorie",
    title: "Titel",
    description: "Beschreibung",
    postalCode: "PLZ",
    city: "Ort",
    urgency: "Zeitraum",
    budget: "Budget",
    privacyAccepted: "Datenschutz",
    ...Object.fromEntries(
      (category?.fields ?? []).map((f) => [
        `details.${f.id}`,
        f.label.replace(/\?$/, ""),
      ]),
    ),
  };
  const errorList = Object.entries(errors).map(([k, m]) =>
    fieldLabels[k] ? `${fieldLabels[k]}: ${m}` : m,
  );

  return (
    <form onSubmit={submit} noValidate>
      <Link
        href="/kunde"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden="true" /> Meine Anfragen
      </Link>

      <Progress step={step} />

      <h1
        ref={headingRef}
        tabIndex={-1}
        className="mt-6 text-2xl font-bold tracking-tight sm:text-3xl"
      >
        {step === 0 && "Was soll gemacht werden?"}
        {step === 1 && "Beschreiben Sie die Arbeit"}
        {step === 2 && "Wo und wann?"}
        {step === 3 && "Fotos und Prüfen"}
      </h1>
      {category && step > 0 && (
        <p className="mt-1 text-muted">
          Kategorie:{" "}
          <strong className="font-semibold text-ink">{category.label}</strong>{" "}
          <button
            type="button"
            onClick={() => setStep(0)}
            className="font-semibold text-brand-700 hover:underline"
          >
            ändern
          </button>
        </p>
      )}

      {errorList.length > 0 && (
        <div
          role="alert"
          className="mt-5 flex gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900"
        >
          <CircleAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-semibold">Bitte prüfen Sie Ihre Angaben:</p>
            <ul className="mt-1 list-disc pl-5">
              {errorList.slice(0, 5).map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="mt-6">
        {step === 0 && (
          <CategoryStep
            selected={values.categoryId}
            onSelect={chooseCategory}
          />
        )}

        {step === 1 && category && (
          <Card className="space-y-5 p-4 sm:p-6">
            <TextField
              label="Kurzer Titel"
              placeholder="Worum geht es – in einem Satz?"
              value={values.title}
              onChange={(v) => update("title", v)}
              error={errors.title}
              maxLength={100}
              required
            />
            <TextArea
              label="Beschreibung"
              hint="Was soll gemacht werden? Was ist schon vorhanden? Gibt es Besonderheiten?"
              value={values.description}
              onChange={(v) => update("description", v)}
              error={errors.description}
              maxLength={2000}
              required
            />
            {category.fields.length > 0 && (
              <fieldset className="space-y-5 border-t border-line pt-5">
                <legend className="sr-only">Angaben zur Kategorie</legend>
                <p
                  className="-mt-1 text-sm font-semibold text-muted"
                  aria-hidden="true"
                >
                  Angaben zu {category.label}
                </p>
                {category.fields.map((f) => (
                  <DynamicField
                    key={f.id}
                    field={f}
                    value={values.details[f.id]}
                    onChange={(v) => updateDetail(f.id, v)}
                    error={errors[`details.${f.id}`]}
                  />
                ))}
              </fieldset>
            )}
          </Card>
        )}

        {step === 2 && (
          <Card className="space-y-5 p-4 sm:p-6">
            <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
              <TextField
                label="PLZ"
                value={values.postalCode}
                onChange={(v) =>
                  update("postalCode", v.replace(/\D/g, "").slice(0, 5))
                }
                error={errors.postalCode}
                inputMode="numeric"
                autoComplete="postal-code"
                required
              />
              <TextField
                label="Ort"
                value={values.city}
                onChange={(v) => update("city", v)}
                error={errors.city}
                autoComplete="address-level2"
                required
              />
            </div>
            <p className="-mt-2 flex items-start gap-2 text-sm text-muted">
              <Lock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              Die genaue Adresse fragen wir erst ab, wenn Sie sich für einen
              Betrieb entschieden haben.
            </p>
            <ChoiceGroup
              label="Gewünschter Zeitraum"
              required
              options={URGENCIES.map((u) => ({
                value: u,
                label: URGENCY_LABELS[u],
              }))}
              value={values.urgency}
              onChange={(v) => update("urgency", v as Urgency)}
              error={errors.urgency}
            />
            <TextField
              label="Budget-Vorstellung (optional)"
              hint="Nur als Orientierung für Betriebe – kein verbindlicher Preis."
              value={values.budget}
              onChange={(v) => update("budget", v.replace(/[^\d]/g, ""))}
              error={errors.budget}
              inputMode="numeric"
              suffix="€"
            />
          </Card>
        )}

        {step === 3 && category && (
          <div className="space-y-4">
            <PhotoStep
              photos={photos}
              errors={photoErrors}
              onAdd={addPhotos}
              onRemove={removePhoto}
            />
            <Summary
              values={values}
              photoCount={photos.length}
              onEdit={setStep}
            />
            <FollowUps
              questions={followUpQuestions(values.categoryId, values.details)}
              onEdit={() => setStep(1)}
            />
            <Card className="p-4 sm:p-5">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={values.privacyAccepted}
                  onChange={(e) => update("privacyAccepted", e.target.checked)}
                  className="mt-1 size-5 shrink-0 accent-brand-700"
                  aria-invalid={!!errors.privacyAccepted}
                />
                <span className="text-sm">
                  Ich bin einverstanden, dass meine Anfrage (ohne Name,
                  Kontaktdaten und genaue Adresse) passenden Betrieben angezeigt
                  wird. Die Datenschutzhinweise gelten.{" "}
                  <span className="text-muted">
                    (Demo – rechtliche Texte folgen vor dem Start.)
                  </span>
                </span>
              </label>
              {errors.privacyAccepted && (
                <FieldError id="privacy-err" message={errors.privacyAccepted} />
              )}
            </Card>
          </div>
        )}
      </div>

      {step > 0 && (
        <div className="sticky bottom-0 -mx-4 mt-6 flex gap-3 border-t border-line bg-canvas/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0">
          <Button
            type="button"
            variant="secondary"
            onClick={back}
            className="flex-1 sm:flex-none"
          >
            <ArrowLeft className="size-4" aria-hidden="true" /> Zurück
          </Button>
          <Button type="submit" className="flex-[2] sm:ml-auto sm:flex-none">
            {step === STEPS.length - 1 ? (
              "Anfrage absenden"
            ) : (
              <>
                Weiter <ArrowRight className="size-4" aria-hidden="true" />
              </>
            )}
          </Button>
        </div>
      )}
    </form>
  );
}

/* ---------------- Schritte ---------------- */

function Progress({ step }: { step: number }) {
  return (
    <div>
      <p className="text-sm font-medium text-muted">
        Schritt {step + 1} von {STEPS.length}:{" "}
        <span className="text-ink">{STEPS[step]}</span>
      </p>
      <div
        className="mt-2 grid grid-cols-4 gap-1.5"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={STEPS.length}
        aria-valuenow={step + 1}
        aria-label="Fortschritt"
      >
        {STEPS.map((s, i) => (
          <span
            key={s}
            className={`h-1.5 rounded-full transition-colors ${i <= step ? "bg-brand-500" : "bg-line"}`}
          />
        ))}
      </div>
    </div>
  );
}

function CategoryStep({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return categoriesByGroup()
      .map((g) => ({
        ...g,
        categories: g.categories.filter(
          (c) =>
            !q ||
            c.label.toLowerCase().includes(q) ||
            c.hint.toLowerCase().includes(q),
        ),
      }))
      .filter((g) => g.categories.length > 0);
  }, [query]);

  return (
    <div>
      <label className="relative block">
        <span className="sr-only">Kategorie suchen</span>
        <Search
          className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted"
          aria-hidden="true"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Suchen, z. B. „Hecke“, „Bad“, „streichen“"
          className="h-12 w-full rounded-xl border border-line bg-surface pr-4 pl-11 text-base outline-none focus:border-brand-500"
        />
      </label>

      {groups.length === 0 && (
        <p className="mt-6 text-center text-muted">
          Nichts gefunden.{" "}
          <button
            type="button"
            className="font-semibold text-brand-700 hover:underline"
            onClick={() => onSelect("sonstiges")}
          >
            Als „Sonstiges“ anfragen
          </button>
        </p>
      )}

      <div className="mt-6 space-y-6">
        {groups.map(({ group, categories }) => (
          <section key={group.id} aria-labelledby={`grp-${group.id}`}>
            <h2
              id={`grp-${group.id}`}
              className="mb-2 text-sm font-semibold tracking-wide text-muted uppercase"
            >
              {group.label}
            </h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {categories.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(c.id)}
                    aria-pressed={selected === c.id}
                    className={`flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition ${
                      selected === c.id
                        ? "border-brand-500 bg-brand-50"
                        : "border-line bg-surface hover:border-brand-500"
                    }`}
                  >
                    <span>
                      <span className="block font-semibold">{c.label}</span>
                      <span className="block text-sm text-muted">{c.hint}</span>
                    </span>
                    <ArrowRight
                      className="size-4 shrink-0 text-muted"
                      aria-hidden="true"
                    />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

function PhotoStep({
  photos,
  errors,
  onAdd,
  onRemove,
}: {
  photos: Photo[];
  errors: string[];
  onAdd: (f: FileList | null) => void;
  onRemove: (id: string) => void;
}) {
  const inputId = useId();
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-semibold">Fotos (optional)</h2>
        <span className="text-sm text-muted">
          {photos.length}/{PHOTO_LIMITS.maxFiles}
        </span>
      </div>
      <p className="mt-1 text-sm text-muted">
        Fotos helfen Betrieben, die Arbeit einzuschätzen. JPG, PNG, WebP oder
        HEIC, max. 10 MB.
      </p>
      <ul className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {photos.map((p) => (
          <li
            key={p.id}
            className="relative aspect-square overflow-hidden rounded-lg bg-canvas ring-1 ring-line"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- lokale Vorschau (Blob-URL) */}
            <img
              src={p.url}
              alt={`Vorschau ${p.file.name}`}
              className="size-full object-cover"
            />
            <button
              type="button"
              onClick={() => onRemove(p.id)}
              className="absolute top-1 right-1 flex size-7 items-center justify-center rounded-full bg-ink/70 text-white hover:bg-ink"
              aria-label={`${p.file.name} entfernen`}
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </li>
        ))}
        {photos.length < PHOTO_LIMITS.maxFiles && (
          <li>
            <label
              htmlFor={inputId}
              className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-line text-sm font-medium text-muted transition focus-within:border-brand-500 hover:border-brand-500 hover:text-brand-700"
            >
              <Camera className="size-6" aria-hidden="true" />
              Hinzufügen
              <input
                id={inputId}
                type="file"
                accept={PHOTO_LIMITS.types.join(",")}
                multiple
                className="sr-only"
                onChange={(e) => {
                  onAdd(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
          </li>
        )}
      </ul>
      {errors.length > 0 && (
        <ul role="alert" className="mt-3 space-y-1 text-sm text-rose-700">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-xs text-muted">
        Demo: Fotos werden nur als Vorschau angezeigt, nicht hochgeladen und
        nicht gespeichert.
      </p>
    </Card>
  );
}

function Summary({
  values,
  photoCount,
  onEdit,
}: {
  values: FormValues;
  photoCount: number;
  onEdit: (s: number) => void;
}) {
  const category = getCategory(values.categoryId);
  const details = describeDetails(
    values.categoryId,
    Object.fromEntries(
      Object.entries(values.details).filter(([, v]) => v !== ""),
    ) as Record<string, string | boolean>,
  );
  const rows: { label: string; value: string; step: number }[] = [
    { label: "Kategorie", value: category?.label ?? "–", step: 0 },
    { label: "Titel", value: values.title, step: 1 },
    ...details.map((d) => ({ ...d, step: 1 })),
    { label: "Ort", value: `${values.postalCode} ${values.city}`, step: 2 },
    {
      label: "Zeitraum",
      value: values.urgency ? URGENCY_LABELS[values.urgency] : "–",
      step: 2,
    },
    ...(values.budget
      ? [
          {
            label: "Budget",
            value: `${Number(values.budget).toLocaleString("de-DE")} €`,
            step: 2,
          },
        ]
      : []),
    { label: "Fotos", value: photoCount ? `${photoCount}` : "keine", step: 3 },
  ];
  return (
    <Card className="p-4 sm:p-5">
      <h2 className="font-semibold">Ihre Angaben</h2>
      <dl className="mt-3 divide-y divide-line text-sm">
        {rows.map((r) => (
          <div key={r.label} className="flex items-baseline gap-3 py-2">
            <dt className="w-32 shrink-0 text-muted">{r.label}</dt>
            <dd className="flex-1 font-medium break-words">{r.value}</dd>
            {r.step < 3 && (
              <button
                type="button"
                onClick={() => onEdit(r.step)}
                className="text-xs font-semibold text-brand-700 hover:underline"
              >
                ändern
              </button>
            )}
          </div>
        ))}
      </dl>
    </Card>
  );
}

function FollowUps({
  questions,
  onEdit,
}: {
  questions: string[];
  onEdit: () => void;
}) {
  if (questions.length === 0) return null;
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-5">
      <p className="flex items-center gap-2 font-semibold text-amber-900">
        <Lightbulb className="size-5" aria-hidden="true" /> Diese Angaben helfen
        Betrieben noch:
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-6 text-sm text-amber-900">
        {questions.map((q) => (
          <li key={q}>{q}</li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onEdit}
        className="mt-3 text-sm font-semibold text-amber-900 underline underline-offset-4"
      >
        Angaben ergänzen
      </button>
      <span className="ml-2 text-sm text-amber-800">
        – oder einfach so absenden.
      </span>
    </div>
  );
}

/* ---------------- Felder ---------------- */

const inputClass = (error?: string) =>
  `h-12 w-full rounded-xl border bg-surface px-4 text-base outline-none transition focus:border-brand-500 ${
    error ? "border-rose-400" : "border-line"
  }`;

function FieldError({ id, message }: { id: string; message: string }) {
  return (
    <p id={id} className="mt-1.5 flex items-center gap-1 text-sm text-rose-700">
      <CircleAlert className="size-4 shrink-0" aria-hidden="true" /> {message}
    </p>
  );
}

function Label({
  htmlFor,
  children,
  required,
}: {
  htmlFor?: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block font-semibold">
      {children}
      {required ? (
        <span className="text-rose-600"> *</span>
      ) : (
        <span className="font-normal text-muted"> </span>
      )}
    </label>
  );
}

function TextField({
  label,
  value,
  onChange,
  error,
  hint,
  suffix,
  required,
  ...rest
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  hint?: string;
  suffix?: string;
  required?: boolean;
} & Omit<React.ComponentProps<"input">, "onChange" | "value">) {
  const id = useId();
  const describedBy =
    [error && `${id}-err`, hint && `${id}-hint`].filter(Boolean).join(" ") ||
    undefined;
  return (
    <div>
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      <div className="relative">
        <input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          aria-required={required}
          className={`${inputClass(error)} ${suffix ? "pr-14" : ""}`}
          {...rest}
        />
        {suffix && (
          <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-muted">
            {suffix}
          </span>
        )}
      </div>
      {hint && (
        <p id={`${id}-hint`} className="mt-1.5 text-sm text-muted">
          {hint}
        </p>
      )}
      {error && <FieldError id={`${id}-err`} message={error} />}
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
  error,
  hint,
  maxLength,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  hint?: string;
  maxLength: number;
  required?: boolean;
}) {
  const id = useId();
  return (
    <div>
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      {hint && (
        <p id={`${id}-hint`} className="-mt-0.5 mb-2 text-sm text-muted">
          {hint}
        </p>
      )}
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        rows={5}
        aria-invalid={!!error}
        aria-required={required}
        aria-describedby={
          [hint && `${id}-hint`, error && `${id}-err`]
            .filter(Boolean)
            .join(" ") || undefined
        }
        className={`w-full rounded-xl border bg-surface px-4 py-3 text-base transition outline-none focus:border-brand-500 ${
          error ? "border-rose-400" : "border-line"
        }`}
      />
      <div className="flex justify-between">
        {error ? <FieldError id={`${id}-err`} message={error} /> : <span />}
        <span className="mt-1.5 text-xs text-muted">
          {value.length}/{maxLength}
        </span>
      </div>
    </div>
  );
}

function ChoiceGroup({
  label,
  options,
  value,
  onChange,
  error,
  help,
  required,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  error?: string;
  help?: string;
  required?: boolean;
}) {
  const name = useId();
  return (
    <fieldset
      aria-invalid={!!error}
      aria-describedby={error ? `${name}-err` : undefined}
    >
      <legend className="mb-1.5 font-semibold">
        {label}
        {required && <span className="text-rose-600"> *</span>}
      </legend>
      {help && <p className="-mt-0.5 mb-2 text-sm text-muted">{help}</p>}
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <label
            key={o.value}
            className={`flex min-h-11 cursor-pointer items-center rounded-xl border px-4 py-2 text-[15px] font-medium transition has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-brand-500 ${
              value === o.value
                ? "border-brand-500 bg-brand-50 text-brand-700"
                : error
                  ? "border-rose-300 bg-surface"
                  : "border-line bg-surface hover:border-brand-500"
            }`}
          >
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
              className="sr-only"
            />
            {o.label}
          </label>
        ))}
      </div>
      {error && <FieldError id={`${name}-err`} message={error} />}
    </fieldset>
  );
}

function DynamicField({
  field,
  value,
  onChange,
  error,
}: {
  field: FieldDef;
  value: string | boolean | undefined;
  onChange: (v: string | boolean) => void;
  error?: string;
}) {
  switch (field.type) {
    case "number":
      return (
        <div className="sm:max-w-xs">
          <TextField
            label={field.label}
            value={typeof value === "string" ? value : ""}
            onChange={(v) =>
              onChange(v.replace(/[^\d,.]/g, "").replace(",", "."))
            }
            error={error}
            hint={field.help}
            suffix={field.unit}
            inputMode="decimal"
            required={field.required}
          />
        </div>
      );
    case "select":
      return (
        <ChoiceGroup
          label={field.label}
          options={field.options ?? []}
          value={typeof value === "string" ? value : ""}
          onChange={onChange}
          error={error}
          help={field.help}
          required={field.required}
        />
      );
    case "boolean":
      return (
        <ChoiceGroup
          label={field.label}
          options={[
            { value: "ja", label: "Ja" },
            { value: "nein", label: "Nein" },
          ]}
          value={value === true ? "ja" : value === false ? "nein" : ""}
          onChange={(v) => onChange(v === "ja")}
          error={error}
          help={field.help}
          required={field.required}
        />
      );
    case "text":
      return (
        <TextField
          label={field.label}
          value={typeof value === "string" ? value : ""}
          onChange={onChange}
          error={error}
          hint={field.help}
          required={field.required}
        />
      );
  }
}
