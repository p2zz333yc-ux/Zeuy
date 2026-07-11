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
    <section className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="font-serif text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
            Comment ça marche
          </h2>
          <p className="mt-3 text-stone-600">
            Un rituel capillaire en trois étapes, moins de 3 minutes chrono.
          </p>
        </Reveal>

        <div className="relative mt-14 grid gap-8 sm:grid-cols-3 sm:gap-6">
          <div
            aria-hidden
            className="absolute top-8 left-0 right-0 hidden h-px bg-stone-200 sm:block"
          />
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
              className="relative flex flex-col items-center text-center sm:items-start sm:text-left"
            >
              <span className="relative z-10 flex size-16 items-center justify-center rounded-full bg-rose-600 font-serif text-xl font-semibold text-white shadow-lg shadow-rose-600/30">
                {step.number}
              </span>
              <h3 className="mt-5 font-serif text-lg font-semibold text-stone-900">
                {step.title}
              </h3>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-stone-600">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
