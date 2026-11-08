"use client";

/**
 * specs/accueil.json → page.sections[hero].content.demo
 * Animation iPhone du hero : 4 scènes en boucle, légende synchronisée, barres façon stories iOS.
 * Reprise à l'identique de la maquette fournie (ocd-live-hero-anime.html) ; seule adaptation :
 * `m` au lieu de `motion` (LazyMotion strict) et polices via les variables next/font.
 */
import {
  AnimatePresence,
  m,
  useAnimationFrame,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type Transition,
} from "framer-motion";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { DEMO_SCENE_DURATION as SCENE_DURATION, DEMO_STEPS as STEPS } from "@/lib/demo-steps";

const A = {
  orange: "#E36802",
  orangeDeep: "#A84B00",
  orangeSoft: "#FDEBDB",
  ink: "#000000",
  muted: "#5C5752",
  surface: "#FFFFFF",
  alt: "#F6F4F1",
  line: "#E6E2DD",
  night: "#0F0F0F",
  red: "#C0261E",
  light: "#FFD89A",
};

const DISPLAY = "var(--font-archivo), 'Arial Black', system-ui, sans-serif";
const TEXT = "var(--font-inter), system-ui, -apple-system, 'Segoe UI', sans-serif";

type Bezier = [number, number, number, number];
const standard: Bezier = [0.2, 0, 0, 1];
const decelerate: Bezier = [0.05, 0.7, 0.1, 1];
const spring: Transition = { type: "spring", stiffness: 380, damping: 32 };
const springSoft: Transition = { type: "spring", stiffness: 220, damping: 28 };

/** Transition « fadeUp » par défaut, instantanée si mouvement réduit */
const tr = (r: boolean, delay: number, base: Transition = { duration: 0.45, ease: decelerate }): Transition =>
  r ? { duration: 0 } : { ...base, delay };

type Props = {
  studioSrc?: string;
  logoSrc?: string;
  /** Scène affichée (mode contrôlé, pour synchroniser un texte extérieur) */
  scene?: number;
  /** Appelé à chaque changement de scène (lecture automatique ou clic) */
  onSceneChange?: (scene: number) => void;
  /** Classes de la légende sous l'iPhone (ex. « lg:hidden » quand le texte est affiché ailleurs) */
  captionClassName?: string;
};

