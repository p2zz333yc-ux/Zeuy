import Reveal from './Reveal'

type SectionHeadingProps = {
  eyebrow: string
  title: string
  subtitle?: string
  center?: boolean
}

export default function SectionHeading({ eyebrow, title, subtitle, center = true }: SectionHeadingProps) {
  return (
    <Reveal className={center ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}>
      <span className="inline-flex items-center gap-2 rounded-full bg-sage-100 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-sage-700">
        {eyebrow}
      </span>
      <h2 className="mt-4 text-balance text-3xl font-medium text-ink md:text-4xl">{title}</h2>
      {subtitle && <p className="mt-4 text-balance text-base leading-relaxed text-ink-soft">{subtitle}</p>}
    </Reveal>
  )
}
