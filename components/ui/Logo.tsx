/**
 * specs/accueil.json → assets.logo, components.Logo.
 * SVG vectorisés depuis assets/brand-source/ocd-live-logo.png (scripts/vectorize-logo.mjs).
 * Proportions 1699 × 760 (≈ 2,24:1) : la hauteur se règle par className, la largeur suit.
 */
type Props = {
  variant?: "color" | "negative";
  /** Classes de hauteur, ex. "h-11 md:h-[54px]" */
  className?: string;
};

const SRC = {
  color: "/brand/ocd-live-logo.svg",
  negative: "/brand/ocd-live-logo-negative.svg",
} as const;

export function Logo({ variant = "color", className = "h-12" }: Props) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- SVG statique, pas d'optimisation utile
    <img src={SRC[variant]} alt="OCD Live" width={1699} height={760} className={`w-auto ${className}`} decoding="async" />
  );
}
