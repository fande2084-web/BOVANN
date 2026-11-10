"use client";

import type { BookingPackage, SlotsConfig } from "@/lib/booking/catalog";
import { findCountry } from "@/lib/booking/countries";
import { toE164, vendorCountryCode, type BookingDraft } from "@/lib/booking/draft";
import { addMinutesToTime, longDate, lomeTime } from "@/lib/booking/time";
import { formatPrice } from "@/lib/packages";
import { WHATSAPP_URL } from "@/lib/site";
import { Button } from "@/components/ui/Button";
import { StepHeading } from "./ui";

/**
 * Étape 5 (phase 2) : récapitulatif. Le paiement (PAYMENT_MODE=test) arrive en phase 3 ;
 * d'ici là, la réservation est envoyée sur WhatsApp à l'équipe.
 */
export function StepRecap({
  draft,
  pkg,
  config,
  headingId,
}: {
  draft: BookingDraft;
  pkg: BookingPackage;
  config: SlotsConfig;
  headingId: string;
}) {
  const country = findCountry(vendorCountryCode(draft));
  const phone = toE164(draft.phoneCountry, draft.phoneNational) ?? draft.phoneNational;
  const modeText = draft.mode === "distance" ? `À distance${country ? ` (${country.name})` : ""}` : "En présentiel au studio de Lomé";
  const directs = draft.slots.map((iso) => {
    const start = lomeTime(iso);
    return `${longDate(iso.slice(0, 10))}, de ${start} à ${addMinutesToTime(start, config.durationMin)}`;
  });

  const message = [
    "Bonjour, je veux réserver un live OCD Live.",
    `Nom : ${draft.fullName.trim()}`,
    `Business : ${draft.businessName.trim()}`,
    `Je vends : ${draft.category}${draft.categoryDetail.trim() ? ` (${draft.categoryDetail.trim()})` : ""}`,
    `WhatsApp : ${phone}`,
    `Mode : ${modeText}`,
    draft.address.trim() ? `Adresse : ${draft.address.trim()}` : null,
    `Package : ${pkg.name}, ${formatPrice(pkg.price)} FCFA`,
    `Direct${directs.length > 1 ? "s" : ""} (heure de Lomé) :`,
    ...directs.map((d) => `- ${d}`),
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <div>
      <StepHeading id={headingId} title="Paiement" subtitle="Vérifie ta réservation." />

      <dl className="mt-6 divide-y divide-line rounded-lg border border-line bg-surface">
        <div className="p-4 md:p-5">
          <dt className="text-label uppercase text-ink-muted">{directs.length > 1 ? "Tes directs" : "Ton direct"}</dt>
          {directs.map((d) => (
            <dd key={d} className="mt-1 text-body font-semibold text-ink first-letter:uppercase">
              {d} <span className="font-normal text-ink-muted">— heure de Lomé</span>
            </dd>
          ))}
        </div>
        <div className="grid gap-4 p-4 sm:grid-cols-2 md:p-5">
          <div>
            <dt className="text-label uppercase text-ink-muted">Package</dt>
            <dd className="mt-1 text-body text-ink">
              {pkg.name} · {pkg.description}
            </dd>
          </div>
          <div>
            <dt className="text-label uppercase text-ink-muted">Mode</dt>
            <dd className="mt-1 text-body text-ink">{modeText}</dd>
          </div>
          <div>
            <dt className="text-label uppercase text-ink-muted">À l&apos;antenne</dt>
            <dd className="mt-1 text-body text-ink">
              {draft.fullName.trim()} · {draft.businessName.trim()}
            </dd>
          </div>
          <div>
            <dt className="text-label uppercase text-ink-muted">WhatsApp</dt>
            <dd className="mt-1 text-body text-ink">{phone}</dd>
          </div>
        </div>
        <div className="flex items-baseline justify-between gap-4 p-4 md:p-5">
          <dt className="text-label uppercase text-ink">Total</dt>
          <dd className="flex items-baseline gap-1.5">
            <span className="font-display text-h1 font-black text-ink md:text-h1-lg">{formatPrice(pkg.price)}</span>
            <span className="text-body font-semibold text-ink-muted">FCFA</span>
          </dd>
        </div>
      </dl>

      <div className="mt-6 rounded-lg bg-surface-alt p-4 md:p-5">
        <p className="text-body font-semibold text-ink">Le paiement en ligne arrive très bientôt.</p>
        <p className="mt-1 text-body text-ink-muted">
          En attendant, envoie ta réservation sur WhatsApp : on la confirme avec toi et on t&apos;indique comment payer.
        </p>
        <Button
          href={`${WHATSAPP_URL}?text=${encodeURIComponent(message)}`}
          icon="message-circle"
          location="reserver_recap"
          className="mt-4"
          fullWidth
        >
          Envoyer ma réservation sur WhatsApp
        </Button>
      </div>
    </div>
  );
}
