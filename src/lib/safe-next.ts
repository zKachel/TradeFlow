/** Nur sichere, relative Weiterleitungsziele erlauben (kein Open Redirect). */
export function safeNext(next: unknown, fallback = "/"): string {
  if (typeof next !== "string" || next.length > 500) return fallback;
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\"))
    return fallback;
  if (/[\r\n\t]/.test(next)) return fallback;
  return next;
}
