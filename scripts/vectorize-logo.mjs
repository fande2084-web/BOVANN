// Vectorise le logo OCD Live (assets/brand-source/ocd-live-logo.png) en 3 SVG dans public/brand/.
// Chaque couleur (orange « OCD », noir « Live ») est isolée puis tracée séparément avec potrace.
import sharp from "sharp";
import potrace from "potrace";
import { writeFile } from "node:fs/promises";

const SRC = "assets/brand-source/ocd-live-logo.png";
const ORANGE = "#E36802";

const { data, info } = await sharp(SRC).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H } = info;

const isOrange = (r, g, b) => r > 150 && r - b > 110 && g < 170;
const isBlack = (r, g, b) => r < 110 && g < 110 && b < 110;

function mask(test) {
  const out = Buffer.alloc(W * H, 255);
  const box = { x0: W, y0: H, x1: 0, y1: 0 };
  for (let i = 0; i < W * H; i++) {
    const r = data[i * 3], g = data[i * 3 + 1], b = data[i * 3 + 2];
    if (test(r, g, b)) {
      out[i] = 0;
      const x = i % W, y = (i / W) | 0;
      if (x < box.x0) box.x0 = x;
      if (y < box.y0) box.y0 = y;
      if (x > box.x1) box.x1 = x;
      if (y > box.y1) box.y1 = y;
    }
  }
  return { png: sharp(out, { raw: { width: W, height: H, channels: 1 } }).png().toBuffer(), box };
}

function trace(png, color) {
  return new Promise((resolve, reject) => {
    const t = new potrace.Potrace();
    t.setParameters({ threshold: 128, turdSize: 40, optTolerance: 0.3, alphaMax: 1, color });
    t.loadImage(png, (err) => (err ? reject(err) : resolve(t.getPathTag(color))));
  });
}

const o = mask(isOrange);
const k = mask(isBlack);
const orangePath = await trace(await o.png, ORANGE);
const blackPath = await trace(await k.png, "#000000");

const union = {
  x0: Math.min(o.box.x0, k.box.x0),
  y0: Math.min(o.box.y0, k.box.y0),
  x1: Math.max(o.box.x1, k.box.x1),
  y1: Math.max(o.box.y1, k.box.y1),
};

const svg = (box, body, extra = "") => {
  const w = box.x1 - box.x0 + 1, h = box.y1 - box.y0 + 1;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box.x0} ${box.y0} ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="OCD Live"${extra}>\n${body}\n</svg>\n`;
};

await writeFile("public/brand/ocd-live-logo.svg", svg(union, `${orangePath}\n${blackPath}`));
await writeFile(
  "public/brand/ocd-live-logo-negative.svg",
  svg(union, `${orangePath}\n${blackPath.replace(/fill="#000000"/g, 'fill="#FFFFFF"')}`),
);

// Monogramme (favicon) : le « OCD » orange centré dans un carré
const ow = o.box.x1 - o.box.x0 + 1, oh = o.box.y1 - o.box.y0 + 1;
const side = Math.round(ow * 1.12);
const sq = { x0: Math.round(o.box.x0 - (side - ow) / 2), y0: Math.round(o.box.y0 - (side - oh) / 2) };
await writeFile(
  "public/brand/ocd-monogram.svg",
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${sq.x0} ${sq.y0} ${side} ${side}" width="64" height="64" role="img" aria-label="OCD Live">\n<rect x="${sq.x0}" y="${sq.y0}" width="${side}" height="${side}" rx="${Math.round(side * 0.22)}" fill="#FFFFFF"/>\n${orangePath}\n</svg>\n`,
);

console.log("Logo :", union.x1 - union.x0 + 1, "x", union.y1 - union.y0 + 1, "| OCD :", ow, "x", oh);
