import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { ReceiptPreview } from "@/components/booking/ReceiptPreview";
import { getBooking, whatsappMessage } from "@/lib/booking/record";
import { WHATSAPP_URL } from "@/lib/site";

/** specs/reservation.json → confirmation (route /reserver/confirmation/[reference]) */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "C'est réservé | OCD Live",
  robots: { index: false, follow: false },
};

export default async function ConfirmationPage({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  const booking = await getBooking(decodeURIComponent(reference));
  if (!booking) notFound();

  const paid = booking.payment_status === "paid";
  const waHref = `${WHATSAPP_URL}?text=${encodeURIComponent(whatsappMessage(booking))}`;

  return (
    <div className="min-h-dvh bg-surface">
      <header className="border-b border-line">
        <div className="mx-auto flex h-[60px] max-w-3xl items-center px-5 md:h-[72px] md:px-8">
          <Link href="/" aria-label="OCD Live, retour à l'accueil" className="rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-deep">
            <Logo className="h-9 md:h-11" />
          </Link>
        </div>
      </header>

      <main id="contenu" className="mx-auto max-w-3xl px-5 pb-16 pt-8 md:px-8 md:pt-12">
        {paid ? (
          <CheckCircle2 aria-hidden size={40} strokeWidth={1.75} className="text-ink" />
        ) : (
          <Clock aria-hidden size={40} strokeWidth={1.75} className="text-ink" />
        )}
        <h1 className="mt-4 font-display text-h1 text-ink md:text-h1-lg">{paid ? "C'est réservé" : "Paiement en attente"}</h1>
        <p className="mt-3 max-w-lead text-lead text-ink-muted">
          {paid
            ? "Garde ce reçu. Tu peux simplement en faire une capture d'écran."
            : "Ta réservation existe, mais le paiement n'est pas encore confirmé. Tes créneaux restent retenus 15 minutes."}
        </p>

        <div className="mt-6 inline-block rounded-md border border-line bg-surface-alt px-5 py-3">
          <p className="text-label uppercase text-ink-muted">Ta référence</p>
          <p className="mt-1 font-display text-h2 tracking-[0.04em] text-ink md:text-h2-lg">{booking.reference}</p>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button href={waHref} icon="message-circle" variant="dark" location="confirmation">
            Écrire sur WhatsApp
          </Button>
          <Button href="/reserver" variant="secondary" location="confirmation">
            {paid ? "Réserver un autre direct" : "Revenir au paiement"}
          </Button>
        </div>
        <p className="mt-4 text-small text-ink-muted">Envoie ta référence sur WhatsApp pour qu&apos;on prépare ton passage.</p>

        <div className="mt-10">
          <ReceiptPreview booking={booking} studioAddress={process.env.STUDIO_ADDRESS} />
        </div>
      </main>
    </div>
  );
}
