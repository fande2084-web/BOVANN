import { getHomePackages } from "@/lib/packages";
import { PackagesCarousel } from "@/components/sections/PackagesCarousel";

/**
 * specs/accueil.json → page.sections[packages].
 * Composant serveur : lit la table packages de Supabase (repli sur les valeurs du JSON).
 */
export async function PackagesPreview() {
  const items = await getHomePackages();
  return <PackagesCarousel initialItems={items} />;
}
