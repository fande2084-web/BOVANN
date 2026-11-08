"use client";

import Link from "next/link";
import { m } from "framer-motion";
import { ArrowRight, MessageCircle } from "lucide-react";
import type { MouseEvent, ReactNode } from "react";
import { duration, easing, spring } from "@/lib/motion";
import { track } from "@/lib/analytics";

/** specs/accueil.json → components.Button */
export type ButtonVariant = "primary" | "secondary" | "ghost" | "dark";
export type ButtonSize = "sm" | "md" | "lg";

type Props = {
  href: string;
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: "arrow-right" | "message-circle";
  fullWidth?: boolean;
  /** Emplacement pour l'événement analytics cta_click / whatsapp_click */
  location: string;
  className?: string;
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
};

const base =
  "group relative inline-flex select-none items-center justify-center gap-2 rounded-md font-sans text-[16px] font-semibold leading-none " +
  "transition-colors duration-fast ease-standard focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-deep";

const sizes: Record<ButtonSize, string> = {
  // sm : 36 px visibles, zone tactile portée à 44 px par le pseudo-élément
  sm: "h-9 px-4 before:absolute before:-inset-y-1 before:inset-x-0 before:content-['']",
  md: "h-12 px-6",
  lg: "h-14 px-7",
};

const variants: Record<ButtonVariant, string> = {
  primary: "bg-orange text-ink hover:bg-orange-hover active:bg-orange-deep active:text-white",
  secondary: "border-[1.5px] border-ink bg-transparent text-ink hover:bg-surface-alt",
  ghost: "bg-transparent px-0 text-ink",
  dark: "bg-ink text-white",
};

const MotionLink = m.create(Link);

export function Button({
  href,
  children,
  variant = "primary",
  size = "md",
  icon,
  fullWidth = false,
  location,
  className = "",
  onClick,
}: Props) {
  const isExternal = /^https?:\/\//.test(href);
  const isWhatsApp = href.includes("wa.me/");
  const label = typeof children === "string" ? children : "";

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (isWhatsApp) track("whatsapp_click", { location });
    else track("cta_click", { location, label });
    if (href === "/packages") track("packages_view_all", {});
    onClick?.(e);
  };

  const classes = [base, sizes[size], variants[variant], fullWidth ? "w-full" : "", className].join(" ");

  const content = (
    <>
      {icon === "message-circle" && <MessageCircle aria-hidden size={20} strokeWidth={1.75} />}
      <span className="relative">
        {children}
        {variant === "ghost" && (
          <span
            aria-hidden
            className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-ink transition-transform duration-base ease-standard group-hover:scale-x-100 group-focus-visible:scale-x-100 motion-reduce:transition-none"
          />
        )}
      </span>
      {icon === "arrow-right" && (
        <ArrowRight
          aria-hidden
          size={20}
          strokeWidth={1.75}
          className="transition-transform duration-fast ease-standard group-hover:translate-x-1 motion-reduce:transition-none"
        />
      )}
    </>
  );

  const motionProps = {
    whileHover: { y: -1, transition: { duration: duration.fast, ease: easing.standard } },
    whileTap: { scale: 0.97, transition: spring },
  };

  if (isExternal) {
    return (
      <m.a href={href} target="_blank" rel="noopener noreferrer" className={classes} onClick={handleClick} {...motionProps}>
        {content}
      </m.a>
    );
  }

  // Les ancres (#choix) restent des <a> simples ; les pages passent par next/link
  if (href.startsWith("#")) {
    return (
      <m.a href={href} className={classes} onClick={handleClick} {...motionProps}>
        {content}
      </m.a>
    );
  }

  return (
    <MotionLink href={href} className={classes} onClick={handleClick} {...motionProps}>
      {content}
    </MotionLink>
  );
}
