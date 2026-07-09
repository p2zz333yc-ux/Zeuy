import { Suspense, lazy, useState } from 'react'
import { motion } from 'framer-motion'
import Reveal from '../components/Reveal'

const MiniOrb = lazy(() => import('../components/three/MiniOrb'))

const faqs = [
  {
    q: 'Vos produits conviennent-ils aux chiots et chatons ?',
    a: 'La majorité de nos soins sont adaptés dès 3 mois. Chaque fiche produit précise les recommandations d’âge.',
  },
  {
    q: 'Livrez-vous partout en France ?',
    a: 'Oui, sous 2 à 4 jours ouvrés, avec livraison offerte dès 39€ d’achat.',
  },
  {
    q: 'Puis-je être remboursé si le produit ne convient pas ?',
    a: 'Bien sûr, vous disposez de 30 jours pour nous contacter et être remboursé intégralement.',
  },
]

export default function Contact() {
  const [sent, setSent] = useState(false)

  return (
    <div className="mx-auto max-w-6xl px-6 pb-24 pt-10">
      <div className="grid gap-14 md:grid-cols-2">
        <div>
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full bg-sage-100 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-sage-700">
              Contact
            </span>
            <h1 className="mt-4 text-balance font-display text-4xl font-medium text-ink md:text-5xl">
              Parlons du bien-être de votre compagnon
            </h1>
            <p className="mt-4 text-balance text-ink-soft">
              Une question sur un produit, une commande ou un conseil personnalisé ? Notre équipe (et nos deux
              chats de bureau) vous répond sous 24h.
            </p>
          </Reveal>

          <Reveal delay={0.12}>
            <div className="relative mt-10 h-56 overflow-hidden rounded-3xl bg-sage-100/60">
              <Suspense fallback={null}>
                <MiniOrb color="#648a4e" />
              </Suspense>
            </div>
          </Reveal>

          <Reveal delay={0.2}>
            <dl className="mt-10 space-y-4 text-sm text-ink-soft">
              <div className="flex gap-3">
                <dt className="font-semibold text-ink">Email</dt>
                <dd>bonjour@zenimo.fr</dd>
              </div>
              <div className="flex gap-3">
                <dt className="font-semibold text-ink">Téléphone</dt>
                <dd>01 84 60 12 34 (lun-ven, 9h-18h)</dd>
              </div>
              <div className="flex gap-3">
                <dt className="font-semibold text-ink">Atelier</dt>
                <dd>12 rue des Lavandes, 33000 Bordeaux</dd>
              </div>
            </dl>
          </Reveal>
        </div>

        <Reveal delay={0.1}>
          <div className="rounded-[2rem] border border-sage-100 bg-white/70 p-8 shadow-card">
            {sent ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex h-full flex-col items-center justify-center py-16 text-center"
              >
                <span className="text-4xl">🌿</span>
                <h2 className="mt-4 font-display text-xl font-medium text-ink">Message envoyé</h2>
                <p className="mt-2 text-sm text-ink-soft">Merci ! Nous revenons vers vous très vite.</p>
              </motion.div>
            ) : (
              <form
                className="space-y-5"
                onSubmit={(e) => {
                  e.preventDefault()
                  setSent(true)
                }}
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="block text-sm">
                    <span className="mb-1.5 block font-medium text-ink">Nom</span>
                    <input
                      required
                      className="w-full rounded-xl border border-sage-200 bg-cream px-4 py-2.5 outline-none focus:border-sage-500"
                      placeholder="Votre nom"
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1.5 block font-medium text-ink">Email</span>
                    <input
                      required
                      type="email"
                      className="w-full rounded-xl border border-sage-200 bg-cream px-4 py-2.5 outline-none focus:border-sage-500"
                      placeholder="votre@email.com"
                    />
                  </label>
                </div>
                <label className="block text-sm">
                  <span className="mb-1.5 block font-medium text-ink">Votre compagnon</span>
                  <select className="w-full rounded-xl border border-sage-200 bg-cream px-4 py-2.5 outline-none focus:border-sage-500">
                    <option>Chien</option>
                    <option>Chat</option>
                    <option>Les deux</option>
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="mb-1.5 block font-medium text-ink">Message</span>
                  <textarea
                    required
                    rows={5}
                    className="w-full rounded-xl border border-sage-200 bg-cream px-4 py-2.5 outline-none focus:border-sage-500"
                    placeholder="Comment pouvons-nous vous aider ?"
                  />
                </label>
                <button className="w-full rounded-full bg-sage-600 px-6 py-3.5 text-sm font-semibold text-cream shadow-soft transition-transform hover:-translate-y-0.5 hover:bg-sage-700">
                  Envoyer le message
                </button>
              </form>
            )}
          </div>
        </Reveal>
      </div>

      <section className="mt-24">
        <Reveal>
          <h2 className="text-center font-display text-2xl font-medium text-ink">Questions fréquentes</h2>
        </Reveal>
        <div className="mx-auto mt-10 max-w-2xl space-y-4">
          {faqs.map((f, i) => (
            <Reveal key={f.q} delay={i * 0.08}>
              <details className="group rounded-2xl border border-sage-100 bg-white/60 p-5 open:shadow-card">
                <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-ink">
                  {f.q}
                  <span className="ml-4 text-sage-600 transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">{f.a}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  )
}
