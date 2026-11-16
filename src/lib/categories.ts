/**
 * Kategorien und kategorieabhängige Zusatzfelder – datengetrieben (Masterplan Abschnitt 3).
 *
 * Neue Kategorien oder Felder werden hier ergänzt, nicht als eigene Seite.
 * Ab Sprint 2 wandert diese Struktur in die Tabellen `service_categories` und `category_fields`.
 *
 * Wichtig: Kategorien beschreiben Arbeiten, keine Qualifikation oder Zulassung eines Betriebs.
 */

export type FieldType = "number" | "select" | "boolean" | "text";

export interface FieldOption {
  value: string;
  label: string;
}

export interface FieldDef {
  id: string;
  label: string;
  type: FieldType;
  required?: boolean;
  unit?: string;
  min?: number;
  max?: number;
  options?: FieldOption[];
  help?: string;
  /** Rückfrage, die gezeigt wird, wenn ein optionales Feld leer bleibt. */
  followUp?: string;
}

export interface CategoryGroup {
  id: string;
  label: string;
}

export interface Category {
  id: string;
  label: string;
  groupId: string;
  hint: string;
  fields: FieldDef[];
}

export const CATEGORY_GROUPS: CategoryGroup[] = [
  { id: "bau", label: "Bau & Rohbau" },
  { id: "huelle", label: "Dach, Fassade & Fenster" },
  { id: "technik", label: "Elektro, Sanitär & Heizung" },
  { id: "innen", label: "Innenausbau & Montage" },
  { id: "aussen", label: "Garten & Außenanlagen" },
  { id: "service", label: "Reinigung & Dienstleistungen" },
  { id: "sonstiges", label: "Sonstiges" },
];

const yesNo = (id: string, label: string, followUp?: string): FieldDef => ({
  id,
  label,
  type: "boolean",
  followUp,
});

const area = (label = "Ungefähre Fläche", required = false): FieldDef => ({
  id: "flaeche",
  label,
  type: "number",
  unit: "m²",
  min: 1,
  max: 100000,
  required,
  followUp:
    "Kennen Sie die ungefähre Fläche? Eine Schätzung hilft Betrieben bei der Einschätzung.",
});

const innenAussen: FieldDef = {
  id: "bereich",
  label: "Innen oder außen?",
  type: "select",
  required: true,
  options: [
    { value: "innen", label: "Innen" },
    { value: "aussen", label: "Außen" },
    { value: "beides", label: "Innen und außen" },
  ],
};

