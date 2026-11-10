"use client";

import { Check, ChevronDown, Search } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { COUNTRIES, findCountry, matchCountry, type Country } from "@/lib/booking/countries";
import { inputClass } from "./ui";

/**
 * Sélecteur de pays avec recherche et drapeaux : specs/reservation.json → booking.steps[2]
 * (countryPicker de l'indicatif WhatsApp, et select-search du pays).
 */
export function CountryPicker({
  id,
  value,
  onChange,
  variant,
  placeholder = "Choisis ton pays",
  describedBy,
}: {
  id: string;
  value: string;
  onChange: (code: string) => void;
  /** « dial » : bouton compact « 🇹🇬 +228 » ; « country » : champ pleine largeur « 🇹🇬 Togo » */
  variant: "dial" | "country";
  placeholder?: string;
  describedBy?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const selected = findCountry(value);

  const results = useMemo(() => COUNTRIES.filter((c) => matchCountry(c, query)), [query]);

  useEffect(() => {
    if (!open) return;
    setActive(Math.max(0, results.findIndex((c) => c.code === value)));
    searchRef.current?.focus();
    const close = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- à l'ouverture seulement
  }, [open]);

  const pick = (country: Country) => {
    onChange(country.code);
    setOpen(false);
    setQuery("");
    document.getElementById(id)?.focus();
  };

  const onSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(results.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const c = results[active];
      if (c) pick(c);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      document.getElementById(id)?.focus();
    }
  };

  return (
    <div ref={rootRef} className={`relative ${variant === "dial" ? "shrink-0" : "w-full"}`}>
      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-describedby={describedBy}
        aria-label={variant === "dial" ? `Indicatif : ${selected ? `${selected.name} +${selected.dial}` : "aucun"}` : undefined}
        onClick={() => setOpen((o) => !o)}
        className={`${inputClass} flex items-center gap-2 text-left ${variant === "dial" ? "w-auto px-3" : ""}`}
      >
        {selected ? (
          <>
            <span aria-hidden className="text-[20px] leading-none">
              {selected.flag}
            </span>
            <span className="truncate">{variant === "dial" ? `+${selected.dial}` : selected.name}</span>
          </>
        ) : (
          <span className="truncate text-ink-muted/70">{placeholder}</span>
        )}
        <ChevronDown aria-hidden size={18} strokeWidth={1.75} className="ml-auto shrink-0 text-ink-muted" />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-2 w-[min(320px,calc(100vw-40px))] overflow-hidden rounded-md border border-line bg-surface shadow-card-hover">
          <div className="relative border-b border-line">
            <Search aria-hidden size={18} strokeWidth={1.75} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              onKeyDown={onSearchKey}
              placeholder="Rechercher un pays"
              aria-label="Rechercher un pays"
              role="combobox"
              aria-expanded="true"
              aria-controls={listId}
              aria-activedescendant={results[active] ? `${listId}-${results[active].code}` : undefined}
              className="h-12 w-full bg-transparent pl-10 pr-3 text-body text-ink placeholder:text-ink-muted/70 focus:outline-none"
            />
          </div>
          <ul id={listId} role="listbox" className="max-h-72 overflow-y-auto py-1">
            {results.length === 0 && <li className="px-4 py-3 text-small text-ink-muted">Aucun pays trouvé</li>}
            {results.map((country, i) => (
              <li
                key={country.code}
                id={`${listId}-${country.code}`}
                role="option"
                aria-selected={country.code === value}
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => pick(country)}
                onMouseEnter={() => setActive(i)}
                className={`flex min-h-[44px] cursor-pointer items-center gap-3 px-4 text-body ${i === active ? "bg-surface-alt" : ""}`}
              >
                <span aria-hidden className="text-[20px] leading-none">
                  {country.flag}
                </span>
                <span className="flex-1 truncate">{country.name}</span>
                <span className="text-small text-ink-muted">+{country.dial}</span>
                {country.code === value && <Check aria-hidden size={16} strokeWidth={2} className="text-ink" />}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
