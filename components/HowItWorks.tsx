"use client";

import { motion } from "framer-motion";
import { Reveal } from "@/components/Reveal";

const steps = [
  {
    number: "01",
    title: "Verse ton huile",
    description:
      "Remplis le réservoir jusqu'au repère souhaité grâce à la fenêtre graduée.",
  },
  {
    number: "02",
    title: "Glisse sur ta raie",
    description:
      "Fais glisser les picots à billes le long de ta raie : l'huile se dépose directement à la racine.",
  },
  {
    number: "03",
    title: "Masse 2 minutes",
    description:
      "Continue le mouvement sur l'ensemble du cuir chevelu pour un massage stimulant complet.",
  },
];

export function HowItWorks() {
  return (
    <section className="bg-cream-100 py-16 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="max-w-xl">
          <span className="text-xs font-semibold uppercase tracking-[0.28em] text-rust-600">
            Le rituel
          </span>
          <h2 className="mt-3 font-serif text-3xl font-medium tracking-tight text-ink-900 sm:text-4xl">
            Comment ça marche
          </h2>
          <p className="mt-3 text-ink-600">
            Trois étapes, moins de 3 minutes chrono.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-10 sm:grid-cols-3 sm:gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{
                duration: 0.5,
                delay: i * 0.25,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="relative border-t border-ink-900/15 pt-6"
            >
              <span className="font-serif text-5xl font-medium text-rust-500/40">
                {step.number}
              </span>
              <h3 className="mt-4 font-serif text-xl font-medium text-ink-900">
                {step.title}
              </h3>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-ink-600">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
