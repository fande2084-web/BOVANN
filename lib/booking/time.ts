/**
 * Heures de Lomé et heure locale du vendeur : specs/reservation.json → booking.steps[4].
 * Lomé (Africa/Lome) est à GMT toute l'année, sans heure d'été : une heure de Lomé
 * est donc exactement une heure UTC. Les créneaux sont stockés en UTC (timestamptz).
 */
import { isSupabaseConfigured, supabaseConfig } from "@/lib/packages";
import type { SlotsConfig } from "./catalog";

export const LOME_TZ = "Africa/Lome";

/** « 2026-12-03 » + « 12:00 » → instant ISO « 2026-12-03T12:00:00.000Z » */
export function slotIso(dateKey: string, time: string): string {
  return new Date(`${dateKey}T${time}:00Z`).toISOString();
}

/** Clé de jour (AAAA-MM-JJ) à Lomé */
export function dateKeyOf(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function todayKey(): string {
  return dateKeyOf(new Date());
}

export function isoWeekday(dateKey: string): number {
  const d = new Date(`${dateKey}T00:00:00Z`).getUTCDay();
  return d === 0 ? 7 : d;
}

export function addMinutesToTime(time: string, minutes: number): string {
  const [h = 0, m = 0] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

const fmtCache = new Map<string, Intl.DateTimeFormat>();
function fmt(key: string, opts: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  let f = fmtCache.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat("fr-FR", opts);
    fmtCache.set(key, f);
  }
  return f;
}

/** Heure « 11:00 » d'un instant dans un fuseau */
export function timeIn(iso: string, tz: string): string {
  return fmt(`time-${tz}`, { timeZone: tz, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(iso));
}

/** Heure de Lomé « 12:00 » d'un instant */
export function lomeTime(iso: string): string {
  return timeIn(iso, LOME_TZ);
}

/** Décalage (minutes) d'un fuseau par rapport à GMT, à un instant donné */
export function tzOffsetMinutes(tz: string, at: Date = new Date()): number {
  // Heure murale du fuseau relue comme UTC, moins l'instant réel (indépendant de la langue :
  // « shortOffset » donne « UTC+1 » en français et « GMT+1 » en anglais)
  try {
    const parts = fmt(`wall-${tz}`, {
      timeZone: tz,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).formatToParts(at);
    const get = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((p) => p.type === type)?.value ?? 0);
    const wall = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"));
    const real = Math.floor(at.getTime() / 60000) * 60000;
    return Math.round((wall - real) / 60000);
  } catch {
    return 0;
  }
}

/** « 1 h plus tard », « 2 h 30 plus tôt » */
export function describeOffset(minutes: number): string {
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  const amount = m ? `${h} h ${String(m).padStart(2, "0")}` : `${h} h`;
  return `${amount} plus ${minutes > 0 ? "tard" : "tôt"}`;
}

/** « 1 » → « 1er » (« mardi 1er décembre », « mar. 1er ») */
const premier = (s: string) => s.replace(/(^|\s)1(?=\s|$)/, "$11er");

/** « jeudi 3 décembre » */
export function longDate(dateKey: string): string {
  return premier(fmt("long", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long" }).format(new Date(`${dateKey}T12:00:00Z`)));
}

/** « jeu. 3 » */
export function shortDay(dateKey: string): string {
  return premier(fmt("short", { timeZone: "UTC", weekday: "short", day: "numeric" }).format(new Date(`${dateKey}T12:00:00Z`)));
}

/** « jeu. 3 déc. » */
export function shortDayMonth(dateKey: string): string {
  return premier(fmt("shortm", { timeZone: "UTC", weekday: "short", day: "numeric", month: "short" }).format(new Date(`${dateKey}T12:00:00Z`)));
}

/** « décembre 2026 » */
export function monthLabel(year: number, month: number): string {
  return fmt("month", { timeZone: "UTC", month: "long", year: "numeric" }).format(new Date(Date.UTC(year, month, 15)));
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

export function keyOf(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Créneaux (ISO) d'un jour encore réservables : jour ouvert, futur, non occupé */
export function freeSlotsOf(dateKey: string, config: SlotsConfig, busy: Set<string>, now: Date = new Date()): string[] {
  if (dateKey < config.openingDate) return [];
  if (config.closedWeekdays.includes(isoWeekday(dateKey))) return [];
  if (config.closedDates.includes(dateKey)) return [];
  return config.startTimes
    .map((t) => slotIso(dateKey, t))
    .filter((iso) => new Date(iso).getTime() > now.getTime() && !busy.has(iso));
}

/** Créneaux occupés (payés ou bloqués) entre deux jours, via la fonction Supabase get_busy_slots */
export async function fetchBusySlots(fromKey: string, toKey: string): Promise<Set<string>> {
  if (!isSupabaseConfigured) return new Set();
  const res = await fetch(`${supabaseConfig.url}/rest/v1/rpc/get_busy_slots`, {
    method: "POST",
    headers: {
      apikey: supabaseConfig.anonKey,
      Authorization: `Bearer ${supabaseConfig.anonKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ p_from: `${fromKey}T00:00:00Z`, p_to: `${toKey}T00:00:00Z` }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`get_busy_slots ${res.status}`);
  const rows = (await res.json()) as string[];
  return new Set(rows.map((s) => new Date(s).toISOString()));
}
