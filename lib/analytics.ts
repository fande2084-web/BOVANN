/**
 * Événements : specs/accueil.json → analytics.
 * Envoie vers Meta Pixel (fbq) et TikTok Pixel (ttq) s'ils sont chargés sur la page.
 */
type EventMap = {
  choice_selected: { mode: "presentiel" | "distance" };
  cta_click: { location: string; label: string };
  whatsapp_click: { location: string };
  packages_view_all: Record<string, never>;
};

type PixelWindow = Window & {
  fbq?: (cmd: "trackCustom", name: string, props?: Record<string, unknown>) => void;
  ttq?: { track: (name: string, props?: Record<string, unknown>) => void };
};

export function track<K extends keyof EventMap>(name: K, props: EventMap[K]): void {
  if (typeof window === "undefined") return;
  const w = window as PixelWindow;
  try {
    w.fbq?.("trackCustom", name, props);
    w.ttq?.track(name, props);
  } catch {
    /* un pixel bloqué ne doit jamais casser la navigation */
  }
  if (process.env.NODE_ENV !== "production") console.debug("[analytics]", name, props);
}
