/**
 * Moyens de paiement proposés (simulation, aucun agrégateur pour l'instant).
 * specs/reservation.json → booking.steps[5].methods (Wave remplacé par Moov Money à la demande du client).
 */
export const PAYMENT_METHODS = [
  { id: "orange_money", label: "Orange Money", countries: "Côte d'Ivoire, Cameroun, Sénégal, Mali", mobile: true },
  { id: "mtn", label: "MTN Mobile Money", countries: "Cameroun, Bénin, Côte d'Ivoire, Ghana", mobile: true },
  { id: "moov", label: "Moov Money", countries: "Togo (Flooz), Bénin, Côte d'Ivoire, Niger", mobile: true },
  { id: "card", label: "Carte bancaire", countries: "Visa ou Mastercard, depuis partout dans le monde", mobile: false },
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number]["id"];

export function isPaymentMethod(value: unknown): value is PaymentMethod {
  return PAYMENT_METHODS.some((m) => m.id === value);
}

export function methodLabel(id: string | null | undefined): string {
  return PAYMENT_METHODS.find((m) => m.id === id)?.label ?? "—";
}
