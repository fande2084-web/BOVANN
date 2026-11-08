"use client";

import { m, useScroll, useTransform, type MotionValue } from "framer-motion";
import { useRef } from "react";
import { fadeUp, useReduced, viewportOnce } from "@/lib/motion";

/** specs/accueil.json → page.sections[valeur] */
const QUOTE = "Tu ne viens pas seulement vendre. Tu viens te faire connaître.";
const HIGHLIGHT = "te faire connaître";

const words = QUOTE.split(" ");
const highlightStart = QUOTE.slice(0, QUOTE.indexOf(HIGHLIGHT)).split(" ").length - 1;
const highlightEnd = highlightStart + HIGHLIGHT.split(" ").length;

export function Statement() {
  const reduced = useReduced();
  const sectionRef = useRef<HTMLElement>(null);
  const quoteRef = useRef<HTMLParagraphElement>(null);

  const { scrollYProgress: quoteProgress } = useScroll({ target: quoteRef, offset: ["start 85%", "end 45%"] });
  const { scrollYProgress: sectionProgress } = useScroll({ target: sectionRef, offset: ["start end", "end start"] });
  // Parallaxe légère : 24 px vers la gauche sur toute la traversée
  const decorX = useTransform(sectionProgress, [0, 1], [0, -24]);

  return (
    <section
      ref={sectionRef}
      id="valeur"
      aria-labelledby="valeur-eyebrow"
      className="relative overflow-hidden bg-night py-20 lg:py-32"
    >
      <div aria-hidden className="pointer-events-none absolute right-5 top-16 md:right-8 md:top-1/2 md:-translate-y-1/2 lg:right-16">
        <m.div className="flex gap-2 md:gap-4" style={reduced ? undefined : { x: decorX }}>
          {[1, 0.55, 0.25].map((opacity) => (
            <span
              key={opacity}
              className="block h-10 w-2 -skew-x-[20deg] rounded-sm bg-orange md:h-64 md:w-6"
              style={{ opacity }}
            />
          ))}
        </m.div>
      </div>

      <div className="container-page relative">
        <m.p
          id="valeur-eyebrow"
          className="text-label uppercase text-night-text"
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          variants={fadeUp({ reduced })}
        >
          Le marketing avant la vente
        </m.p>

        <p ref={quoteRef} className="mt-5 max-w-3xl font-display text-h1 md:pr-40 md:text-h1-lg lg:pr-0">
          <span className="sr-only">{QUOTE}</span>
          <span aria-hidden>
            {words.map((word, i) => (
              <Word
                key={`${word}-${i}`}
                word={word}
                progress={quoteProgress}
                range={[i / words.length, (i + 1) / words.length]}
                highlight={i >= highlightStart && i < highlightEnd}
                reduced={reduced}
              />
            ))}
          </span>
        </p>

        <m.p
          className="mt-6 max-w-xl text-lead text-night-text lg:mt-8 lg:text-lead-lg"
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          variants={fadeUp({ reduced })}
        >
          Ton produit, ton numéro et ton adresse restent dans la tête de ceux qui auront besoin de toi demain.
        </m.p>
      </div>
    </section>
  );
}

/** Mot gris (#5C5752) recouvert de sa version claire, dont seule l'opacité suit le défilement */
function Word({
  word,
  progress,
  range,
  highlight,
  reduced,
}: {
  word: string;
  progress: MotionValue<number>;
  range: [number, number];
  highlight: boolean;
  reduced: boolean;
}) {
  const opacity = useTransform(progress, range, [0, 1]);
  return (
    <>
      <span className="relative inline-block">
        <span className="text-night-dim">{word}</span>
        <m.span
          className={`absolute inset-0 ${highlight ? "text-orange" : "text-white"}`}
          style={{ opacity: reduced ? 1 : opacity }}
        >
          {word}
        </m.span>
      </span>{" "}
    </>
  );
}
