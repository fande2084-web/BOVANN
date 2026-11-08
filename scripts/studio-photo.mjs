// Remplace les images provisoires par la VRAIE photo du mur du studio.
// Source : assets/brand-source/studio-lome.(jpg|jpeg|png|webp) — photo frontale 3:5 (mur, Afrique LED, logo, sol carrelé).
// Seul le mur est conservé (le sol est coupé, voir WALL_RATIO).
// Sorties :
//   public/images/studio-lome.jpg  → carte « Live en présentiel », iPhone du hero (scène 04), section « Le studio »
//   public/images/og-ocd-live.jpg  → partage réseaux (1200 × 630), composition « bannière web » des directives :
//                                    mur clair #E9E8E9, texte noir à gauche, photo (héros) à droite.
// La photo n'est jamais retouchée (pas de filtre) : simple recadrage et compression.
import sharp from "sharp";
import { existsSync } from "node:fs";

const candidates = ["jpg", "jpeg", "png", "webp"].map((ext) => `assets/brand-source/studio-lome.${ext}`);
const src = candidates.find((p) => existsSync(p));
if (!src) {
  console.error("Photo introuvable. Place-la sous assets/brand-source/studio-lome.jpg (ou .png / .webp).");
  process.exit(1);
}

const meta = await sharp(src).metadata();
console.log(`Source : ${src} (${meta.width} × ${meta.height})`);

// On ne garde que le mur : la plinthe et le carrelage (bas de la photo) sont coupés.
// Sur la photo actuelle, la plinthe commence à 1187 px sur 1634 → on coupe à 71 % de la hauteur.
const WALL_RATIO = 0.71;
const wall = await sharp(src)
  .rotate()
  .extract({ left: 0, top: 0, width: meta.width, height: Math.round(meta.height * WALL_RATIO) })
  .toBuffer();

// 1. Photo du site : 1200 px de large max (next/image génère ensuite AVIF/WebP en 640/1200/2000)
await sharp(wall)
  .resize({ width: Math.min(meta.width ?? 1200, 1200), withoutEnlargement: true })
  .jpeg({ quality: 86, mozjpeg: true })
  .toFile("public/images/studio-lome.jpg");

// 2. Image OG : mur à gauche avec le message, photo recadrée sur la carte + logo à droite
const W = 1200, H = 630, PHOTO_W = 520;
const photo = await sharp(wall)
  .resize({ width: PHOTO_W, height: H, fit: "cover", position: "top" })
  .toBuffer();
const text = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" fill="#E9E8E9"/>
  <text x="72" y="200" font-family="Arial Black, Arial" font-weight="900" font-size="64" fill="#000">Ton produit</text>
  <text x="72" y="272" font-family="Arial Black, Arial" font-weight="900" font-size="64" fill="#000">en direct.</text>
  <text x="72" y="342" font-family="Arial, sans-serif" font-size="28" fill="#5C5752">Réserve ton live au studio de Lomé</text>
  <text x="72" y="380" font-family="Arial, sans-serif" font-size="28" fill="#5C5752">ou depuis ta boutique.</text>
  <rect x="72" y="430" width="300" height="68" rx="12" fill="#E36802"/>
  <text x="222" y="474" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="26" fill="#000">Réserver mon live</text>
</svg>`;
await sharp(Buffer.from(text))
  // Un seul point focal : le logo est déjà sur la photo du mur, on ne le répète pas
  .composite([{ input: photo, top: 0, left: W - PHOTO_W }])
  .jpeg({ quality: 86, mozjpeg: true })
  .toFile("public/images/og-ocd-live.jpg");

console.log("OK : public/images/studio-lome.jpg et public/images/og-ocd-live.jpg");