export function HeroDemo({
  studioSrc = "/images/studio-lome.jpg",
  logoSrc = "/brand/ocd-live-logo.svg",
  scene: controlledScene,
  onSceneChange,
  captionClassName,
}: Props) {
  const r = !!useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.35 });
  const [innerScene, setInnerScene] = useState(0);
  const scene = controlledScene ?? innerScene;
  const sceneRef = useRef(scene);
  sceneRef.current = scene;
  const setScene = (next: number) => {
    if (controlledScene === undefined) setInnerScene(next);
    onSceneChange?.(next);
  };
  const [playing, setPlaying] = useState(true);
  const progress = useMotionValue(0);
  const width = useTransform(progress, (v) => `${v * 100}%`);

  // Pas de lecture automatique en mouvement réduit
  useEffect(() => {
    if (r) setPlaying(false);
  }, [r]);

  useAnimationFrame((_, delta) => {
    if (!playing || !inView) return;
    const next = progress.get() + delta / SCENE_DURATION;
    if (next >= 1) {
      progress.set(0);
      setScene((sceneRef.current + 1) % STEPS.length);
    } else progress.set(next);
  });

  const goTo = (i: number) => {
    progress.set(0);
    setScene(i);
  };

  const step = STEPS[scene] ?? STEPS[0];

  return (
    <div ref={ref} style={{ width: 320, maxWidth: "100%", margin: "0 auto", fontFamily: TEXT, color: A.ink }}>
      <div style={{ position: "relative" }}>
        <m.div
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={tr(r, 0.2, { duration: 1.2, ease: standard })}
          style={{ position: "absolute", inset: "-12% -30%", zIndex: 0, pointerEvents: "none" }}
        >
          {/* Halo chaud du studio + respiration (specs/directives-design.json → lighting, motion) */}
          <div className="studio-halo halo-breathe" style={{ position: "absolute", inset: 0 }} />
        </m.div>
        <m.div
          initial={r ? false : { opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={r ? { duration: 0 } : { ...springSoft, delay: 0.35 }}
          style={{ position: "relative", zIndex: 1 }}
        >
          <Phone>
            <AnimatePresence mode="popLayout" initial={false}>
              <m.div
                key={scene}
                initial={r ? { opacity: 0 } : { opacity: 0, scale: 1.03, filter: "blur(6px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={r ? { opacity: 0 } : { opacity: 0, scale: 0.97, filter: "blur(6px)" }}
                transition={{ duration: r ? 0.15 : 0.55, ease: standard }}
                style={{ position: "absolute", inset: 0 }}
              >
                {scene === 0 && <SceneChoose r={r} logo={logoSrc} />}
                {scene === 1 && <SceneBook r={r} logo={logoSrc} />}
                {scene === 2 && <SceneConfirm r={r} />}
                {scene === 3 && <SceneLive r={r} src={studioSrc} />}
              </m.div>
            </AnimatePresence>
          </Phone>
        </m.div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 28 }}>
        <div role="tablist" aria-label="Étapes" style={{ display: "flex", gap: 6, flex: 1 }}>
          {STEPS.map((d, g) => (
            <button
              key={d.n}
              type="button"
              role="tab"
              aria-selected={g === scene}
              aria-label={`Étape ${d.n} : ${d.title}`}
              onClick={() => goTo(g)}
              style={{
                flex: 1,
                height: 20,
                padding: 0,
                border: 0,
                background: "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  position: "relative",
                  display: "block",
                  width: "100%",
                  height: 3,
                  borderRadius: 3,
                  background: A.line,
                  overflow: "hidden",
                }}
              >
                <m.span
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: 3,
                    background: A.ink,
                    width: g < scene ? "100%" : g === scene ? (playing ? width : "100%") : "0%",
                  }}
                />
              </span>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? "Mettre en pause" : "Lire"}
          style={{
            width: 32,
            height: 32,
            borderRadius: 999,
            border: `1px solid ${A.line}`,
            background: A.surface,
            display: "grid",
            placeItems: "center",
            cursor: "pointer",
          }}
        >
          {playing ? (
            <svg width="10" height="12" viewBox="0 0 10 12" aria-hidden>
              <rect width="3" height="12" rx="1" fill={A.ink} />
              <rect x="7" width="3" height="12" rx="1" fill={A.ink} />
            </svg>
          ) : (
            <svg width="10" height="12" viewBox="0 0 10 12" aria-hidden>
              <path d="M0 0L10 6L0 12z" fill={A.ink} />
            </svg>
          )}
        </button>
      </div>

      <div aria-live="polite" className={captionClassName} style={{ position: "relative", height: 64, marginTop: 14 }}>
        <AnimatePresence mode="wait" initial={false}>
          <m.div
            key={scene}
            initial={r ? { opacity: 0 } : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={r ? { opacity: 0 } : { opacity: 0, y: -6 }}
            transition={{ duration: r ? 0.15 : 0.35, ease: standard }}
          >
            <div style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
              <span style={{ fontFamily: DISPLAY, fontWeight: 900, color: A.orangeDeep, fontSize: 15 }}>{step.n}</span>
              <span style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 19, letterSpacing: "-0.02em" }}>
                {step.title}
              </span>
            </div>
            <p style={{ margin: "4px 0 0 30px", fontSize: 14, lineHeight: "20px", color: A.muted }}>{step.text}</p>
          </m.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Châssis iPhone                                                      */
/* ------------------------------------------------------------------ */

function Phone({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        position: "relative",
        width: 300,
        height: 620,
        margin: "0 auto",
        borderRadius: 54,
        padding: 10,
        background: "linear-gradient(145deg, #2A2826, #0F0F0F 40%)",
        boxShadow:
          "0 0 0 1.5px #3A3633 inset, 0 2px 4px rgba(0,0,0,.08), 0 30px 60px -12px rgba(0,0,0,.35), 0 60px 120px -40px rgba(227,104,2,.25)",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          borderRadius: 44,
          overflow: "hidden",
          background: A.surface,
          isolation: "isolate",
        }}
      >
        {children}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 44,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 26px",
            zIndex: 20,
            pointerEvents: "none",
            fontSize: 13,
            fontWeight: 600,
            mixBlendMode: "difference",
            color: "#fff",
          }}
        >
          <span>9:41</span>
          <span style={{ display: "flex", gap: 5, alignItems: "center" }}>
            <svg width="16" height="10" viewBox="0 0 16 10">
              <rect y="6" width="3" height="4" rx="1" fill="#fff" />
              <rect x="4.3" y="4" width="3" height="6" rx="1" fill="#fff" />
              <rect x="8.6" y="2" width="3" height="8" rx="1" fill="#fff" />
              <rect x="13" width="3" height="10" rx="1" fill="#fff" />
            </svg>
            <svg width="24" height="11" viewBox="0 0 24 11">
              <rect x=".5" y=".5" width="20" height="10" rx="3" fill="none" stroke="#fff" opacity=".5" />
              <rect x="2" y="2" width="15" height="7" rx="1.6" fill="#fff" />
              <rect x="21.5" y="3.5" width="1.5" height="4" rx=".7" fill="#fff" opacity=".5" />
            </svg>
          </span>
        </div>
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: 10,
            left: "50%",
            transform: "translateX(-50%)",
            width: 92,
            height: 27,
            borderRadius: 20,
            background: "#000",
            zIndex: 21,
          }}
        />
        <div
          aria-hidden
          style={{
            position: "absolute",
            bottom: 8,
            left: "50%",
            transform: "translateX(-50%)",
            width: 110,
            height: 4,
            borderRadius: 4,
            background: "rgba(0,0,0,.85)",
            zIndex: 21,
            mixBlendMode: "difference",
            filter: "invert(1)",
          }}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Briques communes                                                    */
