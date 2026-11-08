"use client";

import Image from "next/image";
import { m, useScroll, useTransform } from "framer-motion";
import { Check } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/Button";
import { duration, easing, fadeUp, staggerChildren, useReduced, viewportOnce } from "@/lib/motion";
import { STUDIO_PHOTO } from "@/lib/site";

/** specs/accueil.json → page.sections[studio] */
const LIST = [
  "Diffusion sur le compte House of Challenge",
  "Régie et accompagnement inclus",
  "Adresse et horaires envoyés sur WhatsApp",
];

export function StudioFeature() {
  const reduced = useReduced();
  const mediaRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: mediaRef, offset: ["start end", "end start"] });
  const scale = useTransform(scrollYProgress, [0, 1], [1.06, 1]);

  return (
    <section id="studio" aria-labelledby="studio-title" className="container-page py-16 lg:py-32">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-center lg:gap-12">
        {/* Le déclencheur reste hors du masque : un élément entièrement masqué n'est jamais « visible » */}
        <m.div
          ref={mediaRef}
          className="lg:col-span-7"
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
        >
          <m.div
            className="relative aspect-[4/5] overflow-hidden rounded-xl bg-night lg:aspect-[3/4]"
            variants={
              reduced
                ? {
                    hidden: { opacity: 0, clipPath: "inset(0% 0% 0% 0%)" },
                    show: { opacity: 1, clipPath: "inset(0% 0% 0% 0%)", transition: { duration: duration.reduced } },
                  }
                : {
                    hidden: { clipPath: "inset(100% 0% 0% 0%)" },
                    show: { clipPath: "inset(0% 0% 0% 0%)", transition: { duration: duration.hero, ease: easing.decelerate } },
                  }
            }
          >
            <m.div className="absolute inset-0" style={reduced ? undefined : { scale }}>
              <Image
                src={STUDIO_PHOTO.src}
                alt={STUDIO_PHOTO.alt}
                fill
                sizes="(min-width: 1200px) 680px, (min-width: 1024px) 58vw, 100vw"
                className="object-cover"
                style={{ objectPosition: "50% 20%" }}
              />
            </m.div>
          </m.div>
        </m.div>

        <m.div
          className="lg:col-span-5"
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          variants={staggerChildren({ reduced })}
        >
          <m.p variants={fadeUp({ reduced })} className="text-label uppercase text-orange-deep">
            Le studio
          </m.p>
          <m.h2 id="studio-title" variants={fadeUp({ reduced })} className="mt-3 font-display text-h2 text-ink md:text-h2-lg">
            Un vrai studio, à Lomé.
          </m.h2>
          <m.p variants={fadeUp({ reduced })} className="mt-4 text-lead text-ink-muted lg:text-lead-lg">
            Une régie dirige ton live du début à la fin. Tu t&apos;assois, tu présentes, tu vends.
          </m.p>
          <m.ul variants={fadeUp({ reduced })} className="mt-6 flex flex-col gap-3">
            {LIST.map((item) => (
              <li key={item} className="flex items-start gap-3 text-body text-ink">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-soft">
                  <Check aria-hidden size={14} strokeWidth={2.5} className="text-orange-deep" />
                </span>
                {item}
              </li>
            ))}
          </m.ul>
          <m.div variants={fadeUp({ reduced })} className="mt-8">
            <Button href="/reserver?mode=presentiel" location="studio">
              Réserver au studio
            </Button>
          </m.div>
        </m.div>
      </div>
    </section>
  );
}
