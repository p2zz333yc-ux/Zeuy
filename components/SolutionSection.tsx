"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Crosshair, Sparkles, Eye } from "lucide-react";
import { Reveal, StaggerGroup, staggerItem } from "@/components/Reveal";
import { VideoPlayer } from "@/components/VideoPlayer";

const benefits = [
  {
    icon: Crosshair,
    title: "Application précise aux racines",
    description:
      "Les picots à billes métalliques déposent l'huile directement à la racine, là où ton rituel capillaire en a besoin.",
  },
  {
    icon: Sparkles,
    title: "Massage du cuir chevelu, en même temps",
    description:
      "Chaque passage masse le cuir chevelu pendant l'application : un geste, deux sensations.",
  },
  {
    icon: Eye,
    title: "Dosage visible",
    description:
      "La fenêtre graduée te montre exactement combien d'huile tu utilises, à chaque rituel.",
  },
];

export function SolutionSection() {
  return (
    <section id="solution" className="bg-stone-50 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="font-serif text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
            Un seul geste, deux bénéfices
          </h2>
          <p className="mt-3 text-stone-600">
            RootRitual associe application ciblée et massage stimulant du
            cuir chevelu, avec un dosage que tu contrôles du regard.
          </p>
        </Reveal>

        <div className="mt-14 grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <Reveal className="order-2 flex items-center justify-center gap-6 lg:order-1">
            <motion.div
              whileInView={{ rotate: [0, -2, 2, 0] }}
              viewport={{ once: true }}
              transition={{ duration: 1.1, ease: "easeInOut" }}
              className="w-40 shrink-0 overflow-hidden rounded-3xl shadow-xl sm:w-56"
            >
              <Image
                src="/images/product-dosage.jpg"
                alt="Fenêtre de dosage graduée de l'applicateur RootRitual dans une main"
                width={1206}
                height={875}
                className="w-full"
              />
            </motion.div>
            <VideoPlayer className="hidden sm:flex" />
          </Reveal>

          <StaggerGroup className="order-1 grid gap-5 lg:order-2">
            {benefits.map((b) => (
              <motion.div
                key={b.title}
                variants={staggerItem}
                className="flex gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-100"
              >
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white">
                  <b.icon className="size-5" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-semibold text-stone-900">
                    {b.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-stone-600">
                    {b.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </StaggerGroup>
        </div>

        <div className="mt-10 flex justify-center sm:hidden">
          <VideoPlayer />
        </div>
      </div>
    </section>
  );
}
