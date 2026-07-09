import { Link } from 'react-router-dom'
import Reveal from '../components/Reveal'

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70svh] max-w-2xl flex-col items-center justify-center px-6 pt-24 text-center">
      <Reveal>
        <span className="text-6xl">🐾</span>
        <h1 className="mt-6 font-display text-4xl font-medium text-ink">Page introuvable</h1>
        <p className="mt-4 text-ink-soft">
          On dirait que ce chemin s'est perdu en reniflant les alentours. Retournons à la maison.
        </p>
        <Link
          to="/"
          className="mt-8 inline-flex rounded-full bg-sage-600 px-7 py-3.5 text-sm font-semibold text-cream shadow-soft transition-transform hover:-translate-y-0.5 hover:bg-sage-700"
        >
          Retour à l’accueil
        </Link>
      </Reveal>
    </div>
  )
}
