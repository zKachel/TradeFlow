import type { Metadata } from "next";
import { Suspense } from "react";
import { DemoRequestForm } from "./demo-form";

export const metadata: Metadata = { title: "Neue Anfrage" };

export default function NewRequestPage() {
  return (
    <Suspense fallback={<FormSkeleton />}>
      <DemoRequestForm />
    </Suspense>
  );
}

function FormSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Formular wird geladen"
      className="animate-pulse space-y-4"
    >
      <div className="h-8 w-2/3 rounded-lg bg-line" />
      <div className="h-2 rounded-full bg-line" />
      <div className="h-64 rounded-2xl bg-line/60" />
    </div>
  );
}
