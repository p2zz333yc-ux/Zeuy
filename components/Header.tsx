import { Star } from "lucide-react";
import { site } from "@/config/site";

// Header volontairement minimal : pas de menu de navigation qui distrait de l'achat.
export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-ink-900/10 bg-cream-100/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <span className="font-serif text-lg font-semibold uppercase tracking-[0.18em] text-ink-900 sm:text-xl">
          {site.brand}
        </span>
        <div className="flex items-center gap-1.5 text-sm text-ink-600">
          <div className="flex items-center gap-0.5 text-gold-500">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="size-3.5 fill-current" />
            ))}
          </div>
          <span className="font-medium text-ink-800">{site.rating.value}</span>
          <span className="hidden sm:inline">
            ({site.rating.count.toLocaleString("fr-FR")} avis)
          </span>
        </div>
      </div>
    </header>
  );
}
