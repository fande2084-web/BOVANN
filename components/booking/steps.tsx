"use client";

import {
  Check,
  Globe,
  Handshake,
  MapPin,
  MoreHorizontal,
  Plug,
  Shirt,
  Sparkles,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import type { BookingPackage } from "@/lib/booking/catalog";
import { useState } from "react";
import { CATEGORIES, toE164, type BookingDraft, type Mode } from "@/lib/booking/draft";
import { formatPrice } from "@/lib/packages";
import { CountryPicker } from "./CountryPicker";
import { Field, StepHeading, choiceCardClass, inputClass } from "./ui";

type StepProps = {
  draft: BookingDraft;
  update: (patch: Partial<BookingDraft>) => void;
  headingId: string;
};

function Tick() {
  return (
    <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-orange text-ink">
      <Check aria-hidden size={14} strokeWidth={2.5} />
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Étape 0 : présentiel ou distance (si mode absent de l'URL)          */
/* ------------------------------------------------------------------ */

const MODES: { id: Mode; title: string; text: string; icon: LucideIcon }[] = [
  { id: "presentiel", title: "Je viens à Lomé", text: "En présentiel au studio", icon: MapPin },
  { id: "distance", title: "Je participe à distance", text: "D'où tu es, avec une hôtesse", icon: Globe },
];

export function ModeChoice({ onPick, headingId }: { onPick: (mode: Mode) => void; headingId: string }) {
  return (
    <div>
      <StepHeading id={headingId} title="Comment veux-tu faire ton live ?" subtitle="Tu pourras tout vérifier avant de payer." />
      <div className="mt-6 grid gap-3 md:grid-cols-2 md:gap-4">
        {MODES.map(({ id, title, text, icon: Icon }) => (
          <button key={id} type="button" onClick={() => onPick(id)} className={`${choiceCardClass(false)} min-h-[120px] md:p-6`}>
            <Icon aria-hidden size={24} strokeWidth={1.75} className="text-ink" />
            <span className="mt-4 block font-display text-h3 text-ink md:text-h3-lg">{title}</span>
            <span className="mt-1 block text-body text-ink-muted">{text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Étape 1 : tu vends quoi ?                                           */
/* ------------------------------------------------------------------ */

const CATEGORY_ICONS: Record<(typeof CATEGORIES)[number], LucideIcon> = {
  "Nourriture, restauration": UtensilsCrossed,
  "Vêtements, mode, chaussures": Shirt,
  "Cosmétiques, beauté, soins": Sparkles,
  "Matériel, électronique, maison": Plug,
  "Un service, une prestation": Handshake,
  "Autre chose": MoreHorizontal,
};

export function StepCategory({ draft, update, headingId }: StepProps) {
  return (
    <div>
      <StepHeading id={headingId} title="Tu vends quoi ?" subtitle="C'est ce qui permet de préparer ton passage correctement." />
      <fieldset className="mt-6">
        <legend className="sr-only">Catégorie</legend>
        <div className="grid gap-3 md:grid-cols-2">
          {CATEGORIES.map((cat) => {
            const Icon = CATEGORY_ICONS[cat];
            const selected = draft.category === cat;
            return (
              <label key={cat} className={`${choiceCardClass(selected)} flex min-h-[56px] items-center gap-3 pr-12`}>
                <input
                  type="radio"
                  name="category"
                  value={cat}
                  checked={selected}
                  onChange={() => update({ category: cat })}
                  className="sr-only"
                />
                <Icon aria-hidden size={22} strokeWidth={1.75} className="shrink-0 text-ink" />
                <span className="text-body font-semibold text-ink">{cat}</span>
                {selected && <Tick />}
              </label>
            );
          })}
        </div>
      </fieldset>

      {draft.category && (
        <div className="mt-6">
          <Field id="category_detail" label="Précise ce que tu vends" optional>
            <input
              id="category_detail"
              type="text"
              value={draft.categoryDetail}
              onChange={(e) => update({ categoryDetail: e.target.value })}
              placeholder="Par exemple : téléphones reconditionnés, chargeurs et housses"
              maxLength={120}
              className={inputClass}
            />
          </Field>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Étape 2 : qui vient à l'antenne ?                                   */
/* ------------------------------------------------------------------ */

export function StepIdentity({ draft, update, headingId }: StepProps) {
  // Erreur affichée seulement après avoir quitté le champ
  const [phoneTouched, setPhoneTouched] = useState(false);
  const phoneInvalid = phoneTouched && draft.phoneNational.trim() !== "" && toE164(draft.phoneCountry, draft.phoneNational) === null;
  return (
    <div>
      <StepHeading id={headingId} title="Qui vient à l'antenne ?" subtitle="C'est ce que l'organisateur reçoit avec ta réservation." />
      <div className="mt-6 space-y-5">
        <Field id="full_name" label="Ton nom">
          <input
            id="full_name"
            type="text"
            autoComplete="name"
            value={draft.fullName}
            onChange={(e) => update({ fullName: e.target.value })}
            maxLength={80}
            className={inputClass}
          />
        </Field>

        <Field id="business_name" label="Le nom de ton business">
          <input
            id="business_name"
            type="text"
            autoComplete="organization"
            value={draft.businessName}
            onChange={(e) => update({ businessName: e.target.value })}
            placeholder="Par exemple : Chez Afi, cuisine togolaise"
            maxLength={80}
            className={inputClass}
          />
        </Field>

        <Field id="whatsapp" label="Ton WhatsApp" help={phoneInvalid ? "Vérifie ton numéro : 6 à 12 chiffres, sans l'indicatif." : undefined}>
          <div className="flex gap-2">
            <CountryPicker id="whatsapp_country" variant="dial" value={draft.phoneCountry} onChange={(code) => update({ phoneCountry: code })} />
            <input
              id="whatsapp"
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              value={draft.phoneNational}
              onChange={(e) => update({ phoneNational: e.target.value })}
              onBlur={() => setPhoneTouched(true)}
              placeholder="90 12 34 56"
              aria-invalid={phoneInvalid || undefined}
              aria-describedby={phoneInvalid ? "whatsapp-help" : undefined}
              maxLength={20}
              className={`${inputClass} min-w-0 flex-1`}
            />
          </div>
        </Field>

        <Field id="country" label="Tu es dans quel pays ?" optional={draft.mode !== "distance"}>
          <CountryPicker id="country" variant="country" value={draft.country} onChange={(code) => update({ country: code })} />
        </Field>

        <Field id="address" label="Ton adresse ou lieu de vente" help="Affichée pendant le live" optional>
          <input
            id="address"
            type="text"
            autoComplete="street-address"
            value={draft.address}
            onChange={(e) => update({ address: e.target.value })}
            placeholder="Par exemple : Bè, Lomé"
            maxLength={120}
            aria-describedby="address-help"
            className={inputClass}
          />
        </Field>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Étape 3 : quel package ?                                            */
/* ------------------------------------------------------------------ */

export function StepPackage({ draft, update, headingId, packages }: StepProps & { packages: BookingPackage[] }) {
  // Prix « à l'unité » : le direct seul le moins cher
  const unit = Math.min(...packages.filter((p) => p.sessions === 1).map((p) => p.price));

  return (
    <div>
      <StepHeading id={headingId} title="Quel package ?" subtitle="Un direct dure une heure et demie. Tu peux changer plus tard." />
      <fieldset className="mt-6">
        <legend className="sr-only">Package</legend>
        <div className="grid gap-3 md:grid-cols-2">
          {packages.map((p) => {
            const selected = draft.packageCode === p.code;
            const perDirect = Math.round(p.price / p.sessions);
            const saving = Number.isFinite(unit) ? unit - perDirect : 0;
            return (
              <label key={p.code} className={`${choiceCardClass(selected)} pr-12`}>
                <input
                  type="radio"
                  name="package"
                  value={p.code}
                  checked={selected}
                  onChange={() => update({ packageCode: p.code })}
                  className="sr-only"
                />
                <span className="block font-display text-h3 text-ink md:text-h3-lg">{p.name}</span>
                <span className="mt-0.5 block text-small text-ink-muted">{p.description}</span>
                <span className="mt-3 flex items-baseline gap-1.5">
                  <span className="font-display text-h2 font-black text-ink">{formatPrice(p.price)}</span>
                  <span className="text-small font-semibold text-ink-muted">FCFA</span>
                </span>
                {p.sessions > 1 && (
                  <span className="mt-1 block text-small text-ink-muted">
                    {formatPrice(perDirect)} FCFA le direct
                    {saving > 0 && `, ${formatPrice(saving)} FCFA de moins qu'à l'unité`}
                  </span>
                )}
                {p.perks.length > 0 && (
                  <ul className="mt-3 space-y-1.5 border-t border-line pt-3">
                    {p.perks.map((perk) => (
                      <li key={perk} className="flex gap-2 text-small text-ink">
                        <Check aria-hidden size={16} strokeWidth={2} className="mt-0.5 shrink-0 text-ink" />
                        {perk}
                      </li>
                    ))}
                  </ul>
                )}
                {selected && <Tick />}
              </label>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}