export const CATEGORIES: Category[] = [
  // Bau & Rohbau
  {
    id: "maurer",
    label: "Maurerarbeiten",
    groupId: "bau",
    hint: "Wände, Durchbrüche, Mauerwerk",
    fields: [
      area("Ungefähre Wandfläche"),
      yesNo(
        "statik",
        "Ist eine tragende Wand betroffen?",
        "Wissen Sie, ob eine tragende Wand betroffen ist? Das ist für die Planung wichtig.",
      ),
    ],
  },
  {
    id: "beton",
    label: "Betonarbeiten",
    groupId: "bau",
    hint: "Fundamente, Bodenplatten, Treppen",
    fields: [area()],
  },
  {
    id: "rohbau",
    label: "Bau & Rohbau",
    groupId: "bau",
    hint: "Neubau, Anbau, größere Umbauten",
    fields: [
      {
        id: "vorhaben",
        label: "Art des Vorhabens",
        type: "select",
        required: true,
        options: [
          { value: "neubau", label: "Neubau" },
          { value: "anbau", label: "Anbau" },
          { value: "umbau", label: "Umbau" },
        ],
      },
      yesNo(
        "genehmigung",
        "Liegt eine Baugenehmigung vor?",
        "Liegt bereits eine Baugenehmigung vor oder ist sie beantragt?",
      ),
    ],
  },
  // Dach, Fassade & Fenster
  {
    id: "dach",
    label: "Dach",
    groupId: "huelle",
    hint: "Reparatur, Neueindeckung, Dachfenster",
    fields: [
      {
        id: "dachtyp",
        label: "Dachtyp",
        type: "select",
        required: true,
        options: [
          { value: "satteldach", label: "Satteldach" },
          { value: "flachdach", label: "Flachdach" },
          { value: "walmdach", label: "Walmdach" },
          { value: "pultdach", label: "Pultdach" },
          { value: "unbekannt", label: "Weiß ich nicht" },
        ],
      },
      area("Grobe Dachfläche"),
      {
        id: "problem",
        label: "Worum geht es?",
        type: "select",
        required: true,
        options: [
          { value: "undicht", label: "Undichtigkeit / Feuchtigkeit" },
          { value: "sturmschaden", label: "Sturmschaden" },
          { value: "neueindeckung", label: "Neueindeckung" },
          { value: "dachfenster", label: "Dachfenster" },
          { value: "sonstiges", label: "Sonstiges" },
        ],
        help: "Keine Ferndiagnose: Der Betrieb beurteilt den Schaden vor Ort.",
      },
    ],
  },
  {
    id: "fassade",
    label: "Fassade",
    groupId: "huelle",
    hint: "Putz, Anstrich, Verkleidung",
    fields: [area("Ungefähre Fassadenfläche")],
  },
  {
    id: "daemmung",
    label: "Dämmung",
    groupId: "huelle",
    hint: "Dach, Fassade, Kellerdecke",
    fields: [
      {
        id: "bauteil",
        label: "Was soll gedämmt werden?",
        type: "select",
        required: true,
        options: [
          { value: "dach", label: "Dach / oberste Geschossdecke" },
          { value: "fassade", label: "Fassade" },
          { value: "keller", label: "Kellerdecke" },
        ],
      },
      area(),
    ],
  },
  {
    id: "fenster_tueren",
    label: "Fenster & Türen",
    groupId: "huelle",
    hint: "Austausch, Einbau, Reparatur",
    fields: [
      {
        id: "anzahl",
        label: "Anzahl Fenster / Türen",
        type: "number",
        min: 1,
        max: 200,
        required: true,
      },
    ],
  },
  // Elektro, Sanitär & Heizung
  {
    id: "elektro",
    label: "Elektro",
    groupId: "technik",
    hint: "Leitungen, Steckdosen, Sicherungskasten",
    fields: [
      {
        id: "art",
        label: "Art der Arbeit",
        type: "select",
        required: true,
        options: [
          { value: "erweiterung", label: "Steckdosen / Leitungen erweitern" },
          { value: "stoerung", label: "Störung / Defekt" },
          { value: "verteiler", label: "Sicherungskasten / Verteiler" },
          { value: "wallbox", label: "Wallbox" },
          { value: "sonstiges", label: "Sonstiges" },
        ],
        help: "Bei Brandgeruch oder Gefahr: Strom abschalten und Notdienst rufen.",
      },
    ],
  },
  {
    id: "sanitaer",
    label: "Sanitär",
    groupId: "technik",
    hint: "Bad, Leitungen, Armaturen",
    fields: [
      {
        id: "art",
        label: "Art der Arbeit",
        type: "select",
        required: true,
        options: [
          { value: "badsanierung", label: "Badsanierung" },
          { value: "armatur", label: "Armatur / WC tauschen" },
          { value: "leck", label: "Leck / Rohrproblem" },
          { value: "neuinstallation", label: "Neuinstallation" },
        ],
      },
      yesNo(
        "anschluesse",
        "Sind Wasser- und Abwasseranschlüsse vorhanden?",
        "Sind die nötigen Anschlüsse bereits vorhanden?",
      ),
    ],
  },
  {
    id: "heizung",
    label: "Heizung",
    groupId: "technik",
    hint: "Wartung, Austausch, Wärmepumpe",
    fields: [
      {
        id: "heizart",
        label: "Aktuelle Heizung",
        type: "select",
        required: true,
        options: [
          { value: "gas", label: "Gas" },
          { value: "oel", label: "Öl" },
          { value: "waermepumpe", label: "Wärmepumpe" },
          { value: "andere", label: "Andere / weiß ich nicht" },
        ],
      },
    ],
  },
  {
    id: "klima_lueftung",
    label: "Klima & Lüftung",
    groupId: "technik",
    hint: "Klimagerät, Lüftungsanlage",
    fields: [
      {
        id: "raeume",
        label: "Anzahl Räume",
        type: "number",
        min: 1,
        max: 50,
      },
    ],
  },
  // Innenausbau & Montage
  {
    id: "maler",
    label: "Maler & Lackierer",
    groupId: "innen",
    hint: "Wände, Decken, Fassade streichen",
    fields: [
      area("Zu streichende Fläche", true),
      innenAussen,
      {
        id: "zustand",
        label: "Zustand",
        type: "select",
        options: [
          { value: "gut", label: "Gut – nur neu streichen" },
          { value: "ausbessern", label: "Risse / Löcher ausbessern" },
          { value: "schlecht", label: "Stark beschädigt" },
        ],
        followUp:
          "Wie ist der Zustand der Wände? Müssen Risse oder Löcher ausgebessert werden?",
      },
      {
        id: "untergrund",
        label: "Untergrund",
        type: "select",
        options: [
          { value: "tapete", label: "Tapete" },
          { value: "putz", label: "Putz" },
          { value: "beton", label: "Beton" },
          { value: "unbekannt", label: "Weiß ich nicht" },
        ],
        followUp: "Wissen Sie, ob es Tapete, Putz oder Beton ist?",
      },
    ],
  },
  {
    id: "trockenbau",
    label: "Trockenbau",
    groupId: "innen",
    hint: "Wände, Decken, Dachausbau",
    fields: [area()],
  },
  {
    id: "fliesen",
    label: "Fliesen",
    groupId: "innen",
    hint: "Bad, Küche, Boden",
    fields: [
      area("Fliesenfläche", true),
      yesNo("altbelag", "Alte Fliesen entfernen?"),
    ],
  },
  {
    id: "bodenbelaege",
    label: "Bodenbeläge",
    groupId: "innen",
    hint: "Parkett, Laminat, Vinyl, Teppich",
    fields: [
      area("Bodenfläche", true),
      {
        id: "bodenart",
        label: "Gewünschter Boden",
        type: "select",
        required: true,
        options: [
          { value: "parkett", label: "Parkett" },
          { value: "laminat", label: "Laminat" },
          { value: "vinyl", label: "Vinyl / Designboden" },
          { value: "teppich", label: "Teppich" },
          { value: "offen", label: "Noch offen" },
        ],
      },
      yesNo(
        "altbelag",
        "Alten Belag entfernen?",
        "Soll der alte Bodenbelag entfernt werden?",
      ),
    ],
  },
  {
    id: "tischler",
    label: "Tischler / Schreiner",
    groupId: "innen",
    hint: "Einbaumöbel, Treppen, Reparaturen",
    fields: [],
  },
  {
    id: "kuechenmontage",
    label: "Küchenmontage",
    groupId: "innen",
    hint: "Aufbau, Anschluss, Umbau",
    fields: [
      {
        id: "laenge",
        label: "Küchenzeile Länge",
        type: "number",
        unit: "m",
        min: 1,
        max: 30,
      },
      yesNo("geraete", "Elektrogeräte anschließen?"),
    ],
  },
  {
    id: "moebelmontage",
    label: "Möbelmontage",
    groupId: "innen",
    hint: "Schränke, Regale, Betten",
    fields: [
      {
        id: "anzahl",
        label: "Anzahl Möbelstücke",
        type: "number",
        min: 1,
        max: 100,
      },
    ],
  },
  {
    id: "innenausbau",
    label: "Innenausbau",
    groupId: "innen",
    hint: "Umbau, Renovierung, Ausbau",
    fields: [area()],
  },
  // Garten & Außenanlagen
  {
    id: "galabau",
    label: "Garten- & Landschaftsbau",
    groupId: "aussen",
    hint: "Gartengestaltung, Beete, Wege",
    fields: [
      area("Grundstücksfläche"),
      yesNo("entsorgung", "Grünschnitt entsorgen?"),
    ],
  },
  {
    id: "rasenpflege",
    label: "Rasenpflege",
    groupId: "aussen",
    hint: "Mähen, Vertikutieren, Neuanlage",
    fields: [area("Rasenfläche", true)],
  },
  {
    id: "heckenschnitt",
    label: "Heckenschnitt",
    groupId: "aussen",
    hint: "Hecken schneiden und entsorgen",
    fields: [
      {
        id: "laenge",
        label: "Heckenlänge",
        type: "number",
        unit: "m",
        min: 1,
        max: 2000,
        required: true,
      },
      {
        id: "hoehe",
        label: "Heckenhöhe",
        type: "number",
        unit: "m",
        min: 0.5,
        max: 15,
        followUp: "Wie hoch ist die Hecke ungefähr?",
      },
      yesNo(
        "entsorgung",
        "Schnittgut entsorgen?",
        "Soll das Schnittgut mitgenommen werden?",
      ),
    ],
  },
  {
    id: "baumpflege",
    label: "Baumpflege",
    groupId: "aussen",
    hint: "Rückschnitt, Fällung",
    fields: [
      {
        id: "anzahl",
        label: "Anzahl Bäume",
        type: "number",
        min: 1,
        max: 100,
        required: true,
      },
      {
        id: "hoehe",
        label: "Ungefähre Höhe",
        type: "number",
        unit: "m",
        min: 1,
        max: 60,
      },
    ],
  },
  {
    id: "zaunbau",
    label: "Zaunbau",
    groupId: "aussen",
    hint: "Neuer Zaun, Tore, Reparatur",
    fields: [
      {
        id: "laenge",
        label: "Zaunlänge",
        type: "number",
        unit: "m",
        min: 1,
        max: 5000,
        required: true,
      },
    ],
  },
  {
    id: "pflaster",
    label: "Pflasterarbeiten",
    groupId: "aussen",
    hint: "Einfahrt, Wege, Hof",
    fields: [area("Pflasterfläche", true)],
  },
  {
    id: "terrassenbau",
    label: "Terrassenbau",
    groupId: "aussen",
    hint: "Holz, WPC, Stein",
    fields: [area("Terrassenfläche", true)],
  },
  // Reinigung & Dienstleistungen
  {
    id: "reinigung",
    label: "Reinigung",
    groupId: "service",
    hint: "Grundreinigung, Fenster, Treppenhaus",
    fields: [area("Zu reinigende Fläche")],
  },
  {
    id: "entruempelung",
    label: "Entrümpelung",
    groupId: "service",
    hint: "Keller, Dachboden, Wohnung",
    fields: [
      {
        id: "raeume",
        label: "Anzahl Räume",
        type: "number",
        min: 1,
        max: 50,
        required: true,
      },
      {
        id: "volumen",
        label: "Ungefähres Volumen",
        type: "number",
        unit: "m³",
        min: 1,
        max: 1000,
        followUp:
          "Können Sie das Volumen grob schätzen? (Ein Transporter fasst etwa 10–15 m³)",
      },
      {
        id: "etage",
        label: "Etage",
        type: "select",
        required: true,
        options: [
          { value: "keller", label: "Keller" },
          { value: "eg", label: "Erdgeschoss" },
          { value: "1-2", label: "1.–2. Etage" },
          { value: "3+", label: "3. Etage oder höher" },
        ],
      },
      yesNo("aufzug", "Aufzug vorhanden?"),
      yesNo("entsorgung", "Entsorgung gewünscht?"),
    ],
  },
  {
    id: "entsorgung",
    label: "Entsorgung",
    groupId: "service",
    hint: "Sperrmüll, Bauschutt, Grünschnitt",
    fields: [
      {
        id: "volumen",
        label: "Ungefähres Volumen",
        type: "number",
        unit: "m³",
        min: 1,
        max: 1000,
      },
    ],
  },
  {
    id: "umzugshilfe",
    label: "Umzugshilfe",
    groupId: "service",
    hint: "Tragen, Transport, Montage",
    fields: [
      {
        id: "raeume",
        label: "Anzahl Zimmer",
        type: "number",
        min: 1,
        max: 20,
        required: true,
      },
    ],
  },
  {
    id: "hausmeister",
    label: "Hausmeisterdienste",
    groupId: "service",
    hint: "Kleinreparaturen, Winterdienst, Pflege",
    fields: [],
  },
  // Sonstiges
  {
    id: "sonstiges",
    label: "Sonstiges / weiß nicht",
    groupId: "sonstiges",
    hint: "Wir ordnen Ihre Anfrage zu",
    fields: [],
  },
];