/* ------------------------------------------------------------------ */

const screen: CSSProperties = {
  position: "absolute",
  inset: 0,
  padding: "58px 18px 24px",
  display: "flex",
  flexDirection: "column",
};

const heading = (size: number): CSSProperties => ({
  fontFamily: DISPLAY,
  fontWeight: 800,
  fontSize: size,
  letterSpacing: "-0.02em",
  lineHeight: 1.1,
  margin: 0,
});

function ScreenLogo({ src }: { src: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- SVG statique dans la maquette
    <img src={src} alt="OCD Live" style={{ height: 22, width: "auto", display: "block", alignSelf: "flex-start" }} />
  );
}

/** Cercle de « tap » simulé */
function Tap({ x, y, delay, r }: { x: number | string; y: number | string; delay: number; r: boolean }) {
  if (r) return null;
  return (
    <m.span
      aria-hidden
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: [0, 0.9, 0.9, 0], scale: [0.6, 1, 0.82, 1.5] }}
      transition={{ delay, duration: 0.8, times: [0, 0.3, 0.5, 1], ease: standard }}
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: 34,
        height: 34,
        marginLeft: -17,
        marginTop: -17,
        borderRadius: 999,
        background: "rgba(0,0,0,.18)",
        border: "1.5px solid rgba(255,255,255,.9)",
        zIndex: 10,
        pointerEvents: "none",
      }}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Scène 01 : choix                                                    */
/* ------------------------------------------------------------------ */

