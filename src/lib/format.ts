const dateFmt = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});
const dayFmt = new Intl.DateTimeFormat("de-DE", {
  weekday: "short",
  day: "2-digit",
  month: "2-digit",
});
const longDayFmt = new Intl.DateTimeFormat("de-DE", {
  weekday: "long",
  day: "numeric",
  month: "long",
});
const euroFmt = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

/** ISO-Datum (YYYY-MM-DD) ohne Zeitzonenverschiebung parsen. */
function parse(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12));
}

export const formatDate = (iso: string) => dateFmt.format(parse(iso));
export const formatDay = (iso: string) => dayFmt.format(parse(iso));
export const formatLongDay = (iso: string) => longDayFmt.format(parse(iso));
export const formatEuro = (n: number) => euroFmt.format(n);
