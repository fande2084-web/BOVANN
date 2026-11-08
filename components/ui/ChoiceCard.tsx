"use client";

import { m, type Variants } from "framer-motion";
import { ArrowRight, Check, Globe, MapPin } from "lucide-react";
import type { MouseEvent, ReactNode } from "react";
import { duration, easing, spring, useReduced } from "@/lib/motion";

/** specs/accueil.json → components.ChoiceCard + hero.content.choices[] */
export type Choice = {
  id: "presentiel" | "distance";
  eyebrow: string;
  title: string;
  description: string;
  meta: string;
  icon: "map-pin" | "globe";
  cta: { label: string };
  href: string;
};

type Props = {
  choice: Choice;
  visual: ReactNode;
  selected: boolean;
  dimmed: boolean;
  onSelect: (choice: Choice) => void;
  onIntent?: (choice: Choice) => void;
};

const visualVariants: Variants = {
  rest: { scale: 1 },
  hover: { scale: 1.04, transition: spring },
};

export function ChoiceCard({ choice, visual, selected, dimmed, onSelect, onIntent }: Props) {
  const reduced = useReduced();
  const MetaIcon = choice.icon === "map-pin" ? MapPin : Globe;

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    // Ctrl/Cmd/Maj + clic, clic milieu : comportement natif (nouvel onglet)
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    onSelect(choice);
  };

  const stateAnimation = selected
    ? { scale: reduced ? 1 : 1.02, opacity: 1 }
    : dimmed
      ? { scale: 1, opacity: 0.4 }
      : { scale: 1, opacity: 1 };

  return (
    <m.a
      href={choice.href}
      onClick={handleClick}
      onPointerEnter={() => onIntent?.(choice)}
      onFocus={() => onIntent?.(choice)}
      onTouchStart={() => onIntent?.(choice)}
      aria-label={`${choice.title}, ${choice.eyebrow.toLowerCase()}. ${choice.description} ${choice.meta}. ${choice.cta.label}.`}
      aria-current={selected ? "true" : undefined}
      className={
        "group relative flex h-full min-h-[148px] flex-col rounded-xl border border-line bg-surface p-5 text-left shadow-card " +
        "transition-[box-shadow,border-color] duration-fast ease-standard hover:border-orange hover:shadow-card-glow " +
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-deep " +
        "md:min-h-[280px] md:p-8"
      }
      initial="rest"
      whileHover="hover"
      whileTap={{ scale: 0.98, transition: spring }}
      animate={stateAnimation}
      transition={reduced ? { duration: duration.reduced } : { duration: duration.slow, ease: easing.standard }}
      variants={{ rest: {}, hover: { y: -4, transition: spring } }}
    >
      {/* Bordure 2 px de l'état sélectionné, superposée pour éviter tout décalage */}
      <span
        aria-hidden
        className={`pointer-events-none absolute -inset-px rounded-xl border-2 border-orange transition-opacity duration-fast ${
          selected ? "opacity-100" : "opacity-0"
        }`}
      />

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-label uppercase text-ink-muted">{choice.eyebrow}</p>
          <h2 className="mt-1 font-display text-h2 text-ink md:mt-2 md:text-h2-lg">{choice.title}</h2>
        </div>
        <div className="relative shrink-0">
          <m.div variants={visualVariants} className="overflow-hidden rounded-md">
            {visual}
          </m.div>
          {selected && (
            <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-orange text-ink shadow-card">
              <Check aria-hidden size={16} strokeWidth={2.5} />
            </span>
          )}
        </div>
      </div>

      <div className="mt-2 flex items-end gap-3 md:mt-3">
        <p className="text-body text-ink-muted">{choice.description}</p>
        {/* Mobile : flèche seule, pour que les 2 cartes tiennent dans le premier écran */}
        <ArrowRight
          aria-hidden
          size={20}
          strokeWidth={1.75}
          className="mb-0.5 shrink-0 text-ink transition-transform duration-fast ease-standard group-hover:translate-x-1 motion-reduce:transition-none md:hidden"
        />
      </div>

      <div className="mt-auto hidden flex-col items-start gap-5 pt-6 md:flex">
        <p className="flex min-w-0 items-center gap-1.5 text-small text-ink-muted">
          <MetaIcon aria-hidden size={16} strokeWidth={1.75} className="shrink-0 text-ink" />
          <span className="truncate">{choice.meta}</span>
        </p>
        <span className="inline-flex shrink-0 items-center gap-1.5 text-body font-semibold text-ink">
          {choice.cta.label}
          <ArrowRight
            aria-hidden
            size={20}
            strokeWidth={1.75}
            className="transition-transform duration-fast ease-standard group-hover:translate-x-1 motion-reduce:transition-none"
          />
        </span>
      </div>
    </m.a>
  );
}
