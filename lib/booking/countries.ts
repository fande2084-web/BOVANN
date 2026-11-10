/**
 * Pays, indicatifs et fuseaux IANA : specs/reservation.json → booking.steps[2] (countryPicker)
 * et steps[4].timezone (« table pays → fuseau IANA »).
 * Les 14 pays de la spec d'abord, puis la diaspora et les voisins.
 */
export type Country = {
  code: string;
  name: string;
  dial: string;
  tz: string;
  flag: string;
};

const flag = (code: string) =>
  String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));

const c = (code: string, name: string, dial: string, tz: string): Country => ({ code, name, dial, tz, flag: flag(code) });

export const COUNTRIES: Country[] = [
  c("TG", "Togo", "228", "Africa/Lome"),
  c("BJ", "Bénin", "229", "Africa/Porto-Novo"),
  c("BF", "Burkina Faso", "226", "Africa/Ouagadougou"),
  c("CM", "Cameroun", "237", "Africa/Douala"),
  c("CF", "Centrafrique", "236", "Africa/Bangui"),
  c("CI", "Côte d'Ivoire", "225", "Africa/Abidjan"),
  c("CG", "Congo-Brazzaville", "242", "Africa/Brazzaville"),
  c("CD", "RD Congo", "243", "Africa/Kinshasa"),
  c("GA", "Gabon", "241", "Africa/Libreville"),
  c("TD", "Tchad", "235", "Africa/Ndjamena"),
  c("SN", "Sénégal", "221", "Africa/Dakar"),
  c("ML", "Mali", "223", "Africa/Bamako"),
  c("NE", "Niger", "227", "Africa/Niamey"),
  c("GN", "Guinée", "224", "Africa/Conakry"),
  c("GH", "Ghana", "233", "Africa/Accra"),
  c("NG", "Nigeria", "234", "Africa/Lagos"),
  c("MA", "Maroc", "212", "Africa/Casablanca"),
  c("FR", "France", "33", "Europe/Paris"),
  c("BE", "Belgique", "32", "Europe/Brussels"),
  c("CH", "Suisse", "41", "Europe/Zurich"),
  c("DE", "Allemagne", "49", "Europe/Berlin"),
  c("IT", "Italie", "39", "Europe/Rome"),
  c("ES", "Espagne", "34", "Europe/Madrid"),
  c("GB", "Royaume-Uni", "44", "Europe/London"),
  c("CA", "Canada", "1", "America/Toronto"),
  c("US", "États-Unis", "1", "America/New_York"),
];

export const DEFAULT_COUNTRY = "TG";

export function findCountry(code: string | null | undefined): Country | undefined {
  return COUNTRIES.find((x) => x.code === code);
}

/** Recherche sans accents ni casse : nom, code ou indicatif */
export function matchCountry(country: Country, query: string): boolean {
  const norm = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
  const q = norm(query.trim().replace(/^\+/, ""));
  if (!q) return true;
  return norm(country.name).includes(q) || country.code.toLowerCase() === q || country.dial.startsWith(q);
}
