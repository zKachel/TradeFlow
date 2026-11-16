import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Anmelden" };

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div
          aria-busy="true"
          className="h-96 animate-pulse rounded-2xl bg-line/60"
        />
      }
    >
      <LoginForm />
    </Suspense>
  );
}
