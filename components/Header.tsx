import { Star } from "lucide-react";
import { site } from "@/config/site";

// Header volontairement minimal : pas de menu de navigation qui distrait de l'achat.
export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <span className="font-serif text-lg font-semibold tracking-tight text-stone-900 sm:text-xl">
          {site.brand}
        </span>
        <div className="flex items-center gap-1.5 text-sm text-stone-600">
          <div className="flex items-center gap-0.5 text-amber-500">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="size-3.5 fill-current" />
            ))}
          </div>
          <span className="font-medium text-stone-800">
            {site.rating.value}
          </span>
          <span className="hidden sm:inline">
            ({site.rating.count.toLocaleString("fr-FR")} avis)
          </span>
        </div>
      </div>
    </header>
  );
}
