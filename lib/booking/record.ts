/**
 * Réservation lue par sa référence (page de confirmation, reçu) : fonction Supabase get_booking_by_reference.
 */
import { REFERENCE_RE, rpc } from "./rpc";
import { findCountry } from "./countries";
import { addMinutesToTime, longDate, lomeTime } from "./time";
import { methodLabel } from "@/lib/payments/methods";
import { formatPrice } from "@/lib/packages";

export type BookingRecord = {
  reference: string;
  mode: "presentiel" | "distance";
  category: string;
  category_detail: string | null;
  full_name: string;
  business_name: string;
  whatsapp: string;
  country: string;
  address: string | null;
  amount_fcfa: number;
  payment_method: string | null;
  payment_status: "pending" | "paid" | "failed" | "refunded";
  status: string;
  created_at: string;
  paid_at: string | null;
  payment_mode: "test" | "live" | null;
  package: { code: string; name: string; description: string; sessions: number } | null;
  sessions: { starts_at: string; ends_at: string }[];
};

export async function getBooking(reference: string): Promise<BookingRecord | null> {
  if (!REFERENCE_RE.test(reference)) return null;
  try {
    return await rpc<BookingRecord | null>("get_booking_by_reference", { p_reference: reference.toUpperCase() });
  } catch {
    return null;
  }
}

/** « jeudi 3 décembre, de 12:00 à 13:30 » (heure de Lomé) */
export function sessionLines(b: BookingRecord): { date: string; start: string; end: string; label: string }[] {
  return b.sessions.map((s) => {
    const start = lomeTime(s.starts_at);
    const end = s.ends_at ? lomeTime(s.ends_at) : addMinutesToTime(start, 90);
    const date = longDate(new Date(s.starts_at).toISOString().slice(0, 10));
    return { date, start, end, label: `${date}, de ${start} à ${end}` };
  });
}

/** Message WhatsApp de la spec (confirmation.buttons[0].message) */
export function whatsappMessage(b: BookingRecord): string {
  const lines = sessionLines(b);
  return [
    `Bonjour, je viens de payer ma réservation OCD Live.`,
    `Référence : ${b.reference}`,
    `Nom : ${b.full_name}`,
    `Package : ${b.package?.name ?? "—"}`,
    lines.length === 1 ? `Direct : ${lines[0]?.label}` : `Directs :\n${lines.map((l) => `- ${l.label}`).join("\n")}`,
  ].join("\n");
}

export function receiptRows(b: BookingRecord): [string, string][] {
  const country = findCountry(b.country);
  const statusLabel =
    b.payment_status === "paid"
      ? b.payment_mode === "live"
        ? "Payé"
        : "Payé (simulation, mode test)"
      : b.payment_status === "failed"
        ? "Paiement refusé"
        : "En attente de paiement";
  const issued = new Intl.DateTimeFormat("fr-FR", { timeZone: "Africa/Lome", dateStyle: "long", timeStyle: "short" }).format(
    new Date(b.paid_at ?? b.created_at),
  );
  return [
    ["Référence", b.reference],
    ["Nom", b.full_name],
    ["Business", b.business_name],
    ["Catégorie", b.category_detail ? `${b.category} (${b.category_detail})` : b.category],
    ["WhatsApp", b.whatsapp],
    ["Pays", country ? country.name : b.country],
    ["Mode", b.mode === "presentiel" ? "En présentiel au studio" : "À distance"],
    ["Package", b.package ? `${b.package.name} · ${b.package.description}` : "—"],
    ["Moyen de paiement", methodLabel(b.payment_method)],
    ["Montant", `${formatPrice(b.amount_fcfa)} FCFA`],
    ["Statut", statusLabel],
    ["Date d'émission", issued],
  ];
}
