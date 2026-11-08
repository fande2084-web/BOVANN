"use client";

import { m } from "framer-motion";
import { useEffect, useState } from "react";
import { AnimatedPrice } from "@/components/ui/AnimatedPrice";
import { Button } from "@/components/ui/Button";
import { fadeUp, staggerChildren, useReduced, viewportOnce } from "@/lib/motion";
import { isSupabaseConfigured, rowToItem, supabaseConfig, type PackageItem, type PackageRow } from "@/lib/packages";

export function PackagesCarousel({ initialItems }: { initialItems: PackageItem[] }) {
  const reduced = useReduced();
  const items = useLivePackages(initialItems);

  return (
    <section id="packages" aria-labelledby="packages-title" className="py-16 lg:py-32">
      <m.div
        className="container-page"
        initial="hidden"
        whileInView="show"
        viewport={viewportOnce}
        variants={staggerChildren({ reduced })}
      >
        <m.h2 id="packages-title" variants={fadeUp({ reduced })} className="max-w-2xl font-display text-h2 text-ink md:text-h2-lg">
          Plus tu restes, moins l&apos;heure te coûte.
        </m.h2>
        <m.p variants={fadeUp({ reduced })} className="mt-3 text-lead text-ink-muted lg:mt-4 lg:text-lead-lg">
          6 packages, du live unique au mois complet.
        </m.p>
      </m.div>

      <m.ul
        className={
          "no-scrollbar mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-5 px-5 pb-2 " +
          "md:mx-auto md:grid md:max-w-page md:grid-cols-3 md:gap-6 md:overflow-visible md:px-8 lg:mt-12 lg:px-12"
        }
        aria-label="Aperçu des packages"
        initial="hidden"
        whileInView="show"
        viewport={viewportOnce}
        variants={staggerChildren({ reduced })}
      >
        {items.map((item) => (
          <m.li key={item.name} variants={fadeUp({ reduced })} className="w-[85%] shrink-0 snap-start md:w-auto">
            <PackageCard item={item} />
          </m.li>
        ))}
      </m.ul>

      <div className="container-page mt-8 lg:mt-12">
        <Button href="/packages" variant="secondary" location="packages">
          Voir les 6 packages
        </Button>
      </div>
    </section>
  );
}

function PackageCard({ item }: { item: PackageItem }) {
  const dark = item.highlight === true;
  return (
    <article
      className={
        "flex h-full flex-col rounded-xl p-6 md:p-8 " +
        (dark ? "bg-night text-white" : "border border-line bg-surface text-ink shadow-card")
      }
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-display text-h3 md:text-h3-lg">{item.name}</h3>
        {item.badge && (
          <span className="rounded-pill bg-white px-3 py-1 text-label uppercase text-ink">{item.badge}</span>
        )}
      </div>
      <p className={`mt-2 text-body ${dark ? "text-night-text" : "text-ink-muted"}`}>{item.detail}</p>
      <p className="mt-auto flex items-baseline gap-2 pt-8">
        <AnimatedPrice
          value={item.price}
          className={`font-display text-[40px] font-black leading-[44px] tracking-[-0.02em] ${dark ? "text-orange" : "text-ink"}`}
        />
        <span className={`text-small font-semibold ${dark ? "text-night-text" : "text-ink-muted"}`}>{item.currency}</span>
      </p>
      {item.note && <p className={`mt-1 text-small ${dark ? "text-night-text" : "text-ink-muted"}`}>{item.note}</p>}
    </article>
  );
}

/**
 * Prix modifiés dans l'admin : abonnement Supabase Realtime, chargé à la demande
 * (le SDK n'alourdit pas le JS initial et n'est jamais chargé si Supabase n'est pas configuré).
 */
function useLivePackages(initial: PackageItem[]): PackageItem[] {
  const [items, setItems] = useState(initial);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cleanup: (() => void) | undefined;
    let cancelled = false;

    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 2000));
    idle(async () => {
      const { createClient } = await import("@supabase/supabase-js");
      if (cancelled) return;
      const client = createClient(supabaseConfig.url, supabaseConfig.anonKey);
      const refresh = async () => {
        const { data } = await client
          .from("packages")
          .select("*")
          .eq("show_on_home", true)
          .order("position", { ascending: true })
          .limit(3);
        if (data && data.length > 0) setItems((data as PackageRow[]).map(rowToItem));
      };
      const channel = client
        .channel("packages-home")
        .on("postgres_changes", { event: "*", schema: "public", table: "packages" }, () => void refresh())
        .subscribe();
      cleanup = () => void client.removeChannel(channel);
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  return items;
}
