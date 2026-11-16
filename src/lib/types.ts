/**
 * Zentrale Domänentypen. Spiegeln den Auftragslebenszyklus aus dem Masterplan (Abschnitt 5).
 * Marktplatzanfragen und interne Firmenaufträge sind bewusst getrennte Typen.
 */

export const MARKETPLACE_STATUSES = [
  "entwurf",
  "eingereicht",
  "pruefung",
  "sichtbar",
  "angebote",
  "vergeben",
  "in_arbeit",
  "abgeschlossen",
  "storniert",
] as const;
export type MarketplaceStatus = (typeof MARKETPLACE_STATUSES)[number];

export const JOB_STATUSES = [
  "neu",
  "geplant",
  "in_arbeit",
  "erledigt",
  "storniert",
] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export const URGENCIES = [
  "dringend",
  "in_2_wochen",
  "in_4_wochen",
  "flexibel",
] as const;
export type Urgency = (typeof URGENCIES)[number];

export const URGENCY_LABELS: Record<Urgency, string> = {
  dringend: "Dringend (so bald wie möglich)",
  in_2_wochen: "Innerhalb von 2 Wochen",
  in_4_wochen: "Innerhalb von 4 Wochen",
  flexibel: "Zeitlich flexibel",
};

export const MARKETPLACE_STATUS_LABELS: Record<MarketplaceStatus, string> = {
  entwurf: "Entwurf",
  eingereicht: "Eingereicht",
  pruefung: "In Prüfung",
  sichtbar: "Für Betriebe sichtbar",
  angebote: "Angebote erhalten",
  vergeben: "Vergeben",
  in_arbeit: "In Arbeit",
  abgeschlossen: "Abgeschlossen",
  storniert: "Storniert",
};

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  neu: "Neu",
  geplant: "Geplant",
  in_arbeit: "In Arbeit",
  erledigt: "Erledigt",
  storniert: "Storniert",
};

export type DetailValue = string | number | boolean;

/** Anfrage eines Auftraggebers (Marktplatz). */
export interface CustomerRequest {
  id: string;
  isDemo: true;
  categoryId: string;
  title: string;
  description: string;
  postalCode: string;
  city: string;
  urgency: Urgency;
  budget?: number;
  details: Record<string, DetailValue>;
  photoCount: number;
  status: MarketplaceStatus;
  createdAt: string;
  offerCount: number;
}

/**
 * Sicht eines Betriebs auf eine Marktplatzanfrage.
 * Enthält bewusst KEINE Kontaktdaten, keine genaue Adresse und keinen Namen –
 * diese werden erst in einem späteren, berechtigten Prozessschritt freigegeben.
 */
export interface MarketplaceLead {
  id: string;
  isDemo: true;
  categoryId: string;
  title: string;
  summary: string;
  postalCode: string;
  city: string;
  distanceKm: number;
  urgency: Urgency;
  budget?: number;
  photoCount: number;
  createdAt: string;
}

export type EmployeeRole = "inhaber" | "buero" | "mitarbeiter";

export const ROLE_LABELS: Record<EmployeeRole, string> = {
  inhaber: "Inhaber / Admin",
  buero: "Büro / Disposition",
  mitarbeiter: "Ausführend",
};

export interface Employee {
  id: string;
  isDemo: true;
  name: string;
  role: EmployeeRole;
  initials: string;
}

/** Interner Auftrag eines Betriebs – niemals automatisch öffentlich. */
export interface CompanyJob {
  id: string;
  isDemo: true;
  title: string;
  customerName: string;
  location: string;
  categoryId: string;
  status: JobStatus;
  scheduledDate?: string;
  scheduledTime?: string;
  assigneeIds: string[];
  notes: string[];
  createdAt: string;
}
