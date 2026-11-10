"use client";

import { AlertCircle, CheckCircle2, CreditCard, Loader2, Smartphone } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { BookingPackage, SlotsConfig } from "@/lib/booking/catalog";
import { bookingKey, toE164, vendorCountryCode, type BookingDraft } from "@/lib/booking/draft";
import { addMinutesToTime, longDate, lomeTime } from "@/lib/booking/time";
import { PAYMENT_METHODS, type PaymentMethod } from "@/lib/payments/methods";
import { formatPrice } from "@/lib/packages";
import { WHATSAPP_URL } from "@/lib/site";
import { CountryPicker } from "./CountryPicker";
import { ActionButton, Field, StepHeading, choiceCardClass, inputClass } from "./ui";

/**
 * Étape 5 : specs/reservation.json → booking.steps[5]
 * Paiement SIMULÉ (Orange Money, MTN, Moov, carte) : la réservation est créée et les créneaux
 * bloqués 15 min, puis la base confirme le paiement 3 s après la demande.
 */
type Phase = "idle" | "working" | "pending" | "paid" | "failed" | "slots";

type ApiError = { error?: string; message?: string };

export function StepPayment({
  draft,
  update,
  pkg,
  config,
  headingId,
  onBusyChange,
  onBackToSlots,
  onPaid,
}: {
  draft: BookingDraft;
  update: (patch: Partial<BookingDraft>) => void;
  pkg: BookingPackage;
  config: SlotsConfig;
  headingId: string;
  onBusyChange: (busy: boolean) => void;
  onBackToSlots: () => void;
  onPaid: (reference: string) => void;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [phoneTouched, setPhoneTouched] = useState(false);
  const alive = useRef(true);
  useEffect(() => () => void (alive.current = false), []);
  useEffect(() => onBusyChange(phase === "working" || phase === "pending" || phase === "paid"), [phase, onBusyChange]);

  // Numéro de paiement : celui du WhatsApp par défaut
  const payerCountry = draft.payerCountry || draft.phoneCountry;
  const payerNational = draft.payerCountry ? draft.payerNational : draft.phoneNational;
  const method = PAYMENT_METHODS.find((m) => m.id === draft.paymentMethod);
  const payerPhone = toE164(payerCountry, payerNational);
  const phoneOk = !method?.mobile || payerPhone !== null;
  const canPay = Boolean(method) && phoneOk && phase !== "working" && phase !== "pending" && phase !== "paid";

  const directs = draft.slots.map((iso) => {
    const start = lomeTime(iso);
    return `${longDate(iso.slice(0, 10))}, de ${start} à ${addMinutesToTime(start, config.durationMin)}`;
  });

  const fail = (message: string, toSlots = false) => {
    if (!alive.current) return;
    setError(message);
    setPhase(toSlots ? "slots" : "failed");
  };

  const pay = async () => {
    if (!method) return;
    setError(null);
    setPhase("working");
    const key = bookingKey(draft);
    let reference = draft.pendingRef && draft.pendingKey === key ? draft.pendingRef : "";

    try {
      // 1. Réservation + blocage des créneaux (revérifiés côté serveur)
      if (!reference) {
        const res = await fetch("/api/bookings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: draft.mode,
            category: draft.category,
            category_detail: draft.categoryDetail,
            full_name: draft.fullName,
            business_name: draft.businessName,
            whatsapp: toE164(draft.phoneCountry, draft.phoneNational),
            country: vendorCountryCode(draft),
            address: draft.address,
            package_code: draft.packageCode,
            slots: draft.slots,
          }),
        });
        const json = (await res.json().catch(() => ({}))) as ApiError & { reference?: string };
        if (!res.ok || !json.reference) {
          const slotIssue = ["creneau_pris", "creneau_passe", "horaire_invalide", "jour_ferme", "avant_ouverture", "nombre_creneaux"];
          return fail(json.message ?? "Une erreur est survenue.", slotIssue.includes(json.error ?? ""));
        }
        reference = json.reference;
        update({ pendingRef: reference, pendingKey: key });
      }

      // 2. Demande de paiement
      const start = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference, method: method.id, phone: method.mobile ? payerPhone : null }),
      });
      const started = (await start.json().catch(() => ({}))) as ApiError & { payment_status?: string };
      if (!start.ok) {
        if (started.error === "blocage_expire") update({ pendingRef: "", pendingKey: "" });
        return fail(started.message ?? "Une erreur est survenue.", started.error === "blocage_expire");
      }
      if (started.payment_status === "paid") return succeed(reference);
      if (!alive.current) return;
      setPhase("pending");

      // 3. Attente de la confirmation (décidée par la base, jamais par le navigateur)
      for (let i = 0; i < 45 && alive.current; i++) {
        await new Promise((r) => setTimeout(r, 1000));
        const res = await fetch(`/api/payments/${reference}`, { cache: "no-store" });
        const state = (await res.json().catch(() => ({}))) as ApiError & { payment_status?: string; reason?: string };
        if (state.payment_status === "paid") return succeed(reference);
        if (state.payment_status === "failed") {
          if (state.reason === "blocage_expire") {
            update({ pendingRef: "", pendingKey: "" });
            return fail("Tes créneaux ne sont plus retenus (plus de 15 minutes). Choisis-les à nouveau.", true);
          }
          return fail("Le paiement a été refusé. Vérifie ton solde ou essaie un autre moyen.");
        }
      }
      fail("Pas de réponse pour l'instant. Vérifie ton téléphone puis réessaie.");
    } catch {
      fail("Connexion impossible pour l'instant. Réessaie dans un instant.");
    }
  };

  const succeed = (reference: string) => {
    if (!alive.current) return;
    setPhase("paid");
    window.setTimeout(() => onPaid(reference), 1200);
  };

  const pickMethod = (id: PaymentMethod) => {
    setError(null);
    if (phase === "failed" || phase === "slots") setPhase("idle");
    update({ paymentMethod: id });
  };

  return (
    <div>
      <StepHeading id={headingId} title="Paiement" />

      {/* Récapitulatif */}
      <dl className="mt-5 rounded-lg border border-line bg-surface">
        <div className="p-4 md:p-5">
          <dt className="text-label uppercase text-ink-muted">{directs.length > 1 ? "Tes directs" : "Ton direct"}</dt>
          {directs.map((d) => (
            <dd key={d} className="mt-1 text-body font-semibold text-ink first-letter:uppercase">
              {d} <span className="font-normal text-ink-muted">— heure de Lomé</span>
            </dd>
          ))}
          <dd className="mt-2 text-small text-ink-muted">
            {pkg.name} · {pkg.description}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-4 border-t border-line p-4 md:p-5">
          <dt className="text-label uppercase text-ink">Total</dt>
          <dd className="flex items-baseline gap-1.5">
            <span className="font-display text-h1 font-black text-ink md:text-h1-lg">{formatPrice(pkg.price)}</span>
            <span className="text-body font-semibold text-ink-muted">FCFA</span>
          </dd>
        </div>
      </dl>

      {/* Moyens de paiement */}
      <fieldset className="mt-6" disabled={phase === "working" || phase === "pending" || phase === "paid"}>
        <legend className="text-small font-semibold text-ink">Comment veux-tu payer ?</legend>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {PAYMENT_METHODS.map((m) => {
            const selected = draft.paymentMethod === m.id;
            const Icon = m.mobile ? Smartphone : CreditCard;
            return (
              <label key={m.id} className={`${choiceCardClass(selected)} flex items-start gap-3 pr-12`}>
                <input type="radio" name="payment" value={m.id} checked={selected} onChange={() => pickMethod(m.id)} className="sr-only" />
                <Icon aria-hidden size={22} strokeWidth={1.75} className="mt-0.5 shrink-0 text-ink" />
                <span>
                  <span className="block text-body font-semibold text-ink">{m.label}</span>
                  <span className="mt-0.5 block text-small text-ink-muted">{m.countries}</span>
                </span>
                {selected && (
                  <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-orange text-ink">
                    <CheckCircle2 aria-hidden size={16} strokeWidth={2.5} />
                  </span>
                )}
              </label>
            );
          })}
        </div>

        {method?.mobile && (
          <div className="mt-5">
            <Field
              id="payer_phone"
              label={`Le numéro ${method.label}`}
              help={
                phoneTouched && !phoneOk
                  ? "Vérifie le numéro : 6 à 12 chiffres, sans l'indicatif."
                  : "Tu recevras une demande de confirmation sur ce numéro."
              }
            >
              <div className="flex gap-2">
                <CountryPicker
                  id="payer_country"
                  variant="dial"
                  value={payerCountry}
                  onChange={(code) => update({ payerCountry: code, payerNational })}
                />
                <input
                  id="payer_phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel-national"
                  value={payerNational}
                  onChange={(e) => update({ payerCountry, payerNational: e.target.value })}
                  onBlur={() => setPhoneTouched(true)}
                  aria-describedby="payer_phone-help"
                  aria-invalid={(phoneTouched && !phoneOk) || undefined}
                  maxLength={20}
                  className={`${inputClass} min-w-0 flex-1`}
                />
              </div>
            </Field>
          </div>
        )}
        {method && !method.mobile && (
          <p className="mt-5 text-small text-ink-muted">En mode test, aucune donnée de carte n&apos;est demandée.</p>
        )}
      </fieldset>

      {/* Mode test */}
      <p className="mt-5 rounded-md border border-line bg-surface-alt p-4 text-small text-ink">
        <strong className="font-semibold">Mode test.</strong> Aucun paiement réel n&apos;est effectué et aucune donnée bancaire
        n&apos;est envoyée.
      </p>

      {/* États du paiement */}
      <div aria-live="polite" className="mt-5">
        {(phase === "working" || phase === "pending") && (
          <div className="flex items-start gap-3 rounded-md border border-line p-4">
            <Loader2 aria-hidden size={22} strokeWidth={1.75} className="mt-0.5 shrink-0 animate-spin text-ink motion-reduce:animate-none" />
            <div>
              <p className="text-body font-semibold text-ink">Paiement en cours</p>
              <p className="mt-0.5 text-small text-ink-muted">
                {phase === "working"
                  ? "On retient tes créneaux…"
                  : method?.mobile
                    ? `Confirmation envoyée au ${payerPhone ?? ""}`
                    : "Validation de ta carte…"}
              </p>
            </div>
          </div>
        )}
        {phase === "paid" && (
          <div className="flex items-start gap-3 rounded-md border border-orange bg-orange-soft p-4">
            <CheckCircle2 aria-hidden size={22} strokeWidth={1.75} className="mt-0.5 shrink-0 text-ink" />
            <div>
              <p className="text-body font-semibold text-ink">Paiement confirmé</p>
              <p className="mt-0.5 text-small text-ink-muted">On prépare ton reçu…</p>
            </div>
          </div>
        )}
        {(phase === "failed" || phase === "slots") && error && (
          <div role="alert" className="flex items-start gap-3 rounded-md border border-ink p-4">
            <AlertCircle aria-hidden size={22} strokeWidth={1.75} className="mt-0.5 shrink-0 text-ink" />
            <div className="flex-1">
              <p className="text-body font-semibold text-ink">{phase === "slots" ? "Créneau indisponible" : "Échec du paiement"}</p>
              <p className="mt-0.5 text-small text-ink-muted">{error}</p>
              {phase === "slots" && (
                <ActionButton variant="secondary" onClick={onBackToSlots} className="mt-3">
                  Choisir d&apos;autres créneaux
                </ActionButton>
              )}
            </div>
          </div>
        )}
      </div>

      <ActionButton onClick={pay} disabled={!canPay} fullWidth className="mt-5 h-14">
        {phase === "failed" ? "Réessayer" : `Payer ${formatPrice(pkg.price)} FCFA`}
      </ActionButton>
      {!method && <p className="mt-2 text-center text-small text-ink-muted">Choisis un moyen de paiement.</p>}

      <p className="mt-6 text-center text-small text-ink-muted">
        Un souci ?{" "}
        <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="font-semibold text-ink underline underline-offset-2">
          Écris-nous sur WhatsApp
        </a>
      </p>
    </div>
  );
}
