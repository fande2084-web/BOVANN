// Génère la silhouette de l'Afrique (avec Madagascar) à partir de coordonnées côtières réelles
// (longitude, latitude), projection équirectangulaire, lissage Catmull-Rom.
// Sorties : lib/africa.ts (tracés pour les composants) et public/brand/africa-outline.svg.
// specs/directives-design.json → africaMotif
import { writeFile } from "node:fs/promises";

// Sens horaire depuis Tanger
const MAINLAND = [
  [-5.8, 35.8], [-2.9, 35.3], [0.6, 35.9], [3.0, 36.8], [6.6, 37.0], [9.8, 37.3], [11.1, 37.1], [10.6, 35.8],
  [11.1, 35.2], [10.1, 33.9], [11.5, 33.1], [13.2, 32.9], [15.1, 32.4], [16.6, 31.2], [18.5, 30.3], [19.6, 30.4],
  [20.1, 32.1], [21.5, 32.9], [22.6, 32.8], [24.0, 32.1], [25.2, 31.6], [27.2, 31.4], [29.9, 31.2], [32.3, 31.3],
  [32.5, 29.9], [33.8, 27.2], [35.6, 23.9], [36.9, 22.0], [37.2, 19.6], [38.6, 17.9], [39.5, 15.6], [41.2, 14.4],
  [42.7, 13.0], [43.3, 12.0], [43.1, 11.6], [45.0, 10.4], [47.5, 11.2], [49.2, 11.3], [51.3, 11.8], [51.4, 10.4],
  [50.8, 9.3], [49.8, 8.0], [48.5, 5.3], [46.9, 3.6], [45.3, 2.0], [43.5, 0.7], [42.5, -0.4], [40.9, -2.3],
  [39.7, -4.0], [39.1, -5.1], [39.3, -6.8], [39.4, -8.4], [39.7, -10.0], [40.5, -13.0], [40.7, -14.5], [39.9, -16.2],
  [36.9, -17.9], [34.8, -19.8], [35.5, -22.0], [35.4, -23.9], [33.6, -25.1], [32.6, -25.9], [32.1, -28.8], [31.0, -29.9],
  [29.6, -31.3], [27.9, -33.0], [25.6, -34.0], [22.1, -34.2], [20.0, -34.8], [18.5, -34.35], [18.4, -33.9], [17.9, -32.0],
  [16.5, -28.6], [15.2, -26.6], [14.5, -22.9], [13.4, -20.8], [11.8, -17.3], [12.1, -15.2], [13.4, -12.6], [13.8, -10.7],
  [13.2, -8.8], [12.3, -6.0], [11.9, -4.8], [10.6, -3.4], [9.3, -1.6], [8.7, -0.7], [9.5, 2.0], [9.7, 4.0],
  [8.3, 4.6], [6.0, 4.3], [4.8, 5.7], [3.4, 6.4], [1.2, 6.1], [-0.2, 5.6], [-2.0, 4.7], [-4.0, 5.3],
  [-6.0, 4.9], [-7.7, 4.4], [-9.4, 5.3], [-10.8, 6.3], [-12.5, 7.4], [-13.2, 8.5], [-13.7, 9.5], [-15.0, 10.8],
  [-15.6, 11.9], [-16.8, 13.4], [-17.5, 14.7], [-16.5, 16.2], [-16.0, 18.1], [-16.5, 19.6], [-17.0, 20.8], [-15.9, 23.7],
  [-14.5, 26.1], [-12.9, 27.9], [-11.2, 28.3], [-9.6, 30.4], [-9.8, 31.5], [-9.2, 32.6], [-7.6, 33.6], [-6.8, 34.0],
];

const MADAGASCAR = [
  [49.3, -12.0], [50.2, -14.2], [50.3, -15.7], [49.7, -16.5], [49.4, -18.1], [48.6, -20.6], [48.0, -22.1], [47.4, -24.0],
  [47.0, -25.0], [45.1, -25.6], [44.0, -25.0], [43.7, -23.4], [43.3, -21.8], [44.3, -20.3], [44.4, -18.0], [44.4, -16.2],
  [46.3, -15.7], [47.3, -14.6], [48.2, -13.4],
];

const all = [...MAINLAND, ...MADAGASCAR];
const minLon = Math.min(...all.map((p) => p[0]));
const maxLat = Math.max(...all.map((p) => p[1]));
const maxLon = Math.max(...all.map((p) => p[0]));
const minLat = Math.min(...all.map((p) => p[1]));
const PAD = 2;
const K = 4; // unités SVG par degré
const project = ([lon, lat]) => [(lon - minLon) * K + PAD, (maxLat - lat) * K + PAD];
const W = Math.round((maxLon - minLon) * K + PAD * 2);
const H = Math.round((maxLat - minLat) * K + PAD * 2);

const f = (n) => Math.round(n * 10) / 10;

/** Courbe fermée Catmull-Rom → Bézier cubiques (passe par chaque point) */
function closedPath(points) {
  const p = points.map(project);
  const n = p.length;
  let d = `M${f(p[0][0])} ${f(p[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = p[(i - 1 + n) % n], p1 = p[i], p2 = p[(i + 1) % n], p3 = p[(i + 2) % n];
    const t = 6; // tension (6 = Catmull-Rom standard)
    const c1 = [p1[0] + (p2[0] - p0[0]) / t, p1[1] + (p2[1] - p0[1]) / t];
    const c2 = [p2[0] - (p3[0] - p1[0]) / t, p2[1] - (p3[1] - p1[1]) / t];
    d += `C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d + "Z";
}

const mainland = closedPath(MAINLAND);
const madagascar = closedPath(MADAGASCAR);

await writeFile(
  "lib/africa.ts",
  `// Généré par scripts/africa-outline.mjs — ne pas modifier à la main.\n` +
    `// Silhouette de l'Afrique avec Madagascar (specs/directives-design.json → africaMotif).\n` +
    `export const AFRICA_VIEWBOX = "0 0 ${W} ${H}";\n` +
    `export const AFRICA_WIDTH = ${W};\nexport const AFRICA_HEIGHT = ${H};\n` +
    `export const AFRICA_MAINLAND = "${mainland}";\n` +
    `export const AFRICA_MADAGASCAR = "${madagascar}";\n`,
);

await writeFile(
  "public/brand/africa-outline.svg",
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" fill="none" stroke="#E36802" stroke-width="1.5" stroke-linejoin="round" role="img" aria-label="Afrique">\n` +
    `<path d="${mainland}"/>\n<path d="${madagascar}"/>\n</svg>\n`,
);

console.log("Afrique :", W, "x", H);
