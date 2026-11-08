import type { Config } from "tailwindcss";

/**
 * Tokens : specs/accueil.json → designTokens (+ specs/directives-design.json → palette.studio).
 * Les couleurs pointent vers les variables CSS de app/globals.css.
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    screens: { sm: "640px", md: "768px", lg: "1024px", xl: "1280px" },
    extend: {
      colors: {
        orange: { DEFAULT: "var(--orange)", deep: "var(--orange-deep)", soft: "var(--orange-soft)", hover: "var(--orange-hover)" },
        ink: { DEFAULT: "var(--ink)", muted: "var(--ink-muted)" },
        surface: { DEFAULT: "var(--surface)", alt: "var(--surface-alt)" },
        line: "var(--line)",
        night: { DEFAULT: "var(--night)", text: "var(--night-text)", dim: "var(--night-dim)" },
        live: "var(--live-red)",
        studio: "var(--studio-light)",
        wall: "var(--wall)",
        floor: "var(--floor)",
      },
      fontFamily: {
        display: ["var(--font-archivo)", "system-ui", "sans-serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      fontSize: {
        display: ["40px", { lineHeight: "42px", letterSpacing: "-0.02em", fontWeight: "900" }],
        "display-lg": ["72px", { lineHeight: "72px", letterSpacing: "-0.02em", fontWeight: "900" }],
        h1: ["32px", { lineHeight: "36px", letterSpacing: "-0.02em", fontWeight: "800" }],
        "h1-lg": ["48px", { lineHeight: "52px", letterSpacing: "-0.02em", fontWeight: "800" }],
        h2: ["26px", { lineHeight: "30px", letterSpacing: "-0.02em", fontWeight: "800" }],
        "h2-lg": ["36px", { lineHeight: "40px", letterSpacing: "-0.02em", fontWeight: "800" }],
        h3: ["19px", { lineHeight: "24px", letterSpacing: "-0.02em", fontWeight: "700" }],
        "h3-lg": ["22px", { lineHeight: "28px", letterSpacing: "-0.02em", fontWeight: "700" }],
        lead: ["17px", { lineHeight: "26px", fontWeight: "400" }],
        "lead-lg": ["20px", { lineHeight: "30px", fontWeight: "400" }],
        body: ["16px", { lineHeight: "24px" }],
        small: ["14px", { lineHeight: "20px" }],
        label: ["12px", { lineHeight: "16px", letterSpacing: "0.08em", fontWeight: "700" }],
      },
      borderRadius: { sm: "6px", md: "12px", lg: "20px", xl: "28px", pill: "9999px" },
      boxShadow: {
        none: "none",
        card: "var(--shadow-card)",
        "card-hover": "var(--shadow-card-hover)",
        "card-glow": "var(--shadow-card-glow)",
        header: "var(--shadow-header)",
      },
      maxWidth: { page: "1200px", hero: "960px", lead: "560px" },
      spacing: { "section": "64px", "section-lg": "128px" },
      transitionTimingFunction: {
        standard: "cubic-bezier(0.2, 0, 0, 1)",
        decelerate: "cubic-bezier(0.05, 0.7, 0.1, 1)",
        accelerate: "cubic-bezier(0.3, 0, 0.8, 0.15)",
      },
      transitionDuration: { instant: "100ms", fast: "180ms", base: "280ms", slow: "450ms", hero: "700ms" },
    },
  },
  plugins: [],
};

export default config;
