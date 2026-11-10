import { NextResponse } from "next/server";
import { REFERENCE_RE, RpcError, messageFor } from "@/lib/booking/rpc";
import { getPaymentProvider } from "@/lib/payments/provider";

/**
 * GET /api/payments/[reference] : état du paiement.
 * En simulation, c'est la base qui confirme (3 s après la demande) : le navigateur ne fait que lire.
 */
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ reference: string }> }) {
  const reference = (await params).reference.trim().toUpperCase();
  if (!REFERENCE_RE.test(reference)) {
    return NextResponse.json({ error: "reservation_introuvable", message: messageFor("reservation_introuvable") }, { status: 404 });
  }
  try {
    const state = await getPaymentProvider().check(reference);
    return NextResponse.json(state, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    const code = e instanceof RpcError ? e.code : "erreur_inconnue";
    return NextResponse.json({ error: code, message: messageFor(code) }, { status: e instanceof RpcError ? e.httpStatus : 500 });
  }
}
