"use client";

import { ChevronLeft, ChevronRight, Clock, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { BookingPackage, SlotsConfig } from "@/lib/booking/catalog";
import { findCountry } from "@/lib/booking/countries";
import { vendorCountryCode, type BookingDraft } from "@/lib/booking/draft";
import {
  addMinutesToTime,
  daysInMonth,
  describeOffset,
  fetchBusySlots,
  freeSlotsOf,
  isoWeekday,
  keyOf,
  lomeTime,
  monthLabel,
  shortDay,
  shortDayMonth,
  timeIn,
  todayKey,
  tzOffsetMinutes,
} from "@/lib/booking/time";
import { StepHeading } from "./ui";

/**
 * Étape 4 : specs/reservation.json → booking.steps[4]
 * Calendrier (lundi en premier), créneaux libres, heure locale du vendeur, plusieurs directs.
 */
const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];
const MONTHS_AHEAD = 5;

type Props = {
  draft: BookingDraft;
  update: (patch: Partial<BookingDraft>) => void;
  headingId: string;
  pkg: BookingPackage;
  config: SlotsConfig;
};

const monthIndex = (key: string) => {
  const [y = 0, m = 1] = key.split("-").map(Number);
  return y * 12 + (m - 1);
};

export function StepSlots({ draft, update, headingId, pkg, config }: Props) {
  const today = todayKey();
  const firstKey = config.openingDate > today ? config.openingDate : today;
  const minMonth = monthIndex(firstKey);
  const maxMonth = minMonth + MONTHS_AHEAD;
  const initial = draft.slots[0] ? monthIndex(draft.slots[0].slice(0, 10)) : minMonth;

  const [view, setView] = useState(Math.min(Math.max(initial, minMonth), maxMonth));
  const year = Math.floor(view / 12);
  const month = view % 12;

  const [busy, setBusy] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [day, setDay] = useState<string | null>(draft.slots[0]?.slice(0, 10) ?? null);

  // Créneaux occupés du mois affiché
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(false);
    const from = keyOf(year, month, 1);
    const to = keyOf(month === 11 ? year + 1 : year, (month + 1) % 12, 1);
    fetchBusySlots(from, to)
      .then((set) => {
        if (!cancelled) setBusy(set);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [year, month]);

  // Un créneau choisi vient d'être pris par quelqu'un d'autre
  useEffect(() => {
    const lost = draft.slots.filter((s) => busy.has(s));
    if (lost.length > 0) {
      update({ slots: draft.slots.filter((s) => !busy.has(s)) });
      setNotice("Un créneau que tu avais choisi vient d'être pris. Choisis-en un autre.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seulement quand les créneaux occupés changent
  }, [busy]);

  const days = useMemo(() => {
    const now = new Date();
    return Array.from({ length: daysInMonth(year, month) }, (_, i) => {
      const key = keyOf(year, month, i + 1);
      const free = freeSlotsOf(key, config, busy, now);
      const chosen = draft.slots.filter((s) => s.startsWith(key)).length;
      return { key, day: i + 1, free, chosen, disabled: free.length === 0 && chosen === 0 };
    });
  }, [year, month, config, busy, draft.slots]);

  // Jour affiché : le jour choisi s'il est dans ce mois, sinon le premier jour libre
  useEffect(() => {
    if (loading) return;
    if (day && day.startsWith(keyOf(year, month, 1).slice(0, 7)) && !days.find((d) => d.key === day)?.disabled) return;
    setDay(days.find((d) => !d.disabled)?.key ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- au changement de mois / chargement
  }, [loading, year, month]);

  const country = findCountry(vendorCountryCode(draft));
  const tz = country?.tz ?? "Africa/Lome";
  const offsetNow = tzOffsetMinutes(tz, new Date(Date.UTC(year, month, 15, 12)));
  const leadBlanks = isoWeekday(keyOf(year, month, 1)) - 1;
  const dayInfo = days.find((d) => d.key === day);
  const full = draft.slots.length >= pkg.sessions;
  const multi = pkg.sessions > 1;

  const toggle = (iso: string) => {
    setNotice(null);
    if (draft.slots.includes(iso)) {
      update({ slots: draft.slots.filter((s) => s !== iso) });
    } else if (!multi) {
      update({ slots: [iso] });
    } else if (!full) {
      update({ slots: [...draft.slots, iso].sort() });
    }
  };

  const slotsOfDay = dayInfo ? [...new Set([...dayInfo.free, ...draft.slots.filter((s) => s.startsWith(dayInfo.key))])].sort() : [];

  return (
    <div>
      <StepHeading id={headingId} title="Choisis ton jour et ton heure" subtitle="Les premiers directs partent le 1er décembre." />

      {offsetNow !== 0 && (
        <p className="mt-5 flex gap-3 rounded-md bg-surface-alt p-4 text-small text-ink">
          <Clock aria-hidden size={18} strokeWidth={1.75} className="mt-0.5 shrink-0" />
          <span>
            Les heures ci-dessous sont celles de Lomé. Chez toi{country ? ` (${country.name})` : ""}, il est{" "}
            {describeOffset(offsetNow)}, et ton heure locale est rappelée sous chaque créneau.
          </span>
        </p>
      )}

      {multi && (
        <p className="mt-5 text-body font-semibold text-ink" aria-live="polite">
          {draft.slots.length} / {pkg.sessions} créneaux choisis
        </p>
      )}

      <div className="mt-5 grid gap-6 md:grid-cols-2 md:gap-8">
        {/* Calendrier */}
        <div>
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setView((v) => v - 1)}
              disabled={view <= minMonth}
              aria-label="Mois précédent"
              className="flex h-11 w-11 items-center justify-center rounded-md text-ink hover:bg-surface-alt disabled:text-line disabled:hover:bg-transparent"
            >
              <ChevronLeft aria-hidden size={20} strokeWidth={1.75} />
            </button>
            <div className="text-center">
              <p className="font-display text-h3 text-ink first-letter:uppercase">{monthLabel(year, month)}</p>
              {view === monthIndex(config.openingDate) && (
                <p className="mt-0.5 text-label uppercase text-orange-deep">Premier mois d&apos;antenne</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setView((v) => v + 1)}
              disabled={view >= maxMonth}
              aria-label="Mois suivant"
              className="flex h-11 w-11 items-center justify-center rounded-md text-ink hover:bg-surface-alt disabled:text-line disabled:hover:bg-transparent"
            >
              <ChevronRight aria-hidden size={20} strokeWidth={1.75} />
            </button>
          </div>

          <div className="mt-3 grid grid-cols-7 gap-1 text-center" role="grid" aria-label={monthLabel(year, month)} aria-busy={loading}>
            {WEEKDAYS.map((w, i) => (
              <span key={i} aria-hidden className="pb-1 text-small font-semibold text-ink-muted">
                {w}
              </span>
            ))}
            {Array.from({ length: leadBlanks }, (_, i) => (
              <span key={`b${i}`} />
            ))}
            {days.map((d) => {
              const isSel = d.key === day;
              const label = `${shortDay(d.key)}${d.disabled ? ", indisponible" : `, ${d.free.length} créneau${d.free.length > 1 ? "x" : ""}`}`;
              return (
                <button
                  key={d.key}
                  type="button"
                  disabled={d.disabled || loading}
                  onClick={() => setDay(d.key)}
                  aria-pressed={isSel}
                  aria-label={label}
                  className={
                    "relative flex aspect-square min-h-[40px] items-center justify-center rounded-md text-body transition-colors duration-fast ease-standard " +
                    (isSel
                      ? "bg-ink font-semibold text-white"
                      : d.disabled
                        ? "text-ink-muted/40 line-through decoration-line"
                        : "font-semibold text-ink hover:bg-surface-alt")
                  }
                >
                  {d.day}
                  {d.chosen > 0 && (
                    <span aria-hidden className={`absolute bottom-1.5 h-1.5 w-1.5 rounded-full ${isSel ? "bg-white" : "bg-orange"}`} />
                  )}
                </button>
              );
            })}
          </div>
          {loadError && (
            <p className="mt-3 text-small text-ink-muted">
              Impossible de vérifier les créneaux pris pour l&apos;instant. Ils seront revérifiés avant le paiement.
            </p>
          )}
        </div>

        {/* Créneaux du jour */}
        <div>
          {loading ? (
            <p className="text-body text-ink-muted">Chargement des créneaux…</p>
          ) : !dayInfo ? (
            <p className="text-body text-ink-muted">Aucun créneau libre ce mois-ci. Regarde le mois suivant.</p>
          ) : (
            <>
              <p className="text-body text-ink">
                <span className="inline-block font-semibold first-letter:uppercase">{shortDay(dayInfo.key)}</span>
                <span className="text-ink-muted">
                  {" "}
                  · {dayInfo.free.length} créneau{dayInfo.free.length > 1 ? "x" : ""}
                </span>
              </p>
              <ul className="mt-3 grid gap-2">
                {slotsOfDay.map((iso) => {
                  const chosen = draft.slots.includes(iso);
                  const blocked = !chosen && multi && full;
                  const start = lomeTime(iso);
                  const end = addMinutesToTime(start, config.durationMin);
                  const local = timeIn(iso, tz);
                  return (
                    <li key={iso}>
                      <button
                        type="button"
                        onClick={() => toggle(iso)}
                        disabled={blocked}
                        aria-pressed={chosen}
                        className={
                          "flex min-h-[56px] w-full items-center justify-between gap-3 rounded-md border px-4 py-2.5 text-left transition-colors duration-fast ease-standard " +
                          (chosen
                            ? "border-orange bg-orange-soft ring-1 ring-orange"
                            : blocked
                              ? "border-line text-ink-muted"
                              : "border-line hover:border-ink")
                        }
                      >
                        <span>
                          <span className="block text-body font-semibold text-ink">
                            {start} à {end}
                          </span>
                          {local !== start && <span className="block text-small text-ink-muted">soit {local} chez toi</span>}
                        </span>
                        <span className="text-small text-ink-muted">{chosen ? "Choisi" : "1 h 30"}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              {multi && full && (
                <p className="mt-3 text-small text-ink-muted">Tu as choisi tes {pkg.sessions} créneaux. Retire-en un pour en prendre un autre.</p>
              )}
            </>
          )}

          {notice && (
            <p role="alert" className="mt-3 text-small font-semibold text-ink">
              {notice}
            </p>
          )}

          {draft.slots.length > 0 && (
            <div className="mt-6 border-t border-line pt-4">
              <p className="text-label uppercase text-ink-muted">{multi ? "Tes créneaux" : "Ton créneau"}</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {draft.slots.map((iso) => (
                  <li key={iso}>
                    <button
                      type="button"
                      onClick={() => toggle(iso)}
                      aria-label={`Retirer ${shortDayMonth(iso.slice(0, 10))} à ${lomeTime(iso)}`}
                      className="inline-flex min-h-[40px] items-center gap-2 rounded-pill border border-line bg-surface px-3 text-small text-ink hover:border-ink"
                    >
                      <span className="inline-block first-letter:uppercase">{shortDayMonth(iso.slice(0, 10))}</span> · {lomeTime(iso)}
                      <X aria-hidden size={14} strokeWidth={2} className="text-ink-muted" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
