import { fileURLToPath } from "node:url";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Un autre package-lock.json existe dans le dossier parent : on fixe la racine du projet
  outputFileTracingRoot: fileURLToPath(new URL(".", import.meta.url)),
  poweredByHeader: false,
  eslint: { ignoreDuringBuilds: true },
  images: {
    formats: ["image/avif", "image/webp"],
    // specs/accueil.json → assets.studioPhoto.format : 3 tailles (640, 1200, 2000 px)
    deviceSizes: [640, 1200, 2000],
    imageSizes: [96, 192, 384],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
};

export default nextConfig;
