"use client";

import { m, useScroll, useSpring } from "framer-motion";
import { useRef } from "react";
import { fadeUp, staggerChildren, useReduced, viewportOnce } from "@/lib/motion";

/** specs/accueil.json → page.sections[comment] */
const STEPS = [
  { number: "01", title: "Choisis ton live", text: "Au studio ou à distance, puis le package qui te convient." },
  { number: "02", title: "Réserve ton créneau", text: "Choisis ton jour et ton heure. Tu reçois la confirmation sur WhatsApp." },
  { number: "03", title: "Passe en direct", text: "Présente ton produit, ton numéro et ton adresse à des milliers de clients." },
];

export function Steps() {
  const reduced = useReduced();
  const listRef = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({ target: listRef, offset: ["start 80%", "end 55%"] });
  const progress = useSpring(scrollYProgress, { stiffness: 220, damping: 40, restDelta: 0.001 });
  const scale = reduced ? 1 : progress;

  return (
    <section id="comment" aria-labelledby="comment-title" className="container-page py-16 lg:py-32">
      <m.h2
        id="comment-title"
        className="font-display text-h2 text-ink md:text-h2-lg"
        initial="hidden"
        whileInView="show"
        viewport={viewportOnce}
        variants={fadeUp({ reduced })}
      >
        Trois étapes. C&apos;est tout.
      </m.h2>

      <m.ol
        ref={listRef}
        className="relative mt-10 grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-8 lg:mt-16"
        initial="hidden"
        whileInView="show"
        viewport={viewportOnce}
        variants={staggerChildren({ reduced })}
      >
        {/* Ligne orange : verticale sur mobile, horizontale sur desktop, dessinée au défilement */}
        <span aria-hidden className="absolute bottom-6 left-[27px] top-6 w-px bg-line md:hidden" />
        <m.span
          aria-hidden
          className="absolute bottom-6 left-[27px] top-6 w-px origin-top bg-orange md:hidden"
          style={{ scaleY: scale }}
        />
        <span aria-hidden className="absolute left-0 right-0 top-6 hidden h-px bg-line md:block" />
        <m.span
          aria-hidden
          className="absolute left-0 right-0 top-6 hidden h-px origin-left bg-orange md:block"
          style={{ scaleX: scale }}
        />

        {STEPS.map((step) => (
          <m.li key={step.number} variants={fadeUp({ reduced })} className="relative flex gap-5 md:flex-col md:gap-6">
            <span
              aria-hidden
              className="relative z-10 w-14 shrink-0 bg-surface py-1 font-display text-[48px] font-black leading-[40px] tracking-[-0.02em] text-orange md:w-auto md:self-start md:pr-4"
            >
              {step.number}
            </span>
            <div className="pt-1 md:pt-0">
              <h3 className="font-display text-h3 text-ink md:text-h3-lg">
                <span className="sr-only">Étape {step.number} : </span>
                {step.title}
              </h3>
              <p className="mt-2 max-w-sm text-body text-ink-muted">{step.text}</p>
            </div>
          </m.li>
        ))}
      </m.ol>
    </section>
  );
}
