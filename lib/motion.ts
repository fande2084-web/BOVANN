"use client";

/**
 * Source unique des animations : specs/accueil.json → designTokens.motion.
 * Tous les composants importent easing, durées et variants d'ici.
 */
import { useReducedMotion, type Transition, type Variants } from "framer-motion";

type Bezier = [number, number, number, number];

export const easing = {
  standard: [0.2, 0, 0, 1] as Bezier,
  decelerate: [0.05, 0.7, 0.1, 1] as Bezier,
  accelerate: [0.3, 0, 0.8, 0.15] as Bezier,
  /** Équivalents CSS, pour les transitions gérées par Tailwind */
  css: {
    standard: "cubic-bezier(0.2, 0, 0, 1)",
    decelerate: "cubic-bezier(0.05, 0.7, 0.1, 1)",
    accelerate: "cubic-bezier(0.3, 0, 0.8, 0.15)",
  },
} as const;

/** Durées en secondes (le JSON les donne en ms) */
export const duration = {
  instant: 0.1,
  fast: 0.18,
  base: 0.28,
  slow: 0.45,
  hero: 0.7,
  /** prefers-reduced-motion : tout devient un fondu de 150 ms */
  reduced: 0.15,
} as const;

export const distance = { reveal: 16, heroReveal: 24 } as const;

export const stagger = { items: 0.06, words: 0.04 } as const;

export const spring: Transition = { type: "spring", stiffness: 380, damping: 32, mass: 1 };
export const springSoft: Transition = { type: "spring", stiffness: 220, damping: 28, mass: 1 };

/** Une seule fois, seuil 20 % */
export const viewportOnce = { once: true, amount: 0.2 } as const;

export const reducedFade: Transition = { duration: duration.reduced, ease: "linear" };

/**
 * Variante « mouvement réduit » : fondu de 150 ms. Elle remet aussi les transformations
 * à zéro, car le HTML serveur est rendu avec l'état de départ animé (y, scale).
 */
function reducedVariants(delay = 0): Variants {
  return {
    hidden: { opacity: 0, x: 0, y: 0, scale: 1 },
    show: { opacity: 1, x: 0, y: 0, scale: 1, transition: { ...reducedFade, delay } },
  };
}

/* ------------------------------------------------------------------ */
/* Variants                                                            */
/* ------------------------------------------------------------------ */

export function fadeUp(opts: { y?: number; delay?: number; duration?: number; reduced?: boolean } = {}): Variants {
  const { y = distance.reveal, delay = 0, duration: d = duration.slow, reduced = false } = opts;
  if (reduced) return reducedVariants(delay);
  return {
    hidden: { opacity: 0, y },
    show: { opacity: 1, y: 0, transition: { duration: d, ease: easing.decelerate, delay } },
  };
}

export function fade(opts: { delay?: number; duration?: number; reduced?: boolean } = {}): Variants {
  const { delay = 0, duration: d = duration.base, reduced = false } = opts;
  return {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: reduced ? { ...reducedFade, delay } : { duration: d, ease: easing.standard, delay } },
  };
}

/** Conteneur qui décale l'entrée de ses enfants */
export function staggerChildren(opts: { each?: number; delay?: number; reduced?: boolean } = {}): Variants {
  const { each = stagger.items, delay = 0, reduced = false } = opts;
  return {
    hidden: {},
    show: { transition: { staggerChildren: reduced ? 0 : each, delayChildren: delay } },
  };
}

/** Révélation ligne par ligne derrière un masque (overflow: hidden) */
export function maskReveal(opts: { delay?: number; reduced?: boolean } = {}): Variants {
  const { delay = 0, reduced = false } = opts;
  if (reduced) return reducedVariants(delay);
  return {
    hidden: { y: "100%" },
    show: { y: "0%", transition: { duration: duration.hero, ease: easing.decelerate, delay } },
  };
}

/** Entrée avec ressort (cartes de choix, CTA final) */
export function springIn(opts: { y?: number; scale?: number; delay?: number; reduced?: boolean } = {}): Variants {
  const { y = 0, scale = 0.98, delay = 0, reduced = false } = opts;
  if (reduced) return reducedVariants(delay);
  return {
    hidden: { opacity: 0, y, scale },
    show: { opacity: 1, y: 0, scale: 1, transition: { ...springSoft, delay } },
  };
}

/* ------------------------------------------------------------------ */
/* Hook                                                                */
/* ------------------------------------------------------------------ */

/** true si l'utilisateur a demandé moins d'animations */
export function useReduced(): boolean {
  return useReducedMotion() ?? false;
}
