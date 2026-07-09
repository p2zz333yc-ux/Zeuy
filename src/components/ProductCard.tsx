import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import TiltCard from './TiltCard'
import type { Product } from '../data/products'
import { useCart } from '../context/CartContext'

const SHAPE_ICON: Record<Product['shape'], string> = {
  bottle: '🧴',
  jar: '🫙',
  ball: '🟢',
  drop: '💧',
  diffuser: '🕯️',
}

export default function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const { addItem } = useCart()

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
      className="group h-full"
    >
      <TiltCard className="h-full" maxTilt={8}>
        <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-sage-100 bg-white/70 shadow-card backdrop-blur-sm">
          <Link to={`/produit/${product.slug}`} className="relative block">
            <div
              className="flex aspect-[4/3] items-center justify-center overflow-hidden"
              style={{ background: `radial-gradient(circle at 50% 30%, ${product.color}33, ${product.color}0d)` }}
            >
              <motion.span
                className="text-7xl drop-shadow-xl"
                style={{ transform: 'translateZ(60px)' }}
                animate={{ y: [0, -10, 0], rotate: [0, 4, 0] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: index * 0.2 }}
              >
                {SHAPE_ICON[product.shape]}
              </motion.span>
            </div>
            {product.badge && (
              <span className="absolute left-4 top-4 rounded-full bg-clay-500 px-3 py-1 text-xs font-semibold text-cream shadow-card">
                {product.badge}
              </span>
            )}
          </Link>

          <div className="flex flex-1 flex-col gap-2 p-5" style={{ transform: 'translateZ(30px)' }}>
            <span className="text-xs font-semibold uppercase tracking-wider text-sage-600">{product.category}</span>
            <Link to={`/produit/${product.slug}`}>
              <h3 className="font-display text-lg font-medium text-ink transition-colors group-hover:text-sage-700">
                {product.name}
              </h3>
            </Link>
            <p className="text-sm text-ink-soft">{product.tagline}</p>

            <div className="mt-auto flex items-center justify-between pt-4">
              <span className="font-display text-lg font-medium text-ink">{product.price.toFixed(2)} €</span>
              <button
                onClick={() => addItem(product)}
                className="rounded-full bg-sage-600 px-4 py-2 text-xs font-semibold text-cream transition-all hover:-translate-y-0.5 hover:bg-sage-700 active:scale-95"
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      </TiltCard>
    </motion.div>
  )
}
