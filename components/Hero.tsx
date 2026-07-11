"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import Image from "next/image";
import { Star, Truck } from "lucide-react";
import { site } from "@/config/site";
import { BuyButton } from "@/components/BuyButton";

const [taglineLead, taglineAccent] = site.tagline.split(". ");

export function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, 60]);

  return (
    <section ref={ref} className="bg-grain relative overflow-hidden bg-cream-100">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 top-0 h-[36rem] w-[36rem] rounded-full bg-rust-100/70 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 bottom-0 h-72 w-72 rounded-full bg-gold-400/20 blur-3xl"
      />

      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-12 sm:px-6 sm:pb-24 sm:pt-20 lg:grid-cols-2 lg:gap-16 lg:pb-32 lg:pt-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="order-2 flex flex-col items-center text-center lg:order-1 lg:items-start lg:text-left"
        >
          <span className="mb-5 text-xs font-semibold uppercase tracking-[0.28em] text-rust-600">
            Rituel capillaire 2-en-1
          </span>

          <h1 className="font-serif text-[2.75rem] font-medium leading-[0.98] tracking-tight text-ink-900 sm:text-6xl lg:text-[4.5rem]">
            {taglineLead}
            {taglineAccent ? "." : ""}
            {taglineAccent ? (
              <>
                <br />
                <span className="italic text-rust-600">{taglineAccent}</span>
              </>
            ) : null}
          </h1>

          <p className="mt-6 max-w-md text-base leading-relaxed text-ink-600 sm:text-lg">
            {site.subtitle}
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
            {site.freeShipping ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-ink-900/10 bg-cream-50 px-3 py-1 text-xs font-medium text-ink-700">
                <Truck className="size-3.5 text-rust-600" />
                Livraison offerte
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1.5 rounded-full border border-ink-900/10 bg-cream-50 px-3 py-1 text-xs font-medium text-ink-700">
              <span className="flex items-center gap-0.5 text-gold-500">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="size-3 fill-current" />
                ))}
              </span>
              {site.rating.value}/5 · {site.rating.count.toLocaleString("fr-FR")} clientes
            </span>
          </div>

          <div className="mt-9">
            <BuyButton label="Je commande mon RootRitual" />
          </div>
          <p className="mt-3 text-xs text-ink-500">
            Satisfait ou remboursé pendant {site.guaranteeDays} jours
          </p>
        </motion.div>

        <motion.div
          style={{ y }}
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          className="order-1 flex justify-center lg:order-2"
        >
          <div className="relative w-64 overflow-hidden rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(36,26,18,0.35)] ring-1 ring-ink-900/5 sm:w-80 lg:w-96">
            <Image
              src="/images/product-hero.jpg"
              alt="Applicateur d'huile RootRitual avec picots à billes et LED rouge"
              width={1206}
              height={1180}
              priority
              className="w-full"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
