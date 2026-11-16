"use client";

import { useEffect } from "react";

/** Registriert den Service Worker (nur in Produktion, nur wenn der Browser es unterstützt). */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      // Kein harter Fehler: Die App funktioniert auch ohne Service Worker.
    });
  }, []);
  return null;
}
