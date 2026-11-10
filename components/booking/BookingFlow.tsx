"use client";

import { AnimatePresence, m } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { BookingPackage, SlotsConfig } from "@/lib/booking/catalog";
import {
  EMPTY_DRAFT,
  TOTAL_STEPS,
  isMode,
  isStepValid,
  loadDraft,
  saveDraft,
  selectedPackage,
  type BookingDraft,
  type Mode,
} from "@/lib/booking/draft";
import { duration, easing, useReduced } from "@/lib/motion";
import { Logo } from "@/components/ui/Logo";
import { StepRecap } from "./StepRecap";
import { StepSlots } from "./StepSlots";
import { ModeChoice, StepCategory, StepIdentity, StepPackage } from "./steps";
import { ActionButton } from "./ui";

/**
 * Parcours /reserver : specs/reservation.json → booking.
 * Barre « Étape 2 sur 5 », « Retour » / « Continuer → » (désactivé tant que l'étape n'est pas valide),
 * saisie conservée dans sessionStorage.
 */
export function BookingFlow({
  packages,
  config,
  initialMode,
}: {
  packages: BookingPackage[];
  config: SlotsConfig;
  initialMode: Mode | null;
}) {
  const reduced = useReduced();
  const [draft, setDraft] = useState<BookingDraft>({ ...EMPTY_DRAFT, mode: initialMode });
  const [hydrated, setHydrated] = useState(false);
  const headingRef = useRef<string>("booking-step-title");
  const firstRender = useRef(true);

  // Reprise de la saisie (sessionStorage) ; le mode de l'URL l'emporte
  useEffect(() => {
    const saved = loadDraft();
    setDraft((d) => {
      const merged: BookingDraft = { ...d, ...(saved ?? {}) };
      if (initialMode) merged.mode = initialMode;
      if (!isMode(merged.mode)) merged.mode = null;
      if (!packages.some((p) => p.code === merged.packageCode)) merged.packageCode = "";
      const pkg = packages.find((p) => p.code === merged.packageCode);
      merged.slots = (merged.slots ?? []).filter((s) => new Date(s).getTime() > Date.now()).slice(0, pkg?.sessions ?? 0);
      // Ne jamais reprendre au-delà de la première étape invalide
      let step = Math.min(Math.max(1, merged.step || 1), TOTAL_STEPS);
      for (let s = 1; s < step; s++) {
        if (!isStepValid(s, merged, packages)) {
          step = s;
          break;
        }
      }
      merged.step = step;
      return merged;
    });
    setHydrated(true);
  }, [initialMode, packages]);

  useEffect(() => {
    if (hydrated) saveDraft(draft);
  }, [draft, hydrated]);

  // Changement d'étape : haut de page + focus sur le titre (lecteurs d'écran)
  useEffect(() => {
    if (!hydrated) return;
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
    const t = window.setTimeout(() => document.getElementById(headingRef.current)?.focus({ preventScroll: true }), 50);
    return () => window.clearTimeout(t);
  }, [draft.step, draft.mode, hydrated, reduced]);

  const update = useCallback(
    (patch: Partial<BookingDraft>) =>
      setDraft((d) => {
        const next = { ...d, ...patch };
        // Changer de package garde au plus autant de créneaux que de directs
        if (patch.packageCode && patch.packageCode !== d.packageCode) {
          const pkg = packages.find((p) => p.code === patch.packageCode);
          next.slots = d.slots.slice(0, pkg?.sessions ?? 0);
        }
        return next;
      }),
    [packages],
  );

  const pickMode = (mode: Mode) => {
    window.history.replaceState(null, "", `/reserver?mode=${mode}`);
    setDraft((d) => ({ ...d, mode, step: 1 }));
  };

  const pkg = selectedPackage(draft, packages);
  const step = draft.step;
  const valid = isStepValid(step, draft, packages);

  const goNext = () => {
    if (!valid) return;
    update({ step: Math.min(step + 1, TOTAL_STEPS) });
  };
  const goBack = () => {
    if (step === 1) {
      window.history.replaceState(null, "", "/reserver");
      setDraft((d) => ({ ...d, mode: null }));
    } else update({ step: step - 1 });
  };

  const screenKey = draft.mode ? `step-${step}` : "mode";
  const variants = {
    initial: reduced ? { opacity: 0 } : { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0, transition: { duration: reduced ? duration.reduced : duration.base, ease: easing.decelerate } },
    exit: reduced ? { opacity: 0, transition: { duration: duration.reduced } } : { opacity: 0, y: -8, transition: { duration: duration.fast, ease: easing.accelerate } },
  };

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      {/* En-tête + progression */}
      <header className="sticky top-0 z-20 border-b border-line bg-surface/90 backdrop-blur">
        <div className="mx-auto flex h-[60px] max-w-3xl items-center justify-between gap-4 px-5 md:h-[72px] md:px-8">
          <Link href="/" aria-label="OCD Live, retour à l'accueil" className="rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-deep">
            <Logo className="h-9 md:h-11" />
          </Link>
          {draft.mode && hydrated && (
            <p className="text-small font-semibold text-ink" aria-live="polite">
              Étape {step} sur {TOTAL_STEPS}
            </p>
          )}
        </div>
        {draft.mode && hydrated && (
          <div className="h-1 w-full bg-line" role="progressbar" aria-valuemin={1} aria-valuemax={TOTAL_STEPS} aria-valuenow={step} aria-label="Progression de la réservation">
            <div
              className="h-full origin-left bg-ink transition-transform duration-slow ease-decelerate motion-reduce:transition-none"
              style={{ transform: `scaleX(${step / TOTAL_STEPS})` }}
            />
          </div>
        )}
      </header>

      <main id="contenu" className="mx-auto w-full max-w-3xl flex-1 px-5 pb-32 pt-6 md:px-8 md:pt-10">
        {!hydrated ? (
          <div className="h-64" aria-busy="true" />
        ) : (
          <AnimatePresence mode="wait" initial={false}>
            <m.div key={screenKey} variants={variants} initial="initial" animate="animate" exit="exit">
              {!draft.mode && <ModeChoice onPick={pickMode} headingId={headingRef.current} />}
              {draft.mode && step === 1 && <StepCategory draft={draft} update={update} headingId={headingRef.current} />}
              {draft.mode && step === 2 && (
                <StepIdentity draft={draft} update={update} headingId={headingRef.current} />
              )}
              {draft.mode && step === 3 && <StepPackage draft={draft} update={update} headingId={headingRef.current} packages={packages} />}
              {draft.mode && step === 4 && pkg && (
                <StepSlots draft={draft} update={update} headingId={headingRef.current} pkg={pkg} config={config} />
              )}
              {draft.mode && step === 5 && pkg && <StepRecap draft={draft} pkg={pkg} config={config} headingId={headingRef.current} />}
            </m.div>
          </AnimatePresence>
        )}
      </main>

      {/* Navigation fixe en bas */}
      {hydrated && (
        <nav
          aria-label="Navigation de la réservation"
          className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/90 pb-[env(safe-area-inset-bottom)] backdrop-blur"
        >
          <div className="mx-auto flex max-w-3xl items-center gap-3 px-5 py-3 md:px-8">
            {draft.mode ? (
              <ActionButton variant="secondary" onClick={goBack} className="px-4">
                <ArrowLeft aria-hidden size={20} strokeWidth={1.75} />
                Retour
              </ActionButton>
            ) : (
              <Link
                href="/"
                className="inline-flex h-12 items-center gap-2 rounded-md border-[1.5px] border-ink px-4 text-[16px] font-semibold text-ink hover:bg-surface-alt focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-deep"
              >
                <ArrowLeft aria-hidden size={20} strokeWidth={1.75} />
                Accueil
              </Link>
            )}
            {draft.mode && step < TOTAL_STEPS && (
              <ActionButton onClick={goNext} disabled={!valid} className="ml-auto flex-1 md:flex-none md:px-8">
                Continuer
                <ArrowRight aria-hidden size={20} strokeWidth={1.75} className="transition-transform duration-fast ease-standard group-hover:translate-x-1 group-disabled:translate-x-0" />
              </ActionButton>
            )}
          </div>
        </nav>
      )}
    </div>
  );
}
