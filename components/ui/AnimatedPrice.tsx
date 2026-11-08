"use client";

import { AnimatePresence, m } from "framer-motion";
import { duration, easing, useReduced } from "@/lib/motion";

/**
 * Prix dont les chiffres défilent verticalement quand la valeur change
 * (specs/accueil.json → packages.motion.priceChange : 180 ms par chiffre).
 */
export function AnimatedPrice({ value, className = "" }: { value: string; className?: string }) {
  const reduced = useReduced();
  const chars = value.split("");

  return (
    <span className={`inline-flex whitespace-nowrap tabular-nums ${className}`} aria-label={value}>
      {chars.map((char, i) => {
        const isDigit = /\d/.test(char);
        // Index compté depuis la droite : les unités restent alignées si le nombre change de longueur
        const slot = chars.length - i;
        if (!isDigit) {
          return (
            <span key={`sep-${slot}`} aria-hidden>
              {char === " " ? " " : char}
            </span>
          );
        }
        return (
          <span key={`d-${slot}`} aria-hidden className="relative inline-block overflow-hidden">
            <span className="invisible">{char}</span>
            <AnimatePresence initial={false}>
              <m.span
                key={char}
                className="absolute inset-0"
                initial={reduced ? { opacity: 0 } : { y: "100%" }}
                animate={reduced ? { opacity: 1 } : { y: "0%" }}
                exit={reduced ? { opacity: 0 } : { y: "-100%" }}
                transition={
                  reduced
                    ? { duration: duration.reduced }
                    : { duration: duration.fast, ease: easing.standard, delay: i * 0.03 }
                }
              >
                {char}
              </m.span>
            </AnimatePresence>
          </span>
        );
      })}
    </span>
  );
}
