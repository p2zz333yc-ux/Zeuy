"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Crosshair, Sparkles, Eye } from "lucide-react";
import { Reveal, StaggerGroup, staggerItem } from "@/components/Reveal";
import { VideoPlayer } from "@/components/VideoPlayer";
import { generatedMedia } from "@/config/media";

const benefits = [
  {
    number: "01",
    icon: Crosshair,
    title: "Application précise aux racines",
    description:
      "Les picots à billes métalliques déposent l'huile directement à la racine, là où ton rituel capillaire en a besoin.",
  },
  {
    number: "02",
    icon: Sparkles,
    title: "Massage du cuir chevelu, en même temps",
    description:
      "Chaque passage masse le cuir chevelu pendant l'application : un geste, deux sensations.",
  },
  {
    number: "03",
    icon: Eye,
    title: "Dosage visible",
    description:
      "La fenêtre graduée te montre exactement combien d'huile tu utilises, à chaque rituel.",
  },
];

export function SolutionSection() {
  return (
    <section id="solution" className="bg-ink-900 py-16 text-cream-100 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="max-w-xl">
          <span className="text-xs font-semibold uppercase tracking-[0.28em] text-gold-400">
            La solution
          </span>
          <h2 className="mt-3 font-serif text-3xl font-medium tracking-tight text-cream-50 sm:text-4xl">
            Un seul geste, deux bénéfices
          </h2>
          <p className="mt-3 max-w-lg text-ink-400">
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
              className="w-40 shrink-0 overflow-hidden rounded-3xl shadow-2xl ring-1 ring-cream-50/10 sm:w-56"
            >
              <Image
                src={generatedMedia.dosageLifestyle}
                alt="Fenêtre de dosage graduée de l'applicateur RootRitual dans une main"
                width={928}
                height={1152}
                className="w-full"
              />
            </motion.div>
            <VideoPlayer
              src={generatedMedia.ugcDemoVideo}
              className="hidden sm:flex"
            />
          </Reveal>

          <StaggerGroup className="order-1 flex flex-col divide-y divide-cream-50/10 lg:order-2">
            {benefits.map((b) => (
              <motion.div
                key={b.title}
                variants={staggerItem}
                className="flex gap-5 py-5 first:pt-0 last:pb-0"
              >
                <span className="font-serif text-2xl font-medium text-rust-500">
                  {b.number}
                </span>
                <div>
                  <h3 className="flex items-center gap-2 font-serif text-lg font-medium text-cream-50">
                    <b.icon className="size-4 text-gold-400" />
                    {b.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-400">
                    {b.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </StaggerGroup>
        </div>

        <div className="mt-10 flex justify-center sm:hidden">
          <VideoPlayer src={generatedMedia.ugcDemoVideo} />
        </div>
      </div>
    </section>
  );
}
