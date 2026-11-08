/**
 * Constantes du site : specs/accueil.json → meta, placeholders.
 * <NUMERO_BOVA> reste tel quel tant que le client ne l'a pas fourni.
 */
export const WHATSAPP_NUMBER = "<NUMERO_BOVA>";
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;

export const SITE_URL = "https://ocd-live.netlify.app";

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
