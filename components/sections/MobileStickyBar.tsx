"use client";

import { AnimatePresence, m } from "framer-motion";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { duration, easing, spring, useReduced } from "@/lib/motion";

/**
 * specs/accueil.json → page.mobileStickyBar.
 * Visible sur mobile une fois le hero dépassé, masquée quand le CTA final est à l'écran.
 */
export function MobileStickyBar() {
  const reduced = useReduced();
  const [pastHero, setPastHero] = useState(false);
  const [finalVisible, setFinalVisible] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("hero");
    const finalCta = document.getElementById("final-cta");
    const observers: IntersectionObserver[] = [];

    if (hero) {
      const o = new IntersectionObserver(([entry]) => {
        if (!entry) return;
        setPastHero(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      });
      o.observe(hero);
      observers.push(o);
    }
    if (finalCta) {
      const o = new IntersectionObserver(([entry]) => setFinalVisible(entry?.isIntersecting ?? false), { threshold: 0.2 });
      o.observe(finalCta);
      observers.push(o);
    }
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const visible = pastHero && !finalVisible;

  return (
    <AnimatePresence>
      {visible && (
        <m.div
          className="glass fixed inset-x-0 bottom-0 z-30 border-t border-line px-5 pb-[calc(12px+env(safe-area-inset-bottom))] pt-3 md:hidden"
          initial={reduced ? { opacity: 0 } : { y: "100%" }}
          animate={reduced ? { opacity: 1 } : { y: "0%" }}
          exit={reduced ? { opacity: 0 } : { y: "100%", transition: { duration: duration.base, ease: easing.accelerate } }}
          transition={reduced ? { duration: duration.reduced } : spring}
        >
          <Button href="#choix" fullWidth location="sticky_bar">
            Réserver mon live
          </Button>
        </m.div>
      )}
    </AnimatePresence>
  );
}
