import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import Reveal from '../components/Reveal'
import ProductCard from '../components/ProductCard'
import { categories, products } from '../data/products'

export default function Boutique() {
  const [searchParams] = useSearchParams()
  const initialCat = searchParams.get('cat')
  const [active, setActive] = useState<string>(
    initialCat && (categories as readonly string[]).includes(initialCat) ? initialCat : 'Tous',
  )

  const filtered = useMemo(
    () => (active === 'Tous' ? products : products.filter((p) => p.category === active)),
    [active],
  )

  return (
    <div className="mx-auto max-w-6xl px-6 pb-24 pt-10">
      <Reveal className="max-w-2xl">
        <span className="inline-flex items-center gap-2 rounded-full bg-sage-100 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-sage-700">
          Boutique
        </span>
        <h1 className="mt-4 text-balance font-display text-4xl font-medium text-ink md:text-5xl">
          Des rituels de bien-être pour chaque compagnon
        </h1>
        <p className="mt-4 text-balance text-ink-soft">
          Filtrez par besoin et composez la routine sereine qui convient à votre chien ou votre chat.
        </p>
      </Reveal>

      <Reveal delay={0.1}>
        <div className="mt-10 flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActive(cat)}
              className={`relative rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${
                active === cat ? 'text-cream' : 'text-ink-soft hover:text-sage-700'
              }`}
            >
              {active === cat && (
                <motion.span
                  layoutId="cat-pill"
                  className="absolute inset-0 rounded-full bg-sage-600"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                />
              )}
              <span className="relative z-10">{cat}</span>
            </button>
          ))}
        </div>
      </Reveal>

      <motion.div layout className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p, i) => (
          <ProductCard key={p.id} product={p} index={i} />
        ))}
      </motion.div>

      {filtered.length === 0 && (
        <p className="mt-16 text-center text-ink-soft">Aucun produit dans cette catégorie pour le moment.</p>
      )}
    </div>
  )
}
