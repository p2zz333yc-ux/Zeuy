import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useCart } from '../context/CartContext'

export default function CartToast() {
  const { lastAdded } = useCart()
  const [visibleId, setVisibleId] = useState<string | null>(null)

  useEffect(() => {
    if (!lastAdded) return
    setVisibleId(`${lastAdded.id}-${Date.now()}`)
    const timer = setTimeout(() => setVisibleId(null), 2600)
    return () => clearTimeout(timer)
  }, [lastAdded])

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-[60] flex flex-col items-end gap-2">
      <AnimatePresence>
        {visibleId && lastAdded && (
          <motion.div
            key={visibleId}
            initial={{ opacity: 0, x: 60, rotateY: -25 }}
            animate={{ opacity: 1, x: 0, rotateY: 0 }}
            exit={{ opacity: 0, x: 60, rotateY: 20 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformPerspective: 800 }}
            className="flex items-center gap-3 rounded-2xl border border-sage-100 bg-white/95 px-4 py-3 shadow-soft backdrop-blur-sm"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sage-100 text-sage-700">
              ✓
            </span>
            <div className="text-sm">
              <p className="font-semibold text-ink">{lastAdded.name}</p>
              <p className="text-ink-soft">Ajouté au panier</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
