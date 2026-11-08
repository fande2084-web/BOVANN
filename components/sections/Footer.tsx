import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { WHATSAPP_URL } from "@/lib/site";

/** specs/accueil.json → page.sections[footer] */
const LINKS = [
  { label: "Comment ça marche", href: "#comment" },
  { label: "Packages", href: "/packages" },
  { label: "Conditions", href: "/conditions" },
  { label: "Recrutement", href: "/recrutement" },
  { label: "Contact WhatsApp", href: WHATSAPP_URL },
];

const linkClass = "inline-flex min-h-[44px] items-center rounded-sm text-small text-night-text transition-colors duration-fast hover:text-white";

export function Footer() {
  return (
    <footer className="bg-night pb-[calc(96px+env(safe-area-inset-bottom))] pt-16 text-white md:pb-16">
      <div className="container-page">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div>
            <Logo variant="negative" className="h-14" />
            <p className="mt-4 text-small text-night-text">Studio de live commerce · Lomé, Togo</p>
          </div>
          <nav aria-label="Pied de page">
            <ul className="grid grid-cols-2 gap-x-8 md:flex md:gap-x-8">
              {LINKS.map((link) => (
                <li key={link.href}>
                  {link.href.startsWith("http") ? (
                    <a href={link.href} target="_blank" rel="noopener noreferrer" className={linkClass}>
                      {link.label}
                    </a>
                  ) : link.href.startsWith("#") ? (
                    <a href={link.href} className={linkClass}>
                      {link.label}
                    </a>
                  ) : (
                    <Link href={link.href} className={linkClass}>
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <p className="mt-12 border-t border-white/10 pt-6 text-small text-night-text">© 2026 OCD Live. Tous droits réservés.</p>
      </div>
    </footer>
  );
}
