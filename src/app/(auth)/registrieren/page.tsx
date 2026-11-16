import type { Metadata } from "next";
import { Suspense } from "react";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Registrieren" };

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div
          aria-busy="true"
          className="h-[32rem] animate-pulse rounded-2xl bg-line/60"
        />
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
