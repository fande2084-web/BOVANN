import { NextResponse } from "next/server";
import { REFERENCE_RE, RpcError, messageFor } from "@/lib/booking/rpc";
import { getPaymentProvider, isPaymentMethod } from "@/lib/payments/provider";

/** POST /api/payments : lance (ou relance) le paiement d'une réservation. Simulation uniquement. */
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const reference = typeof body?.reference === "string" ? body.reference.trim().toUpperCase() : "";
  const method = body?.method;
  const phone = typeof body?.phone === "string" ? body.phone.trim() : null;

  if (!REFERENCE_RE.test(reference)) {
    return NextResponse.json({ error: "reservation_introuvable", message: messageFor("reservation_introuvable") }, { status: 400 });
  }
  if (!isPaymentMethod(method)) {
    return NextResponse.json({ error: "moyen_invalide", message: messageFor("moyen_invalide") }, { status: 400 });
  }

  try {
    const state = await getPaymentProvider().start(reference, method, phone);
    return NextResponse.json(state);
  } catch (e) {
    const code = e instanceof RpcError ? e.code : "erreur_inconnue";
    return NextResponse.json({ error: code, message: messageFor(code) }, { status: e instanceof RpcError ? e.httpStatus : 500 });
  }
}
