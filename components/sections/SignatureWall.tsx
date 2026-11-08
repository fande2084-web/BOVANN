"use client";

import { m, useInView } from "framer-motion";
import { useRef } from "react";
import { AFRICA_HEIGHT, AFRICA_MADAGASCAR, AFRICA_MAINLAND, AFRICA_VIEWBOX, AFRICA_WIDTH } from "@/lib/africa";
import { easing, springSoft, useReduced } from "@/lib/motion";

/**
 * specs/directives-design.json → applications.web.sectionSignature
 * Le mur du studio : fond #E9E8E9, silhouette de l'Afrique en contour LED doré, logo posé au centre.
 * Animation signature : allumage du contour (1 200 ms) puis halo en fondu (600 ms), pose du logo.
 */
export function SignatureWall() {
  const reduced = useReduced();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.35 });
  const on = reduced || inView;

  const draw = reduced
    ? { duration: 0 }
    : { duration: 1.2, ease: easing.decelerate };

  return (
    <section id="signature" aria-labelledby="signature-title" className="relative overflow-hidden bg-wall py-20 lg:py-32">
      {/* Socle : le sol clair du studio */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-1/5 bg-gradient-to-b from-transparent to-floor/60" />

      <div className="container-page relative flex flex-col items-center text-center">
        <div
          ref={ref}
          className="relative w-full max-w-[300px] sm:max-w-[420px] lg:max-w-[480px]"
          style={{ aspectRatio: `${AFRICA_WIDTH} / ${AFRICA_HEIGHT}` }}
        >
          {/* Un seul halo, derrière le héros */}
          <m.div
            aria-hidden
            className="absolute -inset-[12%]"
            initial={{ opacity: reduced ? 1 : 0 }}
            animate={{ opacity: on ? 1 : 0 }}
            transition={reduced ? { duration: 0 } : { duration: 0.6, delay: 1.2, ease: easing.standard }}
          >
            <div className="studio-halo halo-breathe absolute inset-0" />
          </m.div>

          <svg viewBox={AFRICA_VIEWBOX} fill="none" aria-hidden className="relative h-full w-full overflow-visible">
            {[AFRICA_MAINLAND, AFRICA_MADAGASCAR].map((d, i) => (
              <m.path
                key={i}
                d={d}
                className="led-contour"
                strokeLinejoin="round"
                strokeLinecap="round"
                // Pas de vector-effect : il casse pathLength (dessin progressif). Trait ≈ 1,5 px à l'écran.
                style={{ strokeWidth: 0.9 }}
                initial={{ pathLength: reduced ? 1 : 0, opacity: reduced ? 1 : 0 }}
                animate={on ? { pathLength: 1, opacity: 1 } : {}}
                transition={{ pathLength: { ...draw, delay: i * 0.5 }, opacity: { duration: reduced ? 0 : 0.1, delay: i * 0.5 } }}
              />
            ))}
          </svg>

          {/* Logo officiel, posé sur le mur, au centre de la silhouette */}
          <div className="absolute left-[50%] top-[22%] w-[44%] -translate-x-1/2 -translate-y-1/2">
          <m.div
            initial={reduced ? false : { opacity: 0, y: 12 }}
            animate={on ? { opacity: 1, y: 0 } : {}}
            transition={reduced ? { duration: 0 } : { ...springSoft, delay: 0.6 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- SVG statique */}
            <img
              src="/brand/ocd-live-logo.svg"
              alt="OCD Live"
              width={1699}
              height={760}
              className="wall-relief h-auto w-full"
              loading="lazy"
              decoding="async"
            />
          </m.div>
          </div>
        </div>

        <h2 id="signature-title" className="mt-14 max-w-3xl font-display text-h1 text-ink lg:mt-20 lg:text-h1-lg">
          Vendre partout en Afrique, en pleine lumière.
        </h2>
        <p className="mt-4 text-lead text-ink-muted lg:text-lead-lg">Au studio de Lomé ou depuis ta boutique.</p>
      </div>
    </section>
  );
}