const categoryById = new Map(CATEGORIES.map((c) => [c.id, c]));

export function getCategory(id: string): Category | undefined {
  return categoryById.get(id);
}

export function getCategoryLabel(id: string): string {
  return categoryById.get(id)?.label ?? "Unbekannte Kategorie";
}

export function categoriesByGroup(): {
  group: CategoryGroup;
  categories: Category[];
}[] {
  return CATEGORY_GROUPS.map((group) => ({
    group,
    categories: CATEGORIES.filter((c) => c.groupId === group.id),
  })).filter((g) => g.categories.length > 0);
}

/** Zusatzangaben lesbar aufbereiten (Label + Wert mit Einheit). */
export function describeDetails(
  categoryId: string,
  details: Record<string, string | number | boolean>,
): { label: string; value: string }[] {
  const category = getCategory(categoryId);
  if (!category) return [];
  const out: { label: string; value: string }[] = [];
  for (const field of category.fields) {
    const v = details[field.id];
    if (v === undefined || v === "") continue;
    let value: string;
    if (field.type === "boolean") value = v ? "Ja" : "Nein";
    else if (field.type === "select")
      value = field.options?.find((o) => o.value === v)?.label ?? String(v);
    else if (field.type === "number")
      value = `${Number(v).toLocaleString("de-DE")}${field.unit ? " " + field.unit : ""}`;
    else value = String(v);
    out.push({ label: field.label, value });
  }
  return out;
}
