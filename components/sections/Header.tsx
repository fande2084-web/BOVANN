"use client";

import Link from "next/link";
import { AnimatePresence, m } from "framer-motion";
import { MessageCircle, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type TouchEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { NAV_ITEMS, WHATSAPP_URL } from "@/lib/site";
import { track } from "@/lib/analytics";
import { duration, easing, spring, useReduced } from "@/lib/motion";

/** specs/accueil.json → page.sections[header] */
export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
    <header
      className={
        "sticky top-0 z-40 h-[60px] transition-[background-color,box-shadow,backdrop-filter] duration-fast ease-standard md:h-[72px] " +
        (scrolled ? "glass shadow-header" : "bg-transparent shadow-none")
      }
    >
      <div className="container-page flex h-full items-center justify-between gap-4">
        <Link href="/" aria-label="OCD Live, accueil" className="rounded-sm">
          <Logo className="h-11 md:h-[54px]" />
        </Link>

        <nav aria-label="Navigation principale" className="hidden md:block">
          <ul className="flex items-center gap-8">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="rounded-sm text-small font-medium text-ink transition-colors duration-fast hover:text-ink-muted"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2 md:gap-5">
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track("whatsapp_click", { location: "header" })}
            className="hidden items-center gap-1.5 rounded-sm text-small font-medium text-ink md:inline-flex"
          >
            <MessageCircle aria-hidden size={20} strokeWidth={1.75} />
            Contact
          </a>
          <Button href="#choix" size="sm" location="header">
            Réserver
          </Button>
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-expanded={menuOpen}
            aria-controls="menu-mobile"
            aria-label="Ouvrir le menu"
            className="-mr-2 flex h-11 w-11 items-center justify-center rounded-md md:hidden"
          >
            <span aria-hidden className="flex w-5 flex-col gap-[6px]">
              <span className="h-[2px] w-full rounded-full bg-ink" />
              <span className="h-[2px] w-full rounded-full bg-ink" />
            </span>
          </button>
        </div>
      </div>

    </header>
    <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}

function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const reduced = useReduced();
  const panelRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number | null>(null);
  const [dragY, setDragY] = useState(0);

  const close = useCallback(() => {
    setDragY(0);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>("a,button")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "Tab" && panelRef.current) {
        const items = panelRef.current.querySelectorAll<HTMLElement>("a,button");
        const first = items[0];
        const last = items[items.length - 1];
        if (!first || !last) return;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [open, close]);

  // Fermeture par glissement vers le bas
  const onTouchStart = (e: TouchEvent) => {
    touchStartY.current = e.touches[0]?.clientY ?? null;
  };
  const onTouchMove = (e: TouchEvent) => {
    if (touchStartY.current === null) return;
    const delta = (e.touches[0]?.clientY ?? 0) - touchStartY.current;
    setDragY(Math.max(0, delta));
  };
  const onTouchEnd = () => {
    touchStartY.current = null;
    if (dragY > 96) close();
    else setDragY(0);
  };

  return (
    <AnimatePresence>
      {open && (
        <m.div
          ref={panelRef}
          id="menu-mobile"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className="fixed inset-0 z-50 flex flex-col bg-surface px-5 pb-[calc(24px+env(safe-area-inset-bottom))] md:hidden"
          initial={reduced ? { opacity: 0 } : { y: "100%" }}
          animate={reduced ? { opacity: 1 } : { y: dragY }}
          exit={reduced ? { opacity: 0 } : { y: "100%", transition: { duration: duration.base, ease: easing.accelerate } }}
          transition={reduced ? { duration: duration.reduced } : dragY > 0 ? { duration: 0 } : spring}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div className="flex h-[60px] items-center justify-between">
            <span aria-hidden className="mx-auto h-1 w-10 rounded-full bg-line" />
            <button
              type="button"
              onClick={close}
              aria-label="Fermer le menu"
              className="absolute right-3 flex h-11 w-11 items-center justify-center rounded-md"
            >
              <X aria-hidden size={24} strokeWidth={1.75} />
            </button>
          </div>
          <nav aria-label="Navigation mobile" className="mt-8">
            <ul className="flex flex-col gap-6">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <a href={item.href} onClick={close} className="block rounded-sm font-display text-h2 text-ink">
                    {item.label}
                  </a>
                </li>
              ))}
              <li>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    track("whatsapp_click", { location: "menu" });
                    close();
                  }}
                  className="block rounded-sm font-display text-h2 text-ink"
                >
                  Contact
                </a>
              </li>
            </ul>
          </nav>
          <div className="mt-auto">
            <Button href="#choix" size="lg" fullWidth location="menu" onClick={close}>
              Réserver mon live
            </Button>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
