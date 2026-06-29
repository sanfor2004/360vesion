/**
 * Generates a local 4096×2048 equirectangular test panorama (a calibration
 * grid with a horizon, cardinal labels, and yaw degree ticks) so the viewer
 * works offline with no external image dependency. Mirrors the test grid the
 * Three.js studio draws on a canvas.
 *
 *   node scripts/make-test-panorama.mjs
 *
 * Output: public/panoramas/test-grid.jpg
 */
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const W = 4096;
const H = 2048; // exactly 2:1

const cols = 12; // vertical lines every 30° yaw
const rows = 12; // horizontal lines every 15° pitch

let lines = "";
for (let i = 0; i <= cols; i++) {
  const x = (i / cols) * W;
  lines += `<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="rgba(255,255,255,0.18)" stroke-width="2"/>`;
}
for (let j = 0; j <= rows; j++) {
  const y = (j / rows) * H;
  lines += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="rgba(255,255,255,0.18)" stroke-width="2"/>`;
}
// bold horizon
lines += `<line x1="0" y1="${H / 2}" x2="${W}" y2="${H / 2}" stroke="rgba(255,255,255,0.5)" stroke-width="3"/>`;

// cardinal labels along the horizon (yaw 0=N at centre, E/S/W around)
const cards = [
  ["N", 0.5],
  ["E", 0.75],
  ["S", 1.0],
  ["W", 0.25],
];
let labels = "";
for (const [t, u] of cards) {
  labels += `<text x="${u * W}" y="${H / 2 - 110}" font-family="sans-serif" font-size="130" font-weight="bold" fill="#fff" text-anchor="middle" dominant-baseline="middle">${t}</text>`;
}
// yaw degree ticks
let ticks = "";
for (let i = 0; i < cols; i++) {
  ticks += `<text x="${(i / cols) * W + 90}" y="${H / 2 + 70}" font-family="monospace" font-size="46" font-weight="600" fill="rgba(255,255,255,0.7)">${i * 30}°</text>`;
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="${H}" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#10243b"/>
      <stop offset="0.48" stop-color="#3b6ea5"/>
      <stop offset="0.5" stop-color="#cfe3f2"/>
      <stop offset="0.52" stop-color="#5a4632"/>
      <stop offset="1" stop-color="#1c140d"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  ${lines}
  ${labels}
  ${ticks}
</svg>`;

const outDir = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "panoramas");
await mkdir(outDir, { recursive: true });
const out = join(outDir, "test-grid.jpg");
await sharp(Buffer.from(svg)).jpeg({ quality: 85 }).toFile(out);
console.log("wrote", out);
