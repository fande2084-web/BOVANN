import type { Metadata, Viewport } from "next";
import { Archivo, Inter } from "next/font/google";
import type { ReactNode } from "react";
import { MotionProvider } from "@/components/ui/MotionProvider";
import { SEO, SITE_URL } from "@/lib/site";
import "./globals.css";

// Polices variables auto-hébergées (sous-ensemble latin, swap)
const archivo = Archivo({ subsets: ["latin"], display: "swap", variable: "--font-archivo" });
const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SEO.title,
  description: SEO.description,
  alternates: { canonical: SEO.canonical },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: SEO.canonical,
    siteName: "OCD Live",
    title: SEO.title,
    description: SEO.description,
    images: [{ url: SEO.ogImage, width: 1200, height: 630, alt: "OCD Live, studio de live commerce à Lomé" }],
  },
  twitter: { card: "summary_large_image", title: SEO.title, description: SEO.description, images: [SEO.ogImage] },
  icons: { icon: "/brand/ocd-monogram.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#FFFFFF",
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "OCD Live",
  description: SEO.description,
  url: SEO.canonical,
  image: `${SITE_URL}${SEO.ogImage}`,
  address: { "@type": "PostalAddress", addressLocality: "Lomé", addressCountry: "TG" },
  areaServed: "Afrique",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={`${archivo.variable} ${inter.variable}`}>
      <body>
        <a
          href="#contenu"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-ink focus:px-4 focus:py-3 focus:text-white"
        >
          Aller au contenu
        </a>
        <MotionProvider>{children}</MotionProvider>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      </body>
    </html>
  );
}
