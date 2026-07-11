"use client";

import { Droplets, HandMetal, Ruler } from "lucide-react";
import { Reveal, StaggerGroup, staggerItem } from "@/components/Reveal";
import { motion } from "framer-motion";

const problems = [
  {
    number: "01",
    icon: HandMetal,
    title: "Mains grasses",
    description:
      "Verser l'huile dans tes paumes avant de l'appliquer, c'est se retrouver avec les mains huileuses pour le reste de la routine.",
  },
  {
    number: "02",
    icon: Droplets,
    title: "Huile gaspillée sur les longueurs",
    description:
      "Sans applicateur précis, l'huile finit sur les longueurs alors que ce sont les racines qui en ont besoin.",
  },
  {
    number: "03",
    icon: Ruler,
    title: "Dosage au pif",
    description:
      "Trop peu, ça ne fait rien. Trop, ça alourdit. Sans repère visuel, impossible de savoir combien tu utilises vraiment.",
  },
];

export function ProblemSection() {
  return (
    <section className="bg-cream-50 py-16 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="max-w-xl">
          <span className="text-xs font-semibold uppercase tracking-[0.28em] text-rust-600">
            Le constat
          </span>
          <h2 className="mt-3 font-serif text-3xl font-medium tracking-tight text-ink-900 sm:text-4xl">
            Le rituel capillaire, version frustrante
          </h2>
          <p className="mt-3 text-ink-600">
            Si tu appliques ton huile de cuir chevelu à la main, tu connais
            déjà ces trois problèmes.
          </p>
        </Reveal>

        <StaggerGroup className="mt-14 grid gap-px overflow-hidden rounded-3xl bg-ink-900/10 sm:grid-cols-3">
          {problems.map((problem) => (
            <motion.div
              key={problem.title}
              variants={staggerItem}
              className="relative flex flex-col bg-cream-50 p-8"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute -right-2 -top-4 font-serif text-7xl font-medium text-ink-900/5"
              >
                {problem.number}
              </span>
              <motion.div
                initial={{ scale: 0.8, rotate: -8 }}
                whileInView={{ scale: 1, rotate: 0 }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 200, damping: 14 }}
                className="relative flex size-11 items-center justify-center rounded-full border border-rust-500/30 text-rust-600"
              >
                <problem.icon className="size-5" />
              </motion.div>
              <h3 className="relative mt-5 font-serif text-lg font-medium text-ink-900">
                {problem.title}
              </h3>
              <p className="relative mt-2 text-sm leading-relaxed text-ink-600">
                {problem.description}
              </p>
            </motion.div>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}
