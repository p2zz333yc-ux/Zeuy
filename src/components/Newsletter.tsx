import { Suspense, lazy, useState } from 'react'
import { motion } from 'framer-motion'
import Reveal from './Reveal'

const MiniOrb = lazy(() => import('./three/MiniOrb'))

export default function Newsletter() {
  const [sent, setSent] = useState(false)

  return (
    <div className="relative overflow-hidden rounded-[2.5rem] bg-sage-800 px-6 py-16 text-cream sm:px-12">
      <Suspense fallback={null}>
        <div className="pointer-events-none absolute -right-24 -top-24 hidden h-64 w-64 opacity-40 sm:block">
          <MiniOrb color="#e9c163" />
        </div>
        <div className="pointer-events-none absolute -bottom-28 -left-20 hidden h-64 w-64 opacity-25 sm:block">
          <MiniOrb color="#d97a52" />
        </div>
      </Suspense>

      <div className="relative mx-auto max-w-xl text-center">
        <Reveal>
          <span className="inline-flex items-center gap-2 rounded-full bg-cream/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-gold-300">
            Newsletter zen
          </span>
          <h2 className="mt-4 text-balance font-display text-3xl font-medium md:text-4xl">
            Un peu de sérénité dans votre boîte mail
          </h2>
          <p className="mt-4 text-balance text-sage-100/80">
            Rituels bien-être, conseils vétérinaires et offres douces — une fois par mois, sans spam.
          </p>

          {sent ? (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-cream/10 px-6 py-3 text-sm font-medium"
            >
              🌿 Merci, vous êtes inscrit !
            </motion.p>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                setSent(true)
              }}
              className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row"
            >
              <input
                type="email"
                required
                placeholder="votre@email.com"
                className="w-full rounded-full border border-cream/20 bg-cream/10 px-5 py-3 text-sm text-cream placeholder:text-cream/50 outline-none focus:border-gold-300"
              />
              <button className="whitespace-nowrap rounded-full bg-gold-400 px-6 py-3 text-sm font-semibold text-sage-900 transition-transform hover:-translate-y-0.5">
                Je m’inscris
              </button>
            </form>
          )}
        </Reveal>
      </div>
    </div>
  )
}
