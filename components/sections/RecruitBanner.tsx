"use client";

import { m } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { fadeUp, useReduced, viewportOnce } from "@/lib/motion";

/** specs/accueil.json → page.sections[recrutement] */
export function RecruitBanner() {
  const reduced = useReduced();
  return (
    <section id="recrutement" aria-labelledby="recrutement-title" className="container-page">
      <m.div
        className="flex flex-col gap-4 rounded-lg bg-orange-soft p-6 md:flex-row md:items-center md:justify-between md:gap-8 md:p-10"
        initial="hidden"
        whileInView="show"
        viewport={viewportOnce}
        variants={fadeUp({ reduced })}
      >
        <div className="max-w-xl">
          <h3 id="recrutement-title" className="font-display text-h3 text-ink md:text-h3-lg">
            On recrute une animatrice à Lomé.
          </h3>
          <p className="mt-2 text-body text-ink-muted">
            Tu sais parler et tu sais vendre ? Pas besoin de diplôme. Rejoins l&apos;équipe à temps plein.
          </p>
        </div>
        <Button href="/recrutement" variant="ghost" icon="arrow-right" location="recrutement" className="self-start md:self-auto">
          Postuler
        </Button>
      </m.div>
    </section>
  );
}
