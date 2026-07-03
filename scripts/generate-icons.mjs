import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "icons");

function svg(size, { maskable = false } = {}) {
  const radius = maskable ? 0 : Math.round(size * 0.22);
  const glyphScale = (maskable ? 0.5 : 0.58) * size;
  const g = glyphScale / 40;
  const t = (size - 40 * g) / 2;
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${radius}" fill="#d9600b"/>
  <g transform="translate(${t} ${t}) scale(${g})" fill="none" stroke="#f4f2ea" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
    <path d="M11 20 L20 12.5 L29 20"/>
    <path d="M13.5 21.5 V27.5 H26.5 V21.5"/>
    <path d="M17 27.5 V23.5 H23 V27.5" opacity="0.55"/>
  </g>
</svg>`);
}

const targets = [
  { name: "icon-192.png", size: 192 },
  { name: "icon-512.png", size: 512 },
  { name: "maskable-192.png", size: 192, maskable: true },
  { name: "maskable-512.png", size: 512, maskable: true },
  { name: "apple-icon.png", size: 180, maskable: true },
];

await mkdir(outDir, { recursive: true });
for (const t of targets) {
  await sharp(svg(t.size, { maskable: t.maskable })).png().toFile(join(outDir, t.name));
  console.log("✓", t.name);
}
console.log("Icons generated in public/icons");
