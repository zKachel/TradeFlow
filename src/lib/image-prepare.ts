"use client";

/**
 * Bereitet ein Foto im Browser für den Upload vor:
 *  - prüft, ob die Datei wirklich ein lesbares Bild ist (fehlerhafte Dateien werden erkannt),
 *  - verkleinert auf max. 2048 px (schneller Upload, auch mobil),
 *  - speichert als JPEG neu → entfernt dabei Metadaten wie GPS-Standort (Datenschutz).
 */
const MAX_EDGE = 2048;
const QUALITY = 0.85;

export class ImageReadError extends Error {}

async function decode(file: Blob): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      // Fallback unten (ältere Safari-Versionen)
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    return img;
  } catch {
    throw new ImageReadError(
      "Diese Datei ist kein lesbares Bild oder beschädigt.",
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Nur prüfen, ob das Bild lesbar ist (beim Auswählen). */
export async function assertReadableImage(file: Blob): Promise<void> {
  const img = await decode(file);
  if ("close" in img) img.close();
}

export async function prepareImage(file: Blob): Promise<Blob> {
  const img = await decode(file);
  const w = "naturalWidth" in img ? img.naturalWidth : img.width;
  const h = "naturalHeight" in img ? img.naturalHeight : img.height;
  if (!w || !h)
    throw new ImageReadError(
      "Diese Datei ist kein lesbares Bild oder beschädigt.",
    );
  const scale = Math.min(1, MAX_EDGE / Math.max(w, h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx)
    throw new ImageReadError(
      "Bild kann auf diesem Gerät nicht verarbeitet werden.",
    );
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  if ("close" in img) img.close();
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", QUALITY),
  );
  if (!blob) throw new ImageReadError("Bild konnte nicht umgewandelt werden.");
  return blob;
}
