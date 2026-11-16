/**
 * Pilotregion: Friesoythe / Landkreis Cloppenburg.
 * Die Architektur ist deutschlandweit (PLZ + Ländercode); diese Liste steuert nur Hinweise
 * und später das Freischalten von Betrieben im Pilot. Postleitzahlen vor Pilotstart prüfen.
 */
export const PILOT_REGION_LABEL = "Friesoythe und im Landkreis Cloppenburg";

export const PILOT_POSTAL_CODES: readonly string[] = [
  "26169", // Friesoythe
  "26219", // Bösel
  "26676", // Barßel
  "26683", // Saterland
  "49624", // Löningen
  "49632", // Essen (Oldb)
  "49661", // Cloppenburg
  "49681", // Garrel
  "49685", // Emstek
  "49688", // Lastrup
  "49692", // Cappeln
  "49696", // Molbergen
  "49699", // Lindern
];

export function isInPilotRegion(postalCode: string): boolean {
  return PILOT_POSTAL_CODES.includes(postalCode.trim());
}
