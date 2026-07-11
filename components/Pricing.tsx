"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, ShieldCheck, Flame } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { BuyButton } from "@/components/BuyButton";
import { bundles, site, stockRemaining } from "@/config/site";
import clsx from "clsx";

export function Pricing() {
  const [selected, setSelected] = useState(
    bundles.find((b) => b.popular)?.id ?? bundles[0].id
  );

  return (
    <section id="pricing" className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="font-serif text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
            Choisis ton rituel
          </h2>
          <p className="mt-3 text-stone-600">
            Un seul applicateur suffit. Le pack Duo et le Rituel complet sont
            faits pour partager ou prendre de l&apos;avance.
          </p>
        </Reveal>

        <Reveal
          delay={0.1}
          className="mt-10 grid gap-4 sm:grid-cols-3"
        >
          <div className="contents" role="radiogroup" aria-label="Choix du pack">
            {bundles.map((bundle) => {
              const isSelected = selected === bundle.id;
              return (
                <button
                  key={bundle.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => setSelected(bundle.id)}
                  className={clsx(
                    "relative flex flex-col rounded-2xl border-2 p-5 text-left transition-colors",
                    isSelected
                      ? "border-rose-600 bg-rose-50/60"
                      : "border-stone-200 bg-white hover:border-stone-300"
                  )}
                >
                  {isSelected ? (
                    <motion.div
                      layoutId="pricing-highlight"
                      className="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-rose-600"
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  ) : null}

                  {bundle.badge ? (
                    <span
                      className={clsx(
                        "absolute -top-3 left-4 rounded-full px-3 py-1 text-xs font-semibold",
                        bundle.popular
                          ? "bg-rose-600 text-white"
                          : "bg-stone-900 text-white"
                      )}
                    >
                      {bundle.badge}
                    </span>
                  ) : null}

                  <span className="mt-2 text-sm font-medium text-stone-500">
                    {bundle.label}
                  </span>
                  <span className="mt-1 text-2xl font-semibold text-stone-900">
                    {bundle.price.toFixed(2).replace(".", ",")}
                    {site.currencySymbol}
                  </span>
                  {bundle.compareAtPrice ? (
                    <span className="text-xs text-stone-400 line-through">
                      {bundle.compareAtPrice.toFixed(2).replace(".", ",")}
                      {site.currencySymbol}
                    </span>
                  ) : null}
                  <span className="mt-3 text-sm text-stone-600">
                    {bundle.description}
                  </span>

                  <span
                    className={clsx(
                      "mt-4 flex size-5 items-center justify-center rounded-full border-2",
                      isSelected
                        ? "border-rose-600 bg-rose-600 text-white"
                        : "border-stone-300"
                    )}
                  >
                    {isSelected ? <Check className="size-3" /> : null}
                  </span>
                </button>
              );
            })}
          </div>
        </Reveal>

        <Reveal delay={0.15} className="mt-10 flex flex-col items-center gap-4">
          <BuyButton
            bundleId={selected}
            label={`Commander — ${bundles
              .find((b) => b.id === selected)
              ?.price.toFixed(2)
              .replace(".", ",")}${site.currencySymbol}`}
          />

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-stone-500">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-emerald-600" />
              Satisfait ou remboursé {site.guaranteeDays} jours
            </span>
            <span className="flex items-center gap-1.5">
              <Flame className="size-4 text-amber-500" />
              Plus que {stockRemaining} en stock
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
