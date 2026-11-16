/**
 * Erkennt den echten Bildtyp anhand der ersten Bytes ("Magic Bytes").
 * Der vom Browser gemeldete Typ ist nicht vertrauenswürdig – der Server prüft immer selbst.
 */
export type SniffedImage = {
  mime: "image/jpeg" | "image/png" | "image/webp";
  ext: "jpg" | "png" | "webp";
};

export function sniffImage(bytes: Uint8Array): SniffedImage | null {
  if (bytes.length < 12) return null;
  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
    return { mime: "image/jpeg", ext: "jpg" };
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (png.every((b, i) => bytes[i] === b))
    return { mime: "image/png", ext: "png" };
  // WebP: "RIFF" .... "WEBP"
  const ascii = (from: number, to: number) =>
    String.fromCharCode(...bytes.slice(from, to));
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP")
    return { mime: "image/webp", ext: "webp" };
  return null;
}

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
