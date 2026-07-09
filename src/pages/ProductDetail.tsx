import { Suspense, lazy } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import Reveal from '../components/Reveal'
import ProductCard from '../components/ProductCard'
import { getProductBySlug, products } from '../data/products'
import { useCart } from '../context/CartContext'

const ProductScene = lazy(() => import('../components/three/ProductScene'))

export default function ProductDetail() {
  const { slug } = useParams()
  const product = slug ? getProductBySlug(slug) : undefined
  const { addItem } = useCart()

  if (!product) return <Navigate to="/boutique" replace />

  const related = products.filter((p) => p.id !== product.id && p.category === product.category).slice(0, 3)

  return (
    <div className="mx-auto max-w-6xl px-6 pb-24 pt-10">
      <Reveal>
        <div className="flex flex-wrap items-center gap-2 text-sm text-ink-soft">
          <Link to="/boutique" className="hover:text-sage-700">Boutique</Link>
          <span>/</span>
          <span>{product.category}</span>
          <span>/</span>
          <span className="text-ink">{product.name}</span>
        </div>
      </Reveal>

      <div className="mt-8 grid gap-10 md:grid-cols-2 md:items-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="relative h-[380px] overflow-hidden rounded-[2.5rem] sm:h-[460px]"
          style={{ background: `radial-gradient(circle at 50% 30%, ${product.color}2e, transparent 70%)` }}
        >
          <Suspense fallback={<div className="h-full w-full animate-pulse bg-sage-100" />}>
            <ProductScene shape={product.shape} color={product.color} />
          </Suspense>
        </motion.div>

        <div>
          <Reveal>
            {product.badge && (
              <span className="inline-flex rounded-full bg-clay-500 px-3 py-1 text-xs font-semibold text-cream">
                {product.badge}
              </span>
            )}
            <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-sage-600">{product.category}</p>
            <h1 className="mt-2 text-balance font-display text-3xl font-medium text-ink md:text-4xl">
              {product.name}
            </h1>
            <p className="mt-3 text-lg text-ink-soft">{product.tagline}</p>
          </Reveal>

          <Reveal delay={0.1}>
            <p className="mt-6 leading-relaxed text-ink-soft">{product.description}</p>
          </Reveal>

          <Reveal delay={0.16}>
            <ul className="mt-6 space-y-2">
              {product.benefits.map((b) => (
                <li key={b} className="flex items-center gap-2 text-sm text-ink-soft">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sage-100 text-xs text-sage-700">✓</span>
                  {b}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={0.22}>
            <div className="mt-8 flex flex-wrap items-center gap-5">
              <span className="font-display text-3xl font-medium text-ink">{product.price.toFixed(2)} €</span>
              <button
                onClick={() => addItem(product)}
                className="rounded-full bg-sage-600 px-8 py-3.5 text-sm font-semibold text-cream shadow-soft transition-transform hover:-translate-y-0.5 hover:bg-sage-700 active:scale-95"
              >
                Ajouter au panier
              </button>
            </div>
            <div className="mt-4 flex gap-2 text-xs text-ink-soft">
              {product.species.map((s) => (
                <span key={s} className="rounded-full border border-sage-200 px-3 py-1">
                  {s === 'Chien' ? '🐕' : '🐈'} {s}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-24">
          <Reveal>
            <h2 className="font-display text-2xl font-medium text-ink">Vous pourriez aussi aimer</h2>
          </Reveal>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
