/**
 * Constantes du site : specs/accueil.json → meta, placeholders.
 * <NUMERO_BOVA> reste tel quel tant que le client ne l'a pas fourni.
 */
export const WHATSAPP_NUMBER = "<NUMERO_BOVA>";
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;

/**
 * Adresse publique (canonical, Open Graph, JSON-LD). Hébergement : Vercel.
 * Pour un nom de domaine : définir NEXT_PUBLIC_SITE_URL dans Vercel (ex. https://ocdlive.com).
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://bovann-pied.vercel.app").replace(/\/$/, "");

export const SEO = {
  title: "OCD Live — Réserve ton live et vends en direct | Studio à Lomé",
  description:
    "Réserve ton live OCD Live : au studio de Lomé ou à distance depuis ta boutique, partout en Afrique. Place ton produit devant des milliers de clients.",
  ogImage: "/images/og-ocd-live.jpg",
  canonical: `${SITE_URL}/`,
} as const;

export const STUDIO_PHOTO = {
  src: "/images/studio-lome.jpg",
  alt: "Le mur du studio OCD Live à Lomé : logo OCD Live au centre d'une carte de l'Afrique rétroéclairée",
} as const;

export const NAV_ITEMS = [
  { label: "Comment ça marche", href: "#comment" },
  { label: "Packages", href: "#packages" },
  { label: "Le studio", href: "#studio" },
] as const;
