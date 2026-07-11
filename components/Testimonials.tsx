"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { Reveal } from "@/components/Reveal";

const testimonials = [
  {
    name: "Camille D.",
    initials: "CD",
    rating: 5,
    text: "Fini les mains grasses après l'application. Les picots glissent super bien sur la raie et le massage est vraiment agréable, je le fais tous les 2 jours.",
  },
  {
    name: "Sarah M.",
    initials: "SM",
    rating: 5,
    text: "J'adore pouvoir voir exactement combien d'huile je mets grâce à la fenêtre graduée. Avant je faisais toujours au pif, maintenant c'est réglo.",
  },
  {
    name: "Léa B.",
    initials: "LB",
    rating: 4,
    text: "Le massage détend vraiment bien après une journée chargée. Petit temps d'adaptation pour trouver le bon débit d'huile mais ensuite c'est top.",
  },
  {
    name: "Inès K.",
    initials: "IK",
    rating: 5,
    text: "Ce que je préfère : plus aucune huile perdue sur les longueurs. Tout va exactement où je veux, à la racine. Facile à nettoyer aussi.",
  },
  {
    name: "Manon R.",
    initials: "MR",
    rating: 5,
    text: "La lumière LED aide vraiment à voir où on passe, surtout sur les zones difficiles à atteindre à l'arrière du crâne. Bonne prise en main.",
  },
  {
    name: "Chloé T.",
    initials: "CT",
    rating: 4,
    text: "Rituel du soir devenu un vrai moment détente. Le massage est doux mais on sent bien la stimulation. Je recommande à mes copines.",
  },
];

export function Testimonials() {
  const [index, setIndex] = useState(0);
  const [cardsPerView, setCardsPerView] = useState(1);

  useEffect(() => {
    function updateCards() {
      setCardsPerView(window.innerWidth >= 1024 ? 3 : window.innerWidth >= 640 ? 2 : 1);
    }
    updateCards();
    window.addEventListener("resize", updateCards);
    return () => window.removeEventListener("resize", updateCards);
  }, []);

  const maxIndex = Math.max(0, testimonials.length - cardsPerView);

  const next = useCallback(
    () => setIndex((i) => (i >= maxIndex ? 0 : i + 1)),
    [maxIndex]
  );
  const prev = () => setIndex((i) => (i <= 0 ? maxIndex : i - 1));

  useEffect(() => {
    const id = setInterval(next, 5000);
    return () => clearInterval(id);
  }, [next]);

  return (
    <section className="bg-stone-50 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="font-serif text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
            Elles ont adopté leur rituel
          </h2>
          <p className="mt-3 text-stone-600">
            Des retours sur l&apos;expérience d&apos;utilisation au quotidien.
          </p>
        </Reveal>

        <div className="relative mt-12">
          <div className="overflow-hidden">
            <motion.div
              className="flex"
              animate={{ x: `-${index * (100 / cardsPerView)}%` }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              {testimonials.map((t) => (
                <div
                  key={t.name}
                  className="shrink-0 px-2"
                  style={{ width: `${100 / cardsPerView}%` }}
                >
                  <div className="flex h-full flex-col rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-100">
                    <div className="flex items-center gap-1 text-amber-500">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={
                            "size-4 " +
                            (i < t.rating ? "fill-current" : "fill-none stroke-stone-300 text-stone-300")
                          }
                        />
                      ))}
                    </div>
                    <p className="mt-4 flex-1 text-sm leading-relaxed text-stone-700">
                      &ldquo;{t.text}&rdquo;
                    </p>
                    <div className="mt-5 flex items-center gap-3">
                      <span className="flex size-9 items-center justify-center rounded-full bg-rose-100 text-xs font-semibold text-rose-700">
                        {t.initials}
                      </span>
                      <span className="text-sm font-medium text-stone-800">
                        {t.name}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={prev}
              aria-label="Avis précédent"
              className="flex size-9 items-center justify-center rounded-full bg-white text-stone-600 shadow ring-1 ring-stone-200 transition hover:text-rose-700"
            >
              <ChevronLeft className="size-4" />
            </button>
            <div className="flex gap-1.5">
              {Array.from({ length: maxIndex + 1 }).map((_, i) => (
                <button
                  key={i}
                  aria-label={`Aller à la page ${i + 1}`}
                  onClick={() => setIndex(i)}
                  className={
                    "h-1.5 rounded-full transition-all " +
                    (i === index ? "w-6 bg-rose-600" : "w-1.5 bg-stone-300")
                  }
                />
              ))}
            </div>
            <button
              type="button"
              onClick={next}
              aria-label="Avis suivant"
              className="flex size-9 items-center justify-center rounded-full bg-white text-stone-600 shadow ring-1 ring-stone-200 transition hover:text-rose-700"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
