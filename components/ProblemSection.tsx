"use client";

import { Droplets, HandMetal, Ruler } from "lucide-react";
import { Reveal, StaggerGroup, staggerItem } from "@/components/Reveal";
import { motion } from "framer-motion";

const problems = [
  {
    icon: HandMetal,
    title: "Mains grasses",
    description:
      "Verser l'huile dans tes paumes avant de l'appliquer, c'est se retrouver avec les mains huileuses pour le reste de la routine.",
  },
  {
    icon: Droplets,
    title: "Huile gaspillée sur les longueurs",
    description:
      "Sans applicateur précis, l'huile finit sur les longueurs alors que ce sont les racines qui en ont besoin.",
  },
  {
    icon: Ruler,
    title: "Dosage au pif",
    description:
      "Trop peu, ça ne fait rien. Trop, ça alourdit. Sans repère visuel, impossible de savoir combien tu utilises vraiment.",
  },
];

export function ProblemSection() {
  return (
    <section className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="font-serif text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
            Le rituel capillaire, version frustrante
          </h2>
          <p className="mt-3 text-stone-600">
            Si tu appliques ton huile de cuir chevelu à la main, tu connais
            déjà ces trois problèmes.
          </p>
        </Reveal>

        <StaggerGroup className="mt-12 grid gap-6 sm:grid-cols-3">
          {problems.map((problem) => (
            <motion.div
              key={problem.title}
              variants={staggerItem}
              className="rounded-2xl border border-stone-100 bg-stone-50/60 p-6 text-center sm:text-left"
            >
              <motion.div
                initial={{ scale: 0.8, rotate: -8 }}
                whileInView={{ scale: 1, rotate: 0 }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 200, damping: 14 }}
                className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-rose-100 text-rose-700 sm:mx-0"
              >
                <problem.icon className="size-6" />
              </motion.div>
              <h3 className="font-serif text-lg font-semibold text-stone-900">
                {problem.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-stone-600">
                {problem.description}
              </p>
            </motion.div>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}
