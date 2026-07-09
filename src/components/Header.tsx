import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu, Search, ShoppingCart, Star, X } from 'lucide-react'
import { useCart } from '../context/CartContext'
import SafeImg from './SafeImg'

const AVATAR_URL =
  'https://polo-pecan-73837341.figma.site/_assets/v11/e62173d41f91350a59628e8a9a55ae078a886fb9.png?w=128'

const navLinks = [
  { to: '/', label: 'Accueil' },
  { to: '/boutique', label: 'Boutique' },
  { to: '/contact', label: 'Contact' },
]

function Badge({ value }: { value: number }) {
  return (
    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-sage-50 bg-clay-500 text-[10px] font-bold text-white">
      {value}
    </span>
  )
}

export default function Header() {
  const { count } = useCart()
  const [open, setOpen] = useState(false)

  return (
    <header className="relative z-30 shrink-0 animate-fade-in delay-100">
      <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-12">
        <Link to="/" className="group flex items-center gap-2" onClick={() => setOpen(false)}>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sage-800 text-cream transition-transform duration-500 group-hover:rotate-12 lg:h-11 lg:w-11">
            <svg viewBox="0 0 24 24" className="h-5 w-5 lg:h-6 lg:w-6" fill="currentColor">
              <path d="M12 9.5c-3.2 0-5.6 3-5.6 5.9 0 2 1.5 3.2 3.3 3.2 1.1 0 1.7-.5 2.3-.5s1.2.5 2.3.5c1.8 0 3.3-1.2 3.3-3.2 0-2.9-2.4-5.9-5.6-5.9Z" />
              <ellipse cx="7.2" cy="7" rx="1.7" ry="2.2" />
              <ellipse cx="16.8" cy="7" rx="1.7" ry="2.2" />
              <ellipse cx="3.6" cy="11" rx="1.4" ry="1.9" />
              <ellipse cx="20.4" cy="11" rx="1.4" ry="1.9" />
            </svg>
          </span>
          <span className="font-display text-xl font-medium tracking-tight text-ink lg:text-2xl">Zenimo</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `text-sm font-medium transition-colors ${
                  isActive ? 'text-gray-900' : 'text-gray-600 hover:text-sage-700'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            aria-label="Rechercher"
            className="hidden h-10 w-10 items-center justify-center rounded-full border border-sage-200 text-ink-soft transition-colors hover:border-sage-400 hover:text-sage-700 sm:flex"
          >
            <Search size={17} strokeWidth={1.8} />
          </button>

          <button
            aria-label="Favoris"
            className="relative flex h-10 w-10 items-center justify-center rounded-full bg-clay-500 text-white transition-colors hover:bg-clay-600"
          >
            <Star size={17} strokeWidth={1.8} fill="currentColor" />
            <Badge value={4} />
          </button>

          <Link
            to="/boutique"
            aria-label="Panier"
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-sage-200 text-ink-soft transition-colors hover:border-sage-400 hover:text-sage-700"
          >
            <ShoppingCart size={17} strokeWidth={1.8} />
            {count > 0 && <Badge value={count} />}
          </Link>

          <SafeImg
            src={AVATAR_URL}
            fallback="/fallbacks/avatar.svg"
            alt="Profil"
            className="hidden h-10 w-10 rounded-full object-cover sm:block"
          />

          <button
            aria-label="Menu"
            onClick={() => setOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-sage-200 text-ink md:hidden"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="absolute inset-x-0 top-full z-40 border-b border-sage-100 bg-sage-50/95 px-6 pb-6 pt-2 backdrop-blur-xl md:hidden">
          <div className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setOpen(false)}
                className="text-base font-medium text-ink-soft"
              >
                {link.label}
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}
