import Reveal from './Reveal'

const testimonials = [
  {
    name: 'Camille & Mochi',
    role: 'Chat de 4 ans',
    quote:
      "Le diffuseur Zenimo a changé notre quotidien. Mochi ne miaule plus la nuit et s'endort beaucoup plus vite. Un vrai apaisement pour toute la maison.",
    avatar: '🐱',
  },
  {
    name: 'Yanis & Bali',
    role: 'Chien de 9 ans',
    quote:
      'Depuis la cure Articulations Sereines, Bali remonte les escaliers sans hésiter. Le baume pour les pattes est devenu un rituel qu’il adore.',
    avatar: '🐕',
  },
  {
    name: 'Sarah & Nala',
    role: 'Chatonne de 1 an',
    quote:
      "Le spray anti-stress nous sauve à chaque visite chez le vétérinaire. Nala reste calme dans le panier, c'est bluffant.",
    avatar: '🐈',
  },
]

export default function Testimonials() {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {testimonials.map((t, i) => (
        <Reveal key={t.name} delay={i * 0.1}>
          <figure className="flex h-full flex-col rounded-3xl border border-sage-100 bg-white/70 p-7 shadow-card">
            <span className="text-3xl">{t.avatar}</span>
            <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-ink-soft">“{t.quote}”</blockquote>
            <figcaption className="mt-5 border-t border-sage-100 pt-4">
              <p className="font-display text-sm font-medium text-ink">{t.name}</p>
              <p className="text-xs text-ink-soft">{t.role}</p>
            </figcaption>
          </figure>
        </Reveal>
      ))}
    </div>
  )
}
