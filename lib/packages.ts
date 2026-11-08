/**
 * Aperçu des packages : specs/accueil.json → page.sections[packages].
 * Lecture dans Supabase (table packages) si configuré, sinon valeurs du JSON.
 */
export type PackageItem = {
  name: string;
  detail: string;
  price: string;
  currency: string;
  highlight?: boolean;
  badge?: string;
  note?: string;
};

export const FALLBACK_PACKAGES: PackageItem[] = [
  { name: "Standard", detail: "1 live de 1 h 30", price: "15 000", currency: "FCFA", highlight: true, badge: "Le plus choisi" },
  { name: "Long", detail: "1 live de 4 h", price: "35 000", currency: "FCFA", note: "8 750 FCFA / heure" },
  { name: "Annonce BOVA", detail: "1 h 30 + vidéo d'annonce publiée par BOVA", price: "25 000", currency: "FCFA", note: "Visibilité maximale" },
];

/** Colonnes attendues dans la table packages */
export type PackageRow = {
  name: string;
  detail: string;
  price: number;
  currency: string | null;
  highlight: boolean | null;
  badge: string | null;
  note: string | null;
  position: number | null;
  show_on_home: boolean | null;
};

/** 15000 → "15 000" */
export function formatPrice(value: number): string {
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

export function rowToItem(row: PackageRow): PackageItem {
  return {
    name: row.name,
    detail: row.detail,
    price: formatPrice(row.price),
    currency: row.currency ?? "FCFA",
    highlight: row.highlight ?? false,
    badge: row.badge ?? undefined,
    note: row.note ?? undefined,
  };
}

export const supabaseConfig = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
};

export const isSupabaseConfigured = Boolean(supabaseConfig.url && supabaseConfig.anonKey);

/** Côté serveur, via l'API REST (aucun JS ajouté au client). Revalidé toutes les 60 s. */
export async function getHomePackages(): Promise<PackageItem[]> {
  if (!isSupabaseConfigured) return FALLBACK_PACKAGES;
  try {
    const url = `${supabaseConfig.url}/rest/v1/packages?select=*&show_on_home=eq.true&order=position.asc&limit=3`;
    const res = await fetch(url, {
      headers: { apikey: supabaseConfig.anonKey, Authorization: `Bearer ${supabaseConfig.anonKey}` },
      next: { revalidate: 60 },
    });
    if (!res.ok) return FALLBACK_PACKAGES;
    const rows = (await res.json()) as PackageRow[];
    return rows.length > 0 ? rows.map(rowToItem) : FALLBACK_PACKAGES;
  } catch {
    return FALLBACK_PACKAGES;
  }
}
