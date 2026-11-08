"use client";

import { LazyMotion, MotionConfig, domAnimation } from "framer-motion";
import type { ReactNode } from "react";

/**
 * LazyMotion (domAnimation) : seules les fonctions utiles sont chargées.
 * reducedMotion="user" coupe les transformations si prefers-reduced-motion est actif ;
 * les variants de lib/motion.ts remplacent alors chaque entrée par un fondu de 150 ms.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
