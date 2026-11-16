"use client";

/**
 * Demo-Speicher im Browser (localStorage). NUR für die klickbare Demo.
 * Ab Sprint 2 ersetzt durch Supabase mit RLS. Keine echten Daten eingeben.
 */
import { useSyncExternalStore } from "react";
import type { CompanyJob, CustomerRequest } from "./types";

type Keys = {
  "tradeflow-demo-requests": CustomerRequest[];
  "tradeflow-demo-jobs": CompanyJob[];
};
type Key = keyof Keys;

const listeners = new Set<() => void>();
const cache = new Map<Key, { raw: string | null; value: unknown }>();
const EMPTY: never[] = [];

function read<K extends Key>(key: K): Keys[K] {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(key);
  } catch {
    raw = null;
  }
  const cached = cache.get(key);
  if (cached && cached.raw === raw) return cached.value as Keys[K];
  let value: Keys[K] = EMPTY as Keys[K];
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) value = parsed as Keys[K];
    } catch {
      value = EMPTY as Keys[K];
    }
  }
  cache.set(key, { raw, value });
  return value;
}

function write<K extends Key>(key: K, value: Keys[K]) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Speicher nicht verfügbar (z. B. privater Modus) – Demo läuft ohne Persistenz weiter.
    cache.set(key, { raw: null, value });
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = () => listener();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function useDemoList<K extends Key>(key: K): Keys[K] {
  return useSyncExternalStore(
    subscribe,
    () => read(key),
    () => EMPTY as Keys[K],
  );
}

export function useDemoRequests() {
  return useDemoList("tradeflow-demo-requests");
}

export function useDemoJobs() {
  return useDemoList("tradeflow-demo-jobs");
}

export function addDemoRequest(request: CustomerRequest) {
  write("tradeflow-demo-requests", [
    request,
    ...read("tradeflow-demo-requests"),
  ]);
}

export function addDemoJob(job: CompanyJob) {
  write("tradeflow-demo-jobs", [job, ...read("tradeflow-demo-jobs")]);
}

export function resetDemoData() {
  write("tradeflow-demo-requests", []);
  write("tradeflow-demo-jobs", []);
}

export function newDemoId(prefix: string) {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${rand}`;
}

export function incrementDemoPhotoCount(requestId: string) {
  write(
    "tradeflow-demo-requests",
    read("tradeflow-demo-requests").map((r) =>
      r.id === requestId ? { ...r, photoCount: r.photoCount + 1 } : r,
    ),
  );
}

/** Für das Demo-Formular: gleiche clientRequestId → gleiche Anfrage (wie in der echten Datenbank). */
export function findDemoRequestByClientId(clientRequestId: string) {
  return read("tradeflow-demo-requests").find(
    (r) => r.clientRequestId === clientRequestId,
  );
}
