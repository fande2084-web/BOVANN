/**
 * specs/accueil.json → page.sections[hero].content.demo.scenes
 * Partagé entre l'iPhone (components/hero/HeroDemo.tsx) et le texte qui défile à gauche du hero.
 */
export const DEMO_STEPS = [
  { n: "01", title: "Choisis ton live", text: "Au studio de Lomé ou depuis ta boutique." },
  { n: "02", title: "Réserve ton créneau", text: "Ton jour, ton heure, ton package." },
  { n: "03", title: "Reçois la confirmation", text: "Sur WhatsApp, en quelques secondes." },
  { n: "04", title: "Passe en direct", text: "Ton produit, ton numéro et ton adresse devant tous." },
] as const;

export const DEMO_SCENE_DURATION = 4200;
