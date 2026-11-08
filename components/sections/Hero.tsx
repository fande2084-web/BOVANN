"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { AnimatePresence, m } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { AfricaOutline } from "@/components/ui/AfricaOutline";
import { ChoiceCard, type Choice } from "@/components/ui/ChoiceCard";
import { LiveBadge } from "@/components/ui/LiveBadge";
import { track } from "@/lib/analytics";
import { duration, easing, fade, fadeUp, maskReveal, springIn, useReduced } from "@/lib/motion";
import { DEMO_STEPS } from "@/lib/demo-steps";
import { STUDIO_PHOTO } from "@/lib/site";

// Animation iPhone (components/hero/HeroDemo.tsx), dans son propre chunk JS
const HeroDemo = dynamic(() => import("@/components/hero/HeroDemo").then((mod) => mod.HeroDemo));

/** specs/accueil.json → page.sections[hero] */
const CHOICES: Choice[] = [
  {
    id: "presentiel",
    eyebrow: "Au studio",
    title: "Live en présentiel",
    description: "Viens au studio de Lomé. Une régie dirige ton live, tu n'as qu'à vendre.",
    meta: "Lomé, Togo",
    icon: "map-pin",
    cta: { label: "Choisir le studio" },
    href: "/reserver?mode=presentiel",
  },
  {
    id: "distance",
    eyebrow: "Depuis chez toi",
    title: "Live à distance",
    description: "Reste dans ta boutique, partout en Afrique ou dans le monde. Une animatrice t'accompagne en direct.",
    meta: "Cameroun, Tchad, Centrafrique, Gabon…",
    icon: "globe",
    cta: { label: "Choisir la distance" },
    href: "/reserver?mode=distance",
  },
];

const REASSURANCE = ["À partir de 15 000 FCFA", "Paiement Mobile Money", "Confirmation sur WhatsApp"];

/** Délais de la séquence d'entrée (s) */
const SEQ = { badge: 0, title: 0.08, titleStagger: 0.09, subtitle: 0.26, choices: 0.36, choicesStagger: 0.08, reassurance: 0.6 };

const thumbClass = "h-12 w-12 md:h-24 md:w-24";

