import { AFRICA_MADAGASCAR, AFRICA_MAINLAND, AFRICA_VIEWBOX } from "@/lib/africa";

/**
 * Silhouette fidèle de l'Afrique avec Madagascar, en trait fin orange
 * (specs/directives-design.json → africaMotif ; tracé généré par scripts/africa-outline.mjs).
 */
export function AfricaOutline({ className = "" }: { className?: string }) {
  return (
    <svg viewBox={AFRICA_VIEWBOX} fill="none" aria-hidden className={className}>
      {[AFRICA_MAINLAND, AFRICA_MADAGASCAR].map((d) => (
        <path
          key={d.slice(0, 12)}
          d={d}
          stroke="var(--orange)"
          strokeWidth="1.5"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
}
