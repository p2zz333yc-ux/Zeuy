import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { Product } from '../data/products'

type CartLine = { product: Product; quantity: number }

type CartContextValue = {
  lines: CartLine[]
  count: number
  total: number
  lastAdded: Product | null
  addItem: (product: Product) => void
  removeItem: (productId: string) => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([])
  const [lastAdded, setLastAdded] = useState<Product | null>(null)

  const addItem = useCallback((product: Product) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.product.id === product.id)
      if (existing) {
        return prev.map((l) => (l.product.id === product.id ? { ...l, quantity: l.quantity + 1 } : l))
      }
      return [...prev, { product, quantity: 1 }]
    })
    setLastAdded(product)
  }, [])

  const removeItem = useCallback((productId: string) => {
    setLines((prev) => prev.filter((l) => l.product.id !== productId))
  }, [])

  const count = useMemo(() => lines.reduce((sum, l) => sum + l.quantity, 0), [lines])
  const total = useMemo(() => lines.reduce((sum, l) => sum + l.quantity * l.product.price, 0), [lines])

  const value = useMemo(
    () => ({ lines, count, total, lastAdded, addItem, removeItem }),
    [lines, count, total, lastAdded, addItem, removeItem],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
