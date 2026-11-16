// Erzeugt PWA-Icons aus dem Logo-SVG. Ausführen: node scripts/generate-icons.mjs
import sharp from "sharp";
import { writeFile } from "node:fs/promises";

const mark = (maskable) => {
  // Glyphe ist 16 x 14 Einheiten groß; maskable Icons brauchen mehr Rand (Safe Zone).
  const scale = maskable ? 11 : 15;
  const w = 16 * scale;
  const h = 14 * scale;
  const x = (512 - w) / 2;
  const y = (512 - h) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" ${maskable ? "" : 'rx="112"'} fill="#0f5045"/>
  <g transform="translate(${x} ${y}) scale(${scale})">
    <path d="M0 0h16v3.2H9.6V14H6.4V3.2H0z" fill="#fff"/>
    <path d="M11.2 8.4H16v3.2h-4.8z" fill="#dd7428"/>
  </g>
</svg>`;
};

const out = [
  ["public/icons/icon-192.png", 192, false],
  ["public/icons/icon-512.png", 512, false],
  ["public/icons/maskable-512.png", 512, true],
  ["src/app/apple-icon.png", 180, true],
  ["src/app/icon.png", 64, false],
];
for (const [file, size, pad] of out) {
  await sharp(Buffer.from(mark(pad)))
    .resize(size, size)
    .png()
    .toFile(file);
}
await writeFile("src/app/icon.svg", mark(false).trim());
console.log("Icons erzeugt.");
