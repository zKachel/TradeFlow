/** Heutiges Datum (YYYY-MM-DD) in deutscher Zeit – unabhängig von der Server-Zeitzone. */
export function todayInBerlin(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin" }).format(
    now,
  );
}

/** "08:00:00" → "08:00" */
export function shortTime(t: string | null | undefined): string {
  return t ? t.slice(0, 5) : "";
}
