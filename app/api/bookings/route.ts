import { NextResponse } from "next/server";
import { isMode } from "@/lib/booking/draft";
import { RpcError, messageFor, rpc } from "@/lib/booking/rpc";

/**
 * POST /api/bookings : crée la réservation et bloque les créneaux 15 min, dans une transaction
 * (fonction Supabase create_booking : revérifie package, horaires, jours fermés et disponibilité).
 * specs/reservation.json → database.writes
 */
export const dynamic = "force-dynamic";

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "champs_manquants", message: messageFor("champs_manquants") }, { status: 400 });

  const slots = Array.isArray(body.slots) ? body.slots.filter((s): s is string => typeof s === "string") : [];
  const whatsapp = str(body.whatsapp, 20);
  const booking = {
    mode: body.mode,
    category: str(body.category, 80),
    category_detail: str(body.category_detail, 120),
    full_name: str(body.full_name, 80),
    business_name: str(body.business_name, 80),
    whatsapp,
    country: str(body.country, 2).toUpperCase(),
    address: str(body.address, 120),
    package_code: str(body.package_code, 30),
  };

  if (
    !isMode(booking.mode) ||
    !booking.category ||
    booking.full_name.length < 2 ||
    booking.business_name.length < 2 ||
    !/^\+[0-9]{8,15}$/.test(whatsapp) ||
    !/^[A-Z]{2}$/.test(booking.country) ||
    !booking.package_code ||
    slots.length === 0 ||
    slots.length > 31 ||
    slots.some((s) => Number.isNaN(Date.parse(s)))
  ) {
    return NextResponse.json({ error: "champs_manquants", message: messageFor("champs_manquants") }, { status: 400 });
  }

  try {
    const rows = await rpc<{ booking_id: string; reference: string }[]>("create_booking", {
      p_booking: booking,
      p_starts: slots.map((s) => new Date(s).toISOString()),
    });
    const reference = rows[0]?.reference;
    if (!reference) throw new RpcError("erreur_inconnue", 502);
    return NextResponse.json({ reference }, { status: 201 });
  } catch (e) {
    const code = e instanceof RpcError ? e.code : "erreur_inconnue";
    const status = code === "creneau_pris" ? 409 : e instanceof RpcError ? e.httpStatus : 500;
    return NextResponse.json({ error: code, message: messageFor(code) }, { status });
  }
}
