/**
 * Brouillon de réservation : specs/reservation.json → booking.layout.persistence
 * (state + sessionStorage : revenir en arrière ne perd aucune saisie).
 */
import type { BookingPackage } from "./catalog";
import { DEFAULT_COUNTRY, findCountry } from "./countries";

export type Mode = "presentiel" | "distance";

export type BookingDraft = {
  mode: Mode | null;
  step: number;
  category: string;
  categoryDetail: string;
  fullName: string;
  businessName: string;
  phoneCountry: string;
  phoneNational: string;
  country: string;
  address: string;
  packageCode: string;
  /** Instants ISO (UTC = heure de Lomé) */
  slots: string[];
  /** Étape 5 : moyen et numéro de paiement */
  paymentMethod: string;
  payerCountry: string;
  payerNational: string;
  /** Réservation déjà créée (créneaux bloqués 15 min) et empreinte des choix qui l'ont créée */
  pendingRef: string;
  pendingKey: string;
};

export const EMPTY_DRAFT: BookingDraft = {
  mode: null,
  step: 1,
  category: "",
  categoryDetail: "",
  fullName: "",
  businessName: "",
  phoneCountry: DEFAULT_COUNTRY,
  phoneNational: "",
  country: "",
  address: "",
  packageCode: "",
  slots: [],
  paymentMethod: "",
  payerCountry: "",
  payerNational: "",
  pendingRef: "",
  pendingKey: "",
};

export const TOTAL_STEPS = 5;

export const CATEGORIES = [
  "Nourriture, restauration",
  "Vêtements, mode, chaussures",
  "Cosmétiques, beauté, soins",
  "Matériel, électronique, maison",
  "Un service, une prestation",
  "Autre chose",
] as const;

export function isMode(value: unknown): value is Mode {
  return value === "presentiel" || value === "distance";
}

/** Numéro au format E.164 (« +22890123456 »), ou null s'il n'est pas valide */
export function toE164(phoneCountry: string, national: string): string | null {
  const country = findCountry(phoneCountry);
  if (!country) return null;
  let digits = national.replace(/\D/g, "");
  // Indicatif recopié dans le champ (« 228 90… » ou « 00228 90… »)
  if (digits.startsWith(`00${country.dial}`)) digits = digits.slice(2 + country.dial.length);
  else if (national.trim().startsWith("+") && digits.startsWith(country.dial)) digits = digits.slice(country.dial.length);
  if (digits.length < 6 || digits.length > 12 || country.dial.length + digits.length > 15) return null;
  return `+${country.dial}${digits}`;
}

/** Pays du vendeur (fuseau, base de données) : pays déclaré, sinon pays du numéro WhatsApp */
export function vendorCountryCode(d: BookingDraft): string {
  return d.country || d.phoneCountry || DEFAULT_COUNTRY;
}

export function selectedPackage(d: BookingDraft, packages: BookingPackage[]): BookingPackage | undefined {
  return packages.find((p) => p.code === d.packageCode);
}

export function isStepValid(step: number, d: BookingDraft, packages: BookingPackage[]): boolean {
  switch (step) {
    case 1:
      return d.category !== "";
    case 2:
      return (
        d.fullName.trim().length >= 2 &&
        d.businessName.trim().length >= 2 &&
        toE164(d.phoneCountry, d.phoneNational) !== null &&
        (d.mode !== "distance" || d.country !== "")
      );
    case 3:
      return selectedPackage(d, packages) !== undefined;
    case 4: {
      const pkg = selectedPackage(d, packages);
      return pkg !== undefined && d.slots.length === pkg.sessions;
    }
    default:
      return true;
  }
}

const STORAGE_KEY = "ocd-live:reservation:v1";

export function loadDraft(): Partial<BookingDraft> | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Partial<BookingDraft>) : null;
  } catch {
    return null;
  }
}

/** Empreinte des choix qui définissent la réservation : si elle change, il faut en créer une nouvelle */
export function bookingKey(d: BookingDraft): string {
  return JSON.stringify([d.mode, d.packageCode, [...d.slots].sort(), d.fullName.trim(), d.businessName.trim(), d.phoneCountry, d.phoneNational, d.country, d.category, d.categoryDetail.trim(), d.address.trim()]);
}

export function clearDraft(): void {
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* rien */
  }
}

export function saveDraft(d: BookingDraft): void {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(d));
  } catch {
    /* navigation privée : la saisie reste en mémoire */
  }
}
