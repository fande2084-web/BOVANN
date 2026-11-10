import { Logo } from "@/components/ui/Logo";
import { receiptRows, sessionLines, type BookingRecord } from "@/lib/booking/record";

/**
 * Aperçu du reçu : specs/reservation.json → confirmation.buttons[1].content
 * (même contenu que le futur PDF A4 de la phase 4).
 */
export function ReceiptPreview({ booking, studioAddress }: { booking: BookingRecord; studioAddress?: string }) {
  const lines = sessionLines(booking);
  const instructions =
    booking.mode === "presentiel"
      ? `${studioAddress ? `Studio OCD Live, ${studioAddress}.` : "Studio OCD Live, Lomé. L'adresse exacte t'est envoyée sur WhatsApp."} Arrive 15 minutes avant ton direct.`
      : "Le lien de connexion t'est envoyé sur WhatsApp avant ton direct. Connecte-toi 15 minutes avant.";

  return (
    <article aria-label="Aperçu du reçu" className="overflow-hidden rounded-lg border border-line bg-surface shadow-card">
      <header className="flex items-center justify-between gap-4 p-5 md:p-6">
        <Logo className="h-10" />
        <p className="text-right text-small text-ink-muted">
          Reçu de réservation
          <br />
          <span className="font-semibold text-ink">{booking.reference}</span>
        </p>
      </header>

      {/* Bandeau orange : texte noir (contraste 6,3:1) */}
      <div className="bg-orange px-5 py-3 md:px-6">
        {lines.map((l) => (
          <p key={l.label} className="font-display text-[15px] font-black uppercase tracking-[0.04em] text-ink md:text-[17px]">
            {l.date} · {l.start} à {l.end}
          </p>
        ))}
        <p className="mt-0.5 text-small font-semibold text-ink">Heure de Lomé</p>
      </div>

      <dl className="grid gap-x-6 gap-y-3 p-5 sm:grid-cols-2 md:p-6">
        {receiptRows(booking).map(([label, value]) => (
          <div key={label}>
            <dt className="text-label uppercase text-ink-muted">{label}</dt>
            <dd className="mt-0.5 text-body text-ink">{value}</dd>
          </div>
        ))}
      </dl>

      <footer className="border-t border-line bg-surface-alt p-5 md:p-6">
        <p className="text-label uppercase text-ink-muted">Consignes</p>
        <p className="mt-1 text-body text-ink">{instructions}</p>
      </footer>
    </article>
  );
}
