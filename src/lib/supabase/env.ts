/**
 * Öffentliche Supabase-Konfiguration. Beide Werte sind für den Browser bestimmt
 * (Publishable Key ist durch RLS abgesichert). Geheime Schlüssel (secret / service_role)
 * werden in dieser App NICHT verwendet.
 */
export function getSupabaseEnv(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  if (key.startsWith("sb_secret_")) {
    // Schutz gegen Verwechslung: ein geheimer Schlüssel darf nie als öffentlicher Schlüssel landen.
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY enthält einen GEHEIMEN Schlüssel (sb_secret_…). Bitte den Publishable Key verwenden.",
    );
  }
  return { url, key };
}

export function isSupabaseConfigured() {
  return getSupabaseEnv() !== null;
}
