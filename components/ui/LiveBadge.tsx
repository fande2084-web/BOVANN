/**
 * specs/accueil.json → components.LiveBadge.
 * Pilule surfaceAlt, point rouge 8 px avec halo pulsé (CSS, coupé en reduced-motion).
 */
export function LiveBadge({ children }: { children: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-pill bg-surface-alt px-3 py-[6px] text-label uppercase text-ink">
      <span aria-hidden className="relative inline-flex h-2 w-2">
        <span className="live-halo absolute inset-0 rounded-full bg-live" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-live" />
      </span>
      {children}
    </span>
  );
}
