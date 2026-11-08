"use client";

import { m } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { springIn, useReduced, viewportOnce } from "@/lib/motion";
import { WHATSAPP_URL } from "@/lib/site";

/** specs/accueil.json → page.sections[finalCta] */
export function ClosingCTA() {
  const reduced = useReduced();
  return (
    <section id="final-cta" aria-labelledby="final-cta-title" className="container-page py-16 text-center lg:py-32">
      <m.div initial="hidden" whileInView="show" viewport={viewportOnce} variants={springIn({ reduced })}>
        <h2 id="final-cta-title" className="font-display text-display text-ink lg:text-display-lg">
          Prêt à passer en direct ?
        </h2>
        <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center lg:mt-10">
          <Button href="#choix" size="lg" location="final_cta">
            Réserver mon live
          </Button>
          <Button href={WHATSAPP_URL} variant="secondary" size="lg" icon="message-circle" location="final_cta">
            Écrire sur WhatsApp
          </Button>
        </div>
      </m.div>
    </section>
  );
}
