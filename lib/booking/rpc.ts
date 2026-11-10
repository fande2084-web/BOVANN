/**
 * Appels aux fonctions Supabase (RPC) depuis le serveur Next.js.
 * Les erreurs métier levées par la base (« creneau_pris », « blocage_expire »…) sont renvoyées telles quelles.
 */
import { isSupabaseConfigured, supabaseConfig } from "@/lib/packages";

/** Référence OCD-JJMM-XXXX (4 lettres sans O/0 ni I/1) */
export const REFERENCE_RE = /^OCD-\d{4}-[A-HJ-NP-Z2-9]{4}$/i;

export class RpcError extends Error {
  constructor(
    public code: string,
    public httpStatus: number,
  ) {
    super(code);
  }
}

export async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  if (!isSupabaseConfigured) throw new RpcError("supabase_non_configure", 503);
  let res: Response;
  try {
    res = await fetch(`${supabaseConfig.url}/rest/v1/rpc/${fn}`, {
      method: "POST",
      headers: {
        apikey: supabaseConfig.anonKey,
        Authorization: `Bearer ${supabaseConfig.anonKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(args),
      cache: "no-store",
    });
  } catch {
    throw new RpcError("reseau", 502);
  }
  const body = (await res.json().catch(() => null)) as unknown;
  if (!res.ok) {
    const message = (body as { message?: string } | null)?.message ?? "erreur_inconnue";
    // Fonction absente : le script SQL n'a pas été exécuté
    if (res.status === 404) throw new RpcError("schema_manquant", 503);
    throw new RpcError(message, res.status >= 500 ? 502 : 400);
  }
  return body as T;
}

/** Messages lisibles pour le vendeur */
export const ERROR_MESSAGES: Record<string, string> = {
  creneau_pris: "Quelqu'un vient de réserver un de tes créneaux. Choisis-en un autre.",
  creneau_passe: "Un de tes créneaux est déjà passé. Choisis-en un autre.",
  blocage_expire: "Tes créneaux ne sont plus retenus (plus de 15 minutes). Choisis-les à nouveau.",
  nombre_creneaux: "Le nombre de créneaux ne correspond pas à ton package.",
  creneaux_en_double: "Tu as choisi deux fois le même créneau.",
  horaire_invalide: "Ce créneau n'existe plus. Choisis-en un autre.",
  jour_ferme: "Le studio est fermé ce jour-là. Choisis un autre jour.",
  avant_ouverture: "Les directs commencent le 1er décembre.",
  package_inconnu: "Ce package n'est plus disponible. Choisis-en un autre.",
  champs_manquants: "Il manque une information. Reviens aux étapes précédentes.",
  mode_invalide: "Choisis présentiel ou distance.",
  moyen_invalide: "Choisis un moyen de paiement.",
  numero_invalide: "Vérifie le numéro qui doit recevoir la demande de paiement.",
  reservation_introuvable: "Réservation introuvable.",
  reservation_annulee: "Cette réservation a été annulée.",
  refuse: "Le paiement a été refusé. Vérifie ton solde ou essaie un autre moyen.",
  schema_manquant: "La réservation en ligne n'est pas encore activée. Écris-nous sur WhatsApp.",
  supabase_non_configure: "La réservation en ligne n'est pas encore activée. Écris-nous sur WhatsApp.",
  reseau: "Connexion impossible pour l'instant. Réessaie dans un instant.",
};

export function messageFor(code: string): string {
  return ERROR_MESSAGES[code] ?? "Une erreur est survenue. Réessaie dans un instant.";
}
