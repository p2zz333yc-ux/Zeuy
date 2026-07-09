import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="border-t border-sage-100 bg-cream-dark/60">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sage-500 text-cream">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                <path d="M12 9.5c-3.2 0-5.6 3-5.6 5.9 0 2 1.5 3.2 3.3 3.2 1.1 0 1.7-.5 2.3-.5s1.2.5 2.3.5c1.8 0 3.3-1.2 3.3-3.2 0-2.9-2.4-5.9-5.6-5.9Z" />
                <ellipse cx="7.2" cy="7" rx="1.7" ry="2.2" />
                <ellipse cx="16.8" cy="7" rx="1.7" ry="2.2" />
                <ellipse cx="3.6" cy="11" rx="1.4" ry="1.9" />
                <ellipse cx="20.4" cy="11" rx="1.4" ry="1.9" />
              </svg>
            </span>
            <span className="font-display text-xl font-medium text-ink">Zenimo</span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-soft">
            Des rituels de bien-être naturels pour chiens et chats, pensés avec des vétérinaires pour des compagnons
            plus sereins, jour après jour.
          </p>
        </div>

        <div>
          <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-ink-soft">Boutique</h4>
          <ul className="mt-4 space-y-3 text-sm text-ink-soft">
            <li><Link to="/boutique" className="hover:text-sage-700">Tous les produits</Link></li>
            <li><Link to="/boutique?cat=Soins%20%26%20Toilettage" className="hover:text-sage-700">Soins & toilettage</Link></li>
            <li><Link to="/boutique?cat=Compl%C3%A9ments" className="hover:text-sage-700">Compléments</Link></li>
            <li><Link to="/boutique?cat=Aromath%C3%A9rapie" className="hover:text-sage-700">Aromathérapie</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-ink-soft">Zenimo</h4>
          <ul className="mt-4 space-y-3 text-sm text-ink-soft">
            <li><Link to="/contact" className="hover:text-sage-700">Contact</Link></li>
            <li><a href="#bienfaits" className="hover:text-sage-700">Notre approche</a></li>
            <li><a href="#avis" className="hover:text-sage-700">Avis clients</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-ink-soft">Restons en lien</h4>
          <p className="mt-4 text-sm text-ink-soft">
            Conseils bien-être, nouveautés et offres douces, une fois par mois dans votre boîte mail.
          </p>
          <form className="mt-4 flex overflow-hidden rounded-full border border-sage-200 bg-cream" onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              required
              placeholder="votre@email.com"
              className="w-full bg-transparent px-4 py-2.5 text-sm text-ink outline-none placeholder:text-ink-soft/60"
            />
            <button className="whitespace-nowrap bg-sage-600 px-4 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-sage-700">
              OK
            </button>
          </form>
        </div>
      </div>

      <div className="border-t border-sage-100 px-6 py-6 text-center text-xs text-ink-soft/70">
        © {new Date().getFullYear()} Zenimo — Le bien-être naturel pour votre animal. Tous droits réservés.
      </div>
    </footer>
  )
}
