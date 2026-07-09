import { Suspense, lazy } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Reveal from '../components/Reveal'
import SectionHeading from '../components/SectionHeading'
import ProductCard from '../components/ProductCard'
import Testimonials from '../components/Testimonials'
import Newsletter from '../components/Newsletter'
import { products } from '../data/products'

const HeroScene = lazy(() => import('../components/three/HeroScene'))

const stats = [
  { value: '15 000+', label: 'compagnons apaisés' },
  { value: '4.9 / 5', label: 'note moyenne clients' },
  { value: '100%', label: 'ingrédients naturels' },
]

const benefits = [
  {
    title: 'Formules naturelles',
    text: 'Des ingrédients d’origine naturelle, sélectionnés pour leur douceur et leur efficacité.',
    icon: '🌿',
  },
  {
    title: 'Validé vétérinaires',
    text: 'Chaque recette est élaborée avec des vétérinaires comportementalistes.',
    icon: '🩺',
  },
  {
    title: 'Sans stress ajouté',
    text: 'Zéro parfum agressif, zéro ingrédient controversé : juste de la sérénité.',
    icon: '🕊️',
  },
  {
    title: 'Livraison douce',
    text: 'Emballages recyclés et livraison neutre en carbone partout en France.',
    icon: '📦',
  },
]

const steps = [
  {
    n: '01',
    title: 'Faites le point',
    text: 'Répondez à 3 questions sur les besoins de votre animal : stress, articulations, sommeil.',
  },
  {
    n: '02',
    title: 'Recevez vos rituels',
    text: 'Nous vous suggérons une sélection de soins adaptés à son âge et son tempérament.',
  },
  {
    n: '03',
    title: 'Observez la sérénité',
    text: 'Intégrez les produits en douceur et suivez les progrès semaine après semaine.',
  },
]

export default function Home() {
  const featured = products.slice(0, 4)

  return (
    <div>
      <section className="relative flex min-h-[92svh] items-center overflow-hidden pt-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_60%_at_50%_0%,_theme(colors.sage.100),_transparent)]" />
        <div className="relative mx-auto grid w-full max-w-6xl items-center gap-8 px-6 py-12 md:grid-cols-2 md:py-0">
          <div>
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-sage-700 shadow-sm">
                🐾 Bien-être animal, version zen
              </span>
            </Reveal>
            <Reveal delay={0.08}>
              <h1 className="mt-6 text-balance font-display text-4xl font-medium leading-[1.05] text-ink sm:text-5xl md:text-6xl">
                Le calme se cultive, <span className="text-sage-600">patte</span> après patte.
              </h1>
            </Reveal>
            <Reveal delay={0.16}>
              <p className="mt-6 max-w-md text-balance text-lg leading-relaxed text-ink-soft">
                Zenimo conçoit des soins naturels — aromathérapie douce, compléments et rituels sensoriels — pour
                apaiser le quotidien de votre chien ou de votre chat.
              </p>
            </Reveal>
            <Reveal delay={0.24}>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  to="/boutique"
                  className="rounded-full bg-sage-600 px-7 py-3.5 text-sm font-semibold text-cream shadow-soft transition-transform hover:-translate-y-0.5 hover:bg-sage-700"
                >
                  Découvrir la boutique
                </Link>
                <a
                  href="#bienfaits"
                  className="rounded-full border border-sage-300 px-7 py-3.5 text-sm font-semibold text-ink-soft transition-colors hover:border-sage-500 hover:text-sage-700"
                >
                  Notre approche
                </a>
              </div>
            </Reveal>
            <Reveal delay={0.32}>
              <div className="mt-12 grid max-w-md grid-cols-3 gap-4 border-t border-sage-200/70 pt-6">
                {stats.map((s) => (
                  <div key={s.label}>
                    <p className="font-display text-2xl font-medium text-ink">{s.value}</p>
                    <p className="mt-1 text-xs leading-snug text-ink-soft">{s.label}</p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="relative h-[420px] sm:h-[520px]"
          >
            <Suspense fallback={<div className="h-full w-full animate-pulse rounded-[3rem] bg-sage-100" />}>
              <HeroScene />
            </Suspense>
          </motion.div>
        </div>

        <motion.div
          className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-xs text-ink-soft md:flex"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span>Défilez</span>
          <span className="h-8 w-[1px] bg-ink-soft/40" />
        </motion.div>
      </section>

      <div className="overflow-hidden border-y border-sage-100 bg-cream-dark/50 py-4">
        <div className="flex w-max animate-marquee gap-16 text-sm font-medium uppercase tracking-widest text-ink-soft/70">
          {[...Array(2)].map((_, dup) => (
            <div key={dup} className="flex shrink-0 gap-16">
              {['Recommandé par 500+ vétérinaires', '100% naturel', 'Fabriqué en France', 'Sans cruauté animale', 'Livraison offerte dès 39€'].map(
                (t) => (
                  <span key={t} className="flex items-center gap-3">
                    <span className="h-1.5 w-1.5 rounded-full bg-clay-400" /> {t}
                  </span>
                ),
              )}
            </div>
          ))}
        </div>
      </div>

      <section id="bienfaits" className="mx-auto max-w-6xl px-6 py-24">
        <SectionHeading
          eyebrow="Pourquoi Zenimo"
          title="Une approche douce, pensée pour chaque tempérament"
          subtitle="Nous croyons qu'un animal serein est un animal en confiance. Chaque produit est conçu pour accompagner ce chemin, sans forcer, sans agresser."
        />
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((b, i) => (
            <Reveal key={b.title} delay={i * 0.08}>
              <div className="group h-full rounded-3xl border border-sage-100 bg-white/60 p-7 shadow-card transition-transform duration-500 hover:-translate-y-1.5">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sage-100 text-2xl transition-transform duration-500 group-hover:rotate-6">
                  {b.icon}
                </span>
                <h3 className="mt-5 font-display text-lg font-medium text-ink">{b.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{b.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            center={false}
            eyebrow="Sélection"
            title="Nos produits phares"
            subtitle="Les rituels préférés de nos 15 000 compagnons à quatre pattes."
          />
          <Reveal>
            <Link
              to="/boutique"
              className="hidden rounded-full border border-sage-300 px-6 py-3 text-sm font-semibold text-ink-soft transition-colors hover:border-sage-500 hover:text-sage-700 sm:inline-flex"
            >
              Voir toute la boutique →
            </Link>
          </Reveal>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      </section>

      <section className="bg-cream-dark/50 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <SectionHeading eyebrow="Simple & guidé" title="Comment ça marche" />
          <div className="relative mt-14 grid gap-10 md:grid-cols-3">
            <div className="absolute left-0 right-0 top-6 hidden h-px bg-sage-200 md:block" />
            {steps.map((s, i) => (
              <Reveal key={s.n} delay={i * 0.12}>
                <div className="relative text-center md:text-left">
                  <span className="relative z-10 inline-flex h-12 w-12 items-center justify-center rounded-full bg-sage-600 font-display text-sm font-semibold text-cream">
                    {s.n}
                  </span>
                  <h3 className="mt-5 font-display text-lg font-medium text-ink">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">{s.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="avis" className="mx-auto max-w-6xl px-6 py-24">
        <SectionHeading
          eyebrow="Ils témoignent"
          title="Des compagnons plus sereins, des familles rassurées"
        />
        <div className="mt-14">
          <Testimonials />
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-6 pb-24">
        <Newsletter />
      </section>
    </div>
  )
}
