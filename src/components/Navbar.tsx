import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useCart } from '../context/CartContext'

const links = [
  { to: '/', label: 'Accueil' },
  { to: '/boutique', label: 'Boutique' },
  { to: '/contact', label: 'Contact' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const { count } = useCart()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled ? 'bg-cream/85 shadow-[0_1px_0_rgba(31,42,30,0.08)] backdrop-blur-xl' : 'bg-transparent'
      }`}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="group flex items-center gap-2" onClick={() => setOpen(false)}>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sage-500 text-cream shadow-card transition-transform duration-500 group-hover:rotate-12">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
              <path d="M12 9.5c-3.2 0-5.6 3-5.6 5.9 0 2 1.5 3.2 3.3 3.2 1.1 0 1.7-.5 2.3-.5s1.2.5 2.3.5c1.8 0 3.3-1.2 3.3-3.2 0-2.9-2.4-5.9-5.6-5.9Z" />
              <ellipse cx="7.2" cy="7" rx="1.7" ry="2.2" />
              <ellipse cx="16.8" cy="7" rx="1.7" ry="2.2" />
              <ellipse cx="3.6" cy="11" rx="1.4" ry="1.9" />
              <ellipse cx="20.4" cy="11" rx="1.4" ry="1.9" />
            </svg>
          </span>
          <span className="font-display text-xl font-medium tracking-tight text-ink">Zenimo</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `relative text-sm font-medium tracking-wide transition-colors ${
                  isActive ? 'text-sage-700' : 'text-ink-soft hover:text-sage-600'
                }`
              }
            >
              {({ isActive }) => (
                <span className="relative pb-1">
                  {link.label}
                  {isActive && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute -bottom-0.5 left-0 right-0 h-[2px] rounded-full bg-clay-500"
                    />
                  )}
                </span>
              )}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/boutique"
            className="relative hidden h-10 w-10 items-center justify-center rounded-full border border-sage-200 text-ink-soft transition-colors hover:border-sage-400 hover:text-sage-700 sm:flex"
            aria-label="Panier"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M6 8h12l-1 12H7L6 8Z" strokeLinejoin="round" />
              <path d="M9 8V6a3 3 0 0 1 6 0v2" strokeLinecap="round" />
            </svg>
            <AnimatePresence>
              {count > 0 && (
                <motion.span
                  key={count}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-clay-500 text-[11px] font-semibold text-cream"
                >
                  {count}
                </motion.span>
              )}
            </AnimatePresence>
          </Link>

          <Link
            to="/boutique"
            className="hidden rounded-full bg-sage-600 px-5 py-2.5 text-sm font-semibold text-cream shadow-card transition-transform hover:-translate-y-0.5 hover:bg-sage-700 sm:inline-flex"
          >
            Découvrir
          </Link>

          <button
            className="flex h-10 w-10 items-center justify-center rounded-full border border-sage-200 md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            <div className="flex flex-col gap-1.5">
              <motion.span animate={{ rotate: open ? 45 : 0, y: open ? 6 : 0 }} className="h-[2px] w-5 bg-ink" />
              <motion.span animate={{ opacity: open ? 0 : 1 }} className="h-[2px] w-5 bg-ink" />
              <motion.span animate={{ rotate: open ? -45 : 0, y: open ? -6 : 0 }} className="h-[2px] w-5 bg-ink" />
            </div>
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-cream/95 backdrop-blur-xl md:hidden"
          >
            <div className="flex flex-col gap-4 px-6 pb-6 pt-2">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setOpen(false)}
                  className="text-base font-medium text-ink-soft"
                >
                  {link.label}
                </NavLink>
              ))}
              <Link
                to="/boutique"
                onClick={() => setOpen(false)}
                className="rounded-full bg-sage-600 px-5 py-2.5 text-center text-sm font-semibold text-cream"
              >
                Découvrir la boutique
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
