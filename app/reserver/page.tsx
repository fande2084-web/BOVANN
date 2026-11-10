import type { Metadata } from "next";
import { BookingFlow } from "@/components/booking/BookingFlow";
import { getBookingCatalog } from "@/lib/booking/catalog";
import { isMode } from "@/lib/booking/draft";

/** specs/reservation.json → booking (route /reserver) */
export const metadata: Metadata = {
  title: "Réserve ton live | OCD Live",
  description: "Réserve ton live OCD Live en 3 minutes : au studio de Lomé ou à distance, choisis ton package, ton jour et ton heure.",
  alternates: { canonical: "/reserver" },
};

// Packages et créneaux lus à chaque visite : un prix modifié dans l'admin apparaît immédiatement
export const dynamic = "force-dynamic";

export default async function ReserverPage({ searchParams }: { searchParams: Promise<{ mode?: string | string[] }> }) {
  const [{ mode }, { packages, config }] = await Promise.all([searchParams, getBookingCatalog()]);
  const initialMode = typeof mode === "string" && isMode(mode) ? mode : null;
  return <BookingFlow packages={packages} config={config} initialMode={initialMode} />;
}
