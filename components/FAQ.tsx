"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { site } from "@/config/site";
import clsx from "clsx";

const faqs = [
  {
    question: "Est-ce compatible avec tous les types de cheveux ?",
    answer:
      "Oui. Les picots à billes s'adaptent aux cheveux fins, épais, bouclés, lisses ou crépus. Il te suffit d'écarter les cheveux au niveau de la raie pour que l'embout touche directement le cuir chevelu.",
  },
  {
    question: "Quelle huile puis-je utiliser ?",
    answer:
      "Toute huile capillaire fluide (jojoba, argan, ricin, coco fractionnée, mélanges du commerce). Évite les huiles trop épaisses ou cireuses qui pourraient boucher les picots.",
  },
  {
    question: "Comment on nettoie l'applicateur ?",
    answer:
      "Rince l'embout à l'eau tiède après chaque utilisation et essuie avec un chiffon doux. Un nettoyage plus complet une fois par semaine avec un peu de savon doux suffit à garder les picots impeccables.",
  },
  {
    question: "Quels sont les délais de livraison ?",
    answer:
      "Livraison offerte, expédition sous 24 à 48h ouvrées. Compte ensuite 2 à 5 jours ouvrés selon ta zone de livraison. Un email de suivi te permet de suivre ton colis en temps réel.",
  },
  {
    question: "Puis-je être remboursé si le produit ne me convient pas ?",
    answer: `Oui, tu disposes de ${site.guaranteeDays} jours après réception pour nous contacter et demander un remboursement intégral, sans justification.`,
  },
  {
    question: "Je peux l'utiliser tous les jours ?",
    answer:
      "Oui, l'applicateur se prête à un usage quotidien. Beaucoup de clientes l'intègrent à leur rituel du soir, 2 à 4 fois par semaine, selon leurs habitudes capillaires.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="bg-cream-50 py-16 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <Reveal className="text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.28em] text-rust-600">
            Questions
          </span>
          <h2 className="mt-3 font-serif text-3xl font-medium tracking-tight text-ink-900 sm:text-4xl">
            Questions fréquentes
          </h2>
        </Reveal>

        <Reveal delay={0.1} className="mt-10 flex flex-col divide-y divide-ink-900/10 border-y border-ink-900/10">
          {faqs.map((faq, i) => {
            const isOpen = open === i;
            return (
              <div key={faq.question}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 py-5 text-left"
                >
                  <span
                    className={clsx(
                      "font-serif text-base font-medium",
                      isOpen ? "text-rust-600" : "text-ink-900"
                    )}
                  >
                    {faq.question}
                  </span>
                  <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.25 }}
                    className="shrink-0 text-ink-500"
                  >
                    <ChevronDown className="size-5" />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen ? (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="pb-5 text-sm leading-relaxed text-ink-600">
                        {faq.answer}
                      </p>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            );
          })}
        </Reveal>
      </div>
    </section>
  );
}
