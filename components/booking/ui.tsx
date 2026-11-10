/**
 * Briques du parcours de réservation. Mêmes classes que components/ui/Button.tsx
 * (tokens de la charte, aucune nouvelle couleur, police ou rayon) ; Button ne gère
 * que des liens, d'où ces variantes <button> pour le formulaire.
 */
import type { ButtonHTMLAttributes, ReactNode } from "react";

const base =
  "group relative inline-flex select-none items-center justify-center gap-2 rounded-md font-sans text-[16px] font-semibold leading-none " +
  "transition-colors duration-fast ease-standard focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-deep " +
  "disabled:cursor-not-allowed";

const variants = {
  primary:
    "bg-orange text-ink hover:bg-orange-hover active:bg-orange-deep active:text-white disabled:bg-line disabled:text-ink-muted disabled:hover:bg-line",
  secondary: "border-[1.5px] border-ink bg-transparent text-ink hover:bg-surface-alt disabled:border-line disabled:text-ink-muted",
  ghost: "bg-transparent px-0 text-ink hover:underline disabled:text-ink-muted",
} as const;

type ActionProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  fullWidth?: boolean;
};

export function ActionButton({ variant = "primary", fullWidth = false, className = "", type = "button", ...rest }: ActionProps) {
  return (
    <button
      type={type}
      className={`${base} h-12 px-6 ${variants[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...rest}
    />
  );
}

export const inputClass =
  "h-12 w-full rounded-md border border-line bg-surface px-4 text-body text-ink placeholder:text-ink-muted/70 " +
  "transition-colors duration-fast ease-standard hover:border-ink-muted focus:border-ink focus:outline-none " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-deep";

export function Field({
  id,
  label,
  help,
  optional,
  children,
}: {
  id: string;
  label: string;
  help?: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="flex items-baseline justify-between gap-3 text-small font-semibold text-ink">
        {label}
        {optional && <span className="text-small font-normal text-ink-muted">Facultatif</span>}
      </label>
      <div className="mt-2">{children}</div>
      {help && (
        <p id={`${id}-help`} className="mt-1.5 text-small text-ink-muted">
          {help}
        </p>
      )}
    </div>
  );
}

export function StepHeading({ id, title, subtitle }: { id: string; title: string; subtitle?: string }) {
  return (
    <header>
      <h1 id={id} tabIndex={-1} className="font-display text-h2 text-ink outline-none md:text-h2-lg">
        {title}
      </h1>
      {subtitle && <p className="mt-2 text-body text-ink-muted md:text-lead">{subtitle}</p>}
    </header>
  );
}

/** Carte sélectionnable (radio) : bordure orange 2 px + coche quand elle est choisie, comme ChoiceCard */
export function choiceCardClass(selected: boolean): string {
  return (
    "relative block w-full cursor-pointer rounded-lg border bg-surface p-4 text-left shadow-card transition-[box-shadow,border-color] duration-fast ease-standard " +
    "hover:border-orange hover:shadow-card-glow has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-orange-deep md:p-5 " +
    (selected ? "border-orange ring-1 ring-orange" : "border-line")
  );
}