function SceneChoose({ r, logo }: { r: boolean; logo: string }) {
  const card: CSSProperties = {
    position: "relative",
    borderRadius: 18,
    padding: "14px 14px 16px",
    background: A.surface,
    border: `1.5px solid ${A.line}`,
    boxShadow: "0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.06)",
  };
  const eyebrow: CSSProperties = { fontSize: 10, fontWeight: 700, letterSpacing: ".08em", color: A.muted };

  return (
    <div style={screen}>
      <ScreenLogo src={logo} />
      <m.h3
        initial={r ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={tr(r, 0.15)}
        style={{ ...heading(22), marginTop: 22 }}
      >
        Comment veux-tu faire ton live ?
      </m.h3>
      <div style={{ display: "grid", gap: 12, marginTop: 20, position: "relative" }}>
        <m.div
          initial={r ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0, borderColor: A.orange, scale: [1, 1, 0.98, 1.02] }}
          transition={
            r
              ? { duration: 0 }
              : {
                  opacity: { delay: 0.3, duration: 0.45, ease: decelerate },
                  y: { delay: 0.3, ...springSoft },
                  borderColor: { delay: 1.75, duration: 0.2 },
                  scale: { delay: 1.45, duration: 0.6, times: [0, 0.4, 0.6, 1], ease: standard },
                }
          }
          style={card}
        >
          <div style={eyebrow}>AU STUDIO</div>
          <div style={{ ...heading(17), marginTop: 4 }}>Live en présentiel</div>
          <div style={{ fontSize: 12, color: A.muted, marginTop: 4 }}>Studio de Lomé, régie incluse.</div>
          <m.span
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={r ? { duration: 0 } : { ...spring, delay: 1.85 }}
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              width: 22,
              height: 22,
              borderRadius: 999,
              background: A.orange,
              display: "grid",
              placeItems: "center",
            }}
          >
            <svg width="11" height="9" viewBox="0 0 11 9" aria-hidden>
              <path d="M1 4.5L4 7.5L10 1" stroke="#000" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </m.span>
        </m.div>
        <m.div
          initial={r ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: [0, 1, 1, 0.35], y: 0 }}
          transition={
            r
              ? { duration: 0 }
              : { opacity: { delay: 0.38, duration: 1.8, times: [0, 0.2, 0.8, 1] }, y: { delay: 0.38, ...springSoft } }
          }
          style={card}
        >
          <div style={eyebrow}>DEPUIS CHEZ TOI</div>
          <div style={{ ...heading(17), marginTop: 4 }}>Live à distance</div>
          <div style={{ fontSize: 12, color: A.muted, marginTop: 4 }}>Partout en Afrique, avec une animatrice.</div>
        </m.div>
        <Tap x="62%" y={48} delay={1.4} r={r} />
      </div>
      <m.div
        initial={r ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={tr(r, 0.6)}
        style={{ marginTop: "auto", fontSize: 11, color: A.muted, textAlign: "center" }}
      >
        À partir de 15 000 FCFA · Mobile Money
      </m.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Scène 02 : calendrier + créneau                                     */
/* ------------------------------------------------------------------ */

function SceneBook({ r, logo }: { r: boolean; logo: string }) {
  const days: (number | null)[] = [null, ...Array.from({ length: 31 }, (_, i) => i + 1)];
  const slots = ["09:00 – 10:30", "10:00 – 11:30", "14:00 – 15:30"];

  return (
    <div style={screen}>
      <ScreenLogo src={logo} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 18 }}>
        <h3 style={heading(20)}>Décembre 2026</h3>
        <span style={{ fontSize: 11, color: A.muted }}>Présentiel</span>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 2,
          marginTop: 12,
          fontSize: 11,
          textAlign: "center",
        }}
      >
        {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
          <span key={i} style={{ color: A.muted, fontWeight: 600, paddingBottom: 4 }}>
            {d}
          </span>
        ))}
        {days.map((d, i) => (
          <m.span
            key={i}
            initial={r ? false : { opacity: 0 }}
            animate={d === 1 ? { opacity: 1, backgroundColor: A.orange, color: "#000" } : { opacity: 1 }}
            transition={
              r
                ? { duration: 0 }
                : d === 1
                  ? { opacity: { delay: 0.1 + i * 0.01 }, backgroundColor: { delay: 0.75, duration: 0.2 }, color: { delay: 0.75 } }
                  : { delay: 0.1 + i * 0.01, duration: 0.3 }
            }
            style={{
              width: 28,
              height: 28,
              margin: "0 auto",
              display: "grid",
              placeItems: "center",
              borderRadius: 999,
              fontWeight: d === 1 ? 700 : 500,
              color: A.ink,
            }}
          >
            {d ?? ""}
          </m.span>
        ))}
      </div>
      <Tap x={50} y={133} delay={0.55} r={r} />
      <div style={{ marginTop: 12, display: "grid", gap: 7 }}>
        {slots.map((s, i) => (
          <m.div
            key={s}
            initial={r ? false : { opacity: 0, y: 12 }}
            animate={i === 1 ? { opacity: 1, y: 0, borderColor: A.ink, backgroundColor: A.orangeSoft } : { opacity: 1, y: 0 }}
            transition={
              r
                ? { duration: 0 }
                : i === 1
                  ? {
                      opacity: { delay: 1.05 + i * 0.07 },
                      y: { delay: 1.05 + i * 0.07, ...springSoft },
                      borderColor: { delay: 1.8 },
                      backgroundColor: { delay: 1.8, duration: 0.25 },
                    }
                  : { delay: 1.05 + i * 0.07, ...springSoft }
            }
            style={{
              border: `1.5px solid ${A.line}`,
              borderRadius: 12,
              padding: "8px 12px",
              fontSize: 13,
              fontWeight: 600,
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>{s}</span>
            <span style={{ fontWeight: 400, color: A.muted, fontSize: 11 }}>1 h 30</span>
          </m.div>
        ))}
      </div>
      <Tap x="45%" y={281} delay={1.6} r={r} />
      <m.div
        initial={r ? false : { y: 120, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={r ? { duration: 0 } : { ...springSoft, delay: 2.2 }}
        style={{
          marginTop: "auto",
          borderRadius: 18,
          background: A.night,
          color: "#fff",
          padding: "12px 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div style={{ fontSize: 11, color: "#BDB7B0" }}>Standard · 1 h 30</div>
          <div style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: 17, color: A.orange }}>15 000 FCFA</div>
        </div>
        <m.span
          animate={r ? {} : { scale: [1, 1, 0.94, 1] }}
          transition={{ delay: 3.1, duration: 0.45, times: [0, 0.3, 0.6, 1] }}
          style={{ background: A.orange, color: "#000", fontWeight: 700, fontSize: 13, borderRadius: 10, padding: "9px 14px" }}
        >
          Réserver
        </m.span>
      </m.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Scène 03 : confirmation + notification WhatsApp                     */
/* ------------------------------------------------------------------ */

function SceneConfirm({ r }: { r: boolean }) {
  const recap: [string, string][] = [
    ["Date", "Mar. 1 déc. · 10:00 – 11:30"],
    ["Lieu", "Studio OCD Live, Lomé"],
    ["Package", "Standard · 15 000 FCFA"],
  ];

  return (
    <div style={{ ...screen, alignItems: "center", textAlign: "center", paddingTop: 168 }}>
      <m.svg
        width="84"
        height="84"
        viewBox="0 0 84 84"
        aria-hidden
        initial={r ? false : { scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={r ? { duration: 0 } : { ...spring, delay: 0.1 }}
      >
        <circle cx="42" cy="42" r="40" fill={A.orangeSoft} />
        <m.circle
          cx="42"
          cy="42"
          r="40"
          fill="none"
          stroke={A.orange}
          strokeWidth="3"
          strokeLinecap="round"
          initial={{ pathLength: r ? 1 : 0 }}
          animate={{ pathLength: 1 }}
          transition={tr(r, 0.2, { duration: 0.7, ease: standard })}
          style={{ rotate: -90, transformOrigin: "50% 50%" }}
        />
        <m.path
          d="M27 43L37 53L58 31"
          fill="none"
          stroke={A.ink}
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: r ? 1 : 0 }}
          animate={{ pathLength: 1 }}
          transition={tr(r, 0.7, { duration: 0.4, ease: standard })}
        />
      </m.svg>
      <m.h3
        initial={r ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={tr(r, 0.85)}
        style={{ ...heading(22), marginTop: 20 }}
      >
        Réservation confirmée
      </m.h3>
      <m.div
        initial={r ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={tr(r, 1)}
        style={{
          marginTop: 18,
          width: "100%",
          borderRadius: 16,
          background: A.alt,
          padding: "12px 14px",
          textAlign: "left",
          fontSize: 12.5,
          display: "grid",
          gap: 7,
        }}
      >
        {recap.map(([k, v]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
            <span style={{ color: A.muted }}>{k}</span>
            <span style={{ fontWeight: 600 }}>{v}</span>
          </div>
        ))}
      </m.div>
      <m.div
        initial={r ? false : { y: -110, opacity: 0, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={r ? { duration: 0 } : { ...spring, delay: 1.7 }}
        style={{
          position: "absolute",
          top: 46,
          left: 10,
          right: 10,
          zIndex: 15,
          borderRadius: 20,
          padding: "10px 12px",
          textAlign: "left",
          background: "rgba(246,244,241,.82)",
          backdropFilter: "saturate(180%) blur(20px)",
          WebkitBackdropFilter: "saturate(180%) blur(20px)",
          boxShadow: "0 10px 30px rgba(0,0,0,.14)",
          display: "flex",
          gap: 10,
          alignItems: "flex-start",
        }}
      >
        <span
          style={{
            width: 34,
            height: 34,
            borderRadius: 9,
            background: "#25D366",
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
            <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2z" fill="#fff" />
          </svg>
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
            <b>OCD Live</b>
            <span style={{ color: A.muted }}>maintenant</span>
          </span>
          <span style={{ display: "block", fontSize: 12, lineHeight: "16px", marginTop: 2 }}>
            Ton live est confirmé ✓ Rendez-vous mardi 1er décembre à 10:00 au studio.
          </span>
        </span>
      </m.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Scène 04 : en direct                                                */
/* ------------------------------------------------------------------ */

function SceneLive({ r, src }: { r: boolean; src: string }) {
  const comments = ["Je prends 2 bols !", "Tu livres à Agoè ?", "Ton numéro stp 🙏", "Je passe ce soir"];
  const hearts = [0, 1, 2, 3, 4, 5, 6];
  const dot: CSSProperties = { position: "absolute", inset: 0, borderRadius: 999, background: "#fff" };

  return (
    <div style={{ position: "absolute", inset: 0, background: A.night, color: "#fff", overflow: "hidden" }}>
      <m.div
        initial={r ? false : { scale: 1.12 }}
        animate={{ scale: 1 }}
        transition={r ? { duration: 0 } : { duration: 4.2, ease: "linear" }}
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url(${src})`,
          backgroundSize: "cover",
          backgroundPosition: "50% 18%",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom, rgba(15,15,15,.45) 0%, rgba(15,15,15,0) 30%, rgba(15,15,15,.15) 55%, rgba(15,15,15,.85) 100%)",
        }}
      />
      <m.div
        initial={r ? false : { opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={tr(r, 0.2)}
        style={{ position: "absolute", top: 54, left: 14, right: 14, display: "flex", alignItems: "center", gap: 8 }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: A.red,
            borderRadius: 999,
            padding: "4px 9px",
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: ".08em",
          }}
        >
          <span style={{ position: "relative", width: 7, height: 7 }}>
            <span style={dot} />
            {!r && (
              <m.span
                animate={{ scale: [1, 2.4], opacity: [0.6, 0] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
                style={dot}
              />
            )}
          </span>
          EN DIRECT
        </span>
        <span style={{ fontSize: 11, fontWeight: 600, textShadow: "0 1px 2px rgba(0,0,0,.4)" }}>House of Challenge</span>
      </m.div>

      {!r &&
        hearts.map((h) => (
          <m.svg
            key={h}
            width="20"
            height="18"
            viewBox="0 0 20 18"
            aria-hidden
            initial={{ opacity: 0, y: 0, x: 0, scale: 0.6 }}
            animate={{
              opacity: [0, 1, 1, 0],
              y: -200 - (h % 3) * 30,
              x: [0, (h % 2 ? 1 : -1) * 12, (h % 2 ? -1 : 1) * 8],
              scale: 1,
            }}
            transition={{ delay: 0.6 + h * 0.42, duration: 2.4, ease: standard, times: [0, 0.15, 0.7, 1] }}
            style={{ position: "absolute", right: 22, bottom: 150 }}
          >
            <path
              d="M10 18L8.6 16.7C3.4 12 0 9 0 5.4 0 2.4 2.4 0 5.4 0 7.1 0 8.8.8 10 2.1 11.2.8 12.9 0 14.6 0 17.6 0 20 2.4 20 5.4 20 9 16.6 12 11.4 16.7z"
              fill={h % 3 === 1 ? "#fff" : A.orange}
            />
          </m.svg>
        ))}

      <div style={{ position: "absolute", left: 14, right: 60, bottom: 150, display: "flex", flexDirection: "column", gap: 6 }}>
        {comments.map((c, i) => (
          <m.div
            key={c}
            initial={r ? false : { opacity: 0, y: 14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={r ? { duration: 0 } : { ...springSoft, delay: 0.7 + i * 0.6 }}
            style={{
              alignSelf: "flex-start",
              fontSize: 12,
              padding: "5px 10px",
              borderRadius: 12,
              background: "rgba(15,15,15,.45)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
            }}
          >
            {c}
          </m.div>
        ))}
      </div>

      <m.div
        initial={r ? false : { y: 140, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={r ? { duration: 0 } : { ...springSoft, delay: 0.35 }}
        style={{
          position: "absolute",
          left: 12,
          right: 12,
          bottom: 22,
          borderRadius: 18,
          background: "rgba(255,255,255,.94)",
          color: A.ink,
          padding: "11px 13px",
          boxShadow: "0 10px 30px rgba(0,0,0,.25)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={heading(15)}>Plats de Awa</span>
          <span style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: 14, color: A.orangeDeep }}>2 500 FCFA</span>
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 6, fontSize: 11.5, color: A.muted }}>
          <span>☎ +228 •• •• •• ••</span>
          <span>📍 Bè, Lomé</span>
        </div>
        <m.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={tr(r, 0.9, { duration: 3, ease: "linear" })}
          style={{ height: 3, borderRadius: 3, background: A.orange, marginTop: 9, transformOrigin: "left" }}
        />
      </m.div>
    </div>
  );
}
