"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import Image from "next/image";
import { Star, Truck } from "lucide-react";
import { site } from "@/config/site";
import { BuyButton } from "@/components/BuyButton";

export function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, 60]);

  return (
    <section
      ref={ref}
      className="relative overflow-hidden bg-gradient-to-b from-rose-50 via-orange-50 to-white"
    >
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-10 sm:px-6 sm:pb-24 sm:pt-16 lg:grid-cols-2 lg:gap-12 lg:pb-28 lg:pt-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="order-2 flex flex-col items-center text-center lg:order-1 lg:items-start lg:text-left"
        >
          {site.freeShipping ? (
            <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
              <Truck className="size-3.5" />
              Livraison offerte
            </span>
          ) : null}

          <h1 className="font-serif text-4xl font-semibold leading-[1.08] tracking-tight text-stone-900 sm:text-5xl lg:text-6xl">
            {site.tagline}
          </h1>

          <p className="mt-5 max-w-md text-base text-stone-600 sm:text-lg">
            {site.subtitle}
          </p>

          <div className="mt-8 flex items-center gap-1.5">
            <div className="flex items-center gap-0.5 text-amber-500">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="size-4 fill-current" />
              ))}
            </div>
            <span className="text-sm font-medium text-stone-700">
              {site.rating.value}/5
            </span>
            <span className="text-sm text-stone-500">
              · {site.rating.count.toLocaleString("fr-FR")} clientes
            </span>
          </div>

          <div className="mt-8">
            <BuyButton label="Je commande mon RootRitual" />
          </div>
          <p className="mt-3 text-xs text-stone-500">
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
          <div className="relative w-64 overflow-hidden rounded-[2.5rem] shadow-2xl sm:w-80 lg:w-96">
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
