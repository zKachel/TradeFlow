"use client";

import { LogOut } from "lucide-react";
import { logoutAction } from "@/app/(auth)/actions";

/** Abmelden – löscht vorher lokal gesicherte Formular-Entwürfe (wichtig an geteilten Geräten). */
export function LogoutButton({ className = "" }: { className?: string }) {
  return (
    <form
      action={logoutAction}
      onSubmit={() => {
        try {
          window.localStorage.removeItem("tradeflow-anfrage-entwurf");
        } catch {
          // ignorieren
        }
      }}
    >
      <button
        type="submit"
        className={`flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-ink ${className}`}
      >
        <LogOut className="size-3.5" aria-hidden="true" /> Abmelden
      </button>
    </form>
  );
}
