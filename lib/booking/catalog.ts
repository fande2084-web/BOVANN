/**
 * Catalogue de réservation : specs/reservation.json → booking.steps[3] (packages) et steps[4] (créneaux).
 * Lu dans Supabase à chaque visite (un prix modifié dans l'admin apparaît immédiatement) ;
 * valeurs de la spec si Supabase est indisponible.
 */
import { isSupabaseConfigured, supabaseConfig } from "@/lib/packages";

export type BookingPackage = {
  code: string;
  name: string;
  description: string;
  sessions: number;
  price: number;
  perks: string[];
};

export type SlotsConfig = {
  startTimes: string[];
  durationMin: number;
  /** 1 = lundi … 7 = dimanche */
  closedWeekdays: number[];
  /** AAAA-MM-JJ */
  closedDates: string[];
  openingDate: string;
};

export const FALLBACK_CATALOG: BookingPackage[] = [
  { code: "essai", name: "Essai", description: "1 direct de 1 h 30", sessions: 1, price: 15000, perks: ["1 h 30 de direct sur House of Challenge"] },
  {
    code: "duo",
    name: "Duo",
    description: "2 directs de 1 h 30",
    sessions: 2,
    price: 28000,
    perks: ["2 directs aux dates que tu choisis", "Le deuxième direct annoncé pendant le premier", "Ton numéro et ton adresse annoncés à l'antenne"],
  },
  { code: "pack4", name: "Pack 4", description: "4 directs de 1 h 30", sessions: 4, price: 52000, perks: [] },
  {
    code: "annonce",
    name: "Annonce",
    description: "1 direct de 1 h 30 avec annonce",
    sessions: 1,
    price: 45000,
    perks: ["Bovann publie ta vidéo sur son compte", "Ton direct annoncé avant le passage", "1 h 30 de direct sur House of Challenge"],
  },
  { code: "mois", name: "Le Mois", description: "8 directs de 1 h 30", sessions: 8, price: 95000, perks: [] },
];

export const DEFAULT_SLOTS: SlotsConfig = {
  startTimes: ["10:00", "12:00", "14:00", "16:00", "18:00"],
  durationMin: 90,
  closedWeekdays: [],
  closedDates: [],
  openingDate: "2026-12-01",
};

type PackageRow = { code: string; name: string; description: string | null; sessions: number; price_fcfa: number; perks: string[] | null };
type SlotsRow = {
  start_times: string[] | null;
  duration_min: number | null;
  closed_weekdays: number[] | null;
  closed_dates: string[] | null;
  opening_date: string | null;
};

async function rest<T>(path: string): Promise<T | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const res = await fetch(`${supabaseConfig.url}/rest/v1/${path}`, {
      headers: { apikey: supabaseConfig.anonKey, Authorization: `Bearer ${supabaseConfig.anonKey}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function getBookingCatalog(): Promise<{ packages: BookingPackage[]; config: SlotsConfig }> {
  const [pkgRows, cfgRows] = await Promise.all([
    rest<PackageRow[]>("packages?select=code,name,description,sessions,price_fcfa,perks&active=eq.true&order=sort.asc"),
    rest<SlotsRow[]>("slots_config?select=*&id=eq.1"),
  ]);

  const packages =
    pkgRows && pkgRows.length > 0
      ? pkgRows.map((r) => ({
          code: r.code,
          name: r.name,
          description: r.description ?? "",
          sessions: r.sessions,
          price: r.price_fcfa,
          perks: r.perks ?? [],
        }))
      : FALLBACK_CATALOG;

  const row = cfgRows?.[0];
  const config: SlotsConfig = row
    ? {
        startTimes: row.start_times?.length ? [...row.start_times].sort() : DEFAULT_SLOTS.startTimes,
        durationMin: row.duration_min ?? DEFAULT_SLOTS.durationMin,
        closedWeekdays: row.closed_weekdays ?? [],
        closedDates: row.closed_dates ?? [],
        openingDate: row.opening_date ?? DEFAULT_SLOTS.openingDate,
      }
    : DEFAULT_SLOTS;

  return { packages, config };
}
