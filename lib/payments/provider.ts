/**
 * Paiement : specs/reservation.json → booking.steps[5].provider
 * Interface commune ; une seule implémentation pour l'instant : « test » (simulation, aucun agrégateur).
 * Source de vérité : la base de données (check_payment), jamais la seule réponse du navigateur.
 * PAYMENT_MODE=test|live (live : FedaPay ou CinetPay, phase 8, non branché).
 */
import { rpc } from "@/lib/booking/rpc";
import type { PaymentMethod } from "./methods";

export { PAYMENT_METHODS, isPaymentMethod, type PaymentMethod } from "./methods";

export type PaymentState = {
  payment_status: "pending" | "paid" | "failed" | "refunded";
  status: string;
  reason?: string;
};

export interface PaymentProvider {
  readonly mode: "test" | "live";
  /** Demande de paiement (push Mobile Money ou page carte) */
  start(reference: string, method: PaymentMethod, phone: string | null): Promise<PaymentState>;
  /** État du paiement (en test : confirmé par la base 3 s après la demande) */
  check(reference: string): Promise<PaymentState>;
}

const testProvider: PaymentProvider = {
  mode: "test",
  start: (reference, method, phone) =>
    rpc<PaymentState>("start_payment", { p_reference: reference, p_method: method, p_phone: method === "card" ? null : phone }),
  check: (reference) => rpc<PaymentState>("check_payment", { p_reference: reference }),
};

export const PAYMENT_MODE: "test" | "live" = process.env.PAYMENT_MODE === "live" ? "live" : "test";

export function getPaymentProvider(): PaymentProvider {
  if (PAYMENT_MODE === "live") {
    // Phase 8 : FedaPay ou CinetPay. Tant qu'aucun agrégateur n'est branché, on reste en simulation.
    throw new Error("Paiement réel non configuré : aucun agrégateur branché (PAYMENT_MODE doit rester « test »).");
  }
  return testProvider;
}
