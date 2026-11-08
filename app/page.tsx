import dynamic from "next/dynamic";
import { Header } from "@/components/sections/Header";
import { Hero } from "@/components/sections/Hero";
import { PackagesPreview } from "@/components/sections/PackagesPreview";
import { Footer } from "@/components/sections/Footer";

/*
 * Ordre : specs/accueil.json → page.sections.
 * Les sections sous la ligne de flottaison sont découpées en morceaux séparés
 * (rendues côté serveur pour le SEO, leur JS n'alourdit pas le premier écran).
 */
const Steps = dynamic(() => import("@/components/sections/Steps").then((mod) => mod.Steps));
const Statement = dynamic(() => import("@/components/sections/Statement").then((mod) => mod.Statement));
const SignatureWall = dynamic(() => import("@/components/sections/SignatureWall").then((mod) => mod.SignatureWall));
const StudioFeature = dynamic(() => import("@/components/sections/StudioFeature").then((mod) => mod.StudioFeature));
const RecruitBanner = dynamic(() => import("@/components/sections/RecruitBanner").then((mod) => mod.RecruitBanner));
const ClosingCTA = dynamic(() => import("@/components/sections/ClosingCTA").then((mod) => mod.ClosingCTA));
const MobileStickyBar = dynamic(() => import("@/components/sections/MobileStickyBar").then((mod) => mod.MobileStickyBar));

export default function HomePage() {
  return (
    <>
      <Header />
      <main id="contenu">
        <Hero />
        <Steps />
        <Statement />
        <PackagesPreview />
        <SignatureWall />
        <StudioFeature />
        <RecruitBanner />
        <ClosingCTA />
      </main>
      <Footer />
      <MobileStickyBar />
    </>
  );
}