export function Hero() {
  const reduced = useReduced();
  const router = useRouter();
  const [selected, setSelected] = useState<Choice["id"] | null>(null);
  // Scène de l'iPhone : le texte de gauche la suit
  const [scene, setScene] = useState(0);
  const step = DEMO_STEPS[scene] ?? DEMO_STEPS[0];
  const prefetched = useRef(new Set<string>());

  const prefetch = useCallback(
    (choice: Choice) => {
      if (prefetched.current.has(choice.href)) return;
      prefetched.current.add(choice.href);
      router.prefetch(choice.href);
    },
    [router],
  );

  const select = useCallback(
    (choice: Choice) => {
      if (selected) return;
      setSelected(choice.id);
      track("choice_selected", { mode: choice.id });
      // La carte choisie grandit, l'autre s'estompe, puis navigation (450 ms)
      window.setTimeout(() => router.push(choice.href), reduced ? duration.reduced * 1000 : duration.slow * 1000);
    },
    [reduced, router, selected],
  );

  return (
    <section id="hero" aria-labelledby="hero-title" className="overflow-x-clip px-5 pb-8 pt-6 md:px-8 lg:px-12 lg:pb-20 lg:pt-24">
      <div className="mx-auto grid max-w-page grid-cols-1 items-center gap-y-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-x-16 lg:gap-y-20">
      {/* 1. Accroche (colonne gauche) */}
      <div className="flex flex-col items-center text-center lg:col-start-1 lg:row-start-1 lg:items-start lg:text-left">
        <m.div initial="hidden" animate="show" variants={fadeUp({ y: 8, delay: SEQ.badge, reduced })}>
          <LiveBadge>Premiers lives dès le 1er décembre</LiveBadge>
        </m.div>

        <h1 id="hero-title" className="mt-4 font-display text-display text-ink lg:mt-6 lg:text-display-lg">
          <span className="block overflow-hidden pb-[0.06em]">
            <m.span
              className="block"
              initial="hidden"
              animate="show"
              variants={maskReveal({ delay: SEQ.title, reduced })}
            >
              Ton produit en direct.
            </m.span>
          </span>
          <span className="block overflow-hidden pb-[0.06em]">
            <m.span
              className="block text-ink-muted"
              initial="hidden"
              animate="show"
              variants={maskReveal({ delay: SEQ.title + SEQ.titleStagger, reduced })}
            >
              Devant des milliers de clients.
            </m.span>
          </span>
        </h1>

        <m.p
          className="mt-3 max-w-lead text-lead text-ink-muted lg:mt-6 lg:text-lead-lg"
          initial="hidden"
          animate="show"
          variants={fadeUp({ y: 12, delay: SEQ.subtitle, reduced })}
        >
          Réserve ton live OCD Live en 3 minutes. Tu présentes ton produit, ton numéro et ton adresse : on
          s&apos;occupe de la diffusion.
        </m.p>

        {/* Texte qui défile au rythme de l'iPhone (ordinateur ; sur mobile la légende reste sous l'iPhone) */}
        <m.div
          className="mt-10 hidden w-full max-w-lead lg:block"
          initial="hidden"
          animate="show"
          variants={fadeUp({ y: 12, delay: SEQ.choices, reduced })}
        >
          <div className="flex items-center gap-3">
            <p className="text-label uppercase text-ink-muted">Comment ça marche</p>
            <ol className="flex gap-1.5" aria-label="Étapes">
              {DEMO_STEPS.map((s, i) => (
                <li key={s.n}>
                  <button
                    type="button"
                    onClick={() => setScene(i)}
                    aria-label={`Étape ${s.n} : ${s.title}`}
                    aria-current={i === scene ? "step" : undefined}
                    className="flex h-6 items-center px-0.5"
                  >
                    <span
                      className={`block h-1 rounded-pill transition-all duration-base ease-standard ${
                        i === scene ? "w-6 bg-ink" : "w-2 bg-line"
                      }`}
                    />
                  </button>
                </li>
              ))}
            </ol>
          </div>
          <div aria-live="polite" className="relative mt-3 h-[104px] overflow-hidden">
            <AnimatePresence mode="wait" initial={false}>
              <m.div
                key={scene}
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduced ? { opacity: 0 } : { opacity: 0, y: -28 }}
                transition={{ duration: reduced ? duration.reduced : 0.35, ease: easing.standard }}
              >
                <p className="flex items-baseline gap-3 font-display text-h2-lg text-ink">
                  <span className="text-orange">{step.n}</span>
                  {step.title}
                </p>
                <p className="mt-2 pl-14 text-lead-lg text-ink-muted">{step.text}</p>
              </m.div>
            </AnimatePresence>
          </div>
        </m.div>
      </div>

      {/* 2. Choix, sur toute la largeur sous l'accroche et l'iPhone (sur mobile : juste après l'accroche) */}
      <div className="flex flex-col items-center text-center lg:col-span-2 lg:row-start-2">
        <p id="choix" className="scroll-mt-24 text-label uppercase text-ink-muted">
          Comment veux-tu faire ton live ?
        </p>

        <div className="mt-3 grid w-full grid-cols-1 gap-3 md:grid-cols-2 md:gap-6 lg:mt-5">
          {CHOICES.map((choice, i) => (
            <m.div
              key={choice.id}
              initial="hidden"
              animate="show"
              variants={springIn({ y: 24, delay: SEQ.choices + i * SEQ.choicesStagger, reduced })}
            >
              <ChoiceCard
                choice={choice}
                selected={selected === choice.id}
                dimmed={selected !== null && selected !== choice.id}
                onSelect={select}
                onIntent={prefetch}
                visual={
                  choice.id === "presentiel" ? (
                    <Image
                      src={STUDIO_PHOTO.src}
                      alt=""
                      width={96}
                      height={96}
                      sizes="(min-width: 768px) 96px, 48px"
                      className={`${thumbClass} object-cover`}
                      style={{ objectPosition: "50% 20%" }}
                      loading="eager"
                    />
                  ) : (
                    <div className={`${thumbClass} flex items-center justify-center bg-orange-soft/50 p-2`}>
                      <AfricaOutline className="h-full w-full" />
                    </div>
                  )
                }
              />
            </m.div>
          ))}
        </div>

        <m.ul
          aria-label="En bref"
          className="mt-5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-small text-ink-muted lg:mt-8"
          initial="hidden"
          animate="show"
          variants={fade({ delay: SEQ.reassurance, duration: duration.base, reduced })}
          transition={{ ease: easing.standard }}
        >
          {REASSURANCE.map((item, i) => (
            <li key={item} className="flex items-center gap-2">
              {i > 0 && <span aria-hidden>·</span>}
              {item}
            </li>
          ))}
        </m.ul>
      </div>

      {/* 3. Animation iPhone (colonne droite ; sur mobile : après les choix) */}
      <div className="mt-6 w-full lg:col-start-2 lg:row-start-1 lg:mt-0">
        <HeroDemo
          studioSrc={STUDIO_PHOTO.src}
          logoSrc="/brand/ocd-live-logo.svg"
          scene={scene}
          onSceneChange={setScene}
          captionClassName="lg:hidden"
        />
      </div>
      </div>
    </section>
  );
}
