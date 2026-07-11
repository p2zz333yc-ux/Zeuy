import Link from "next/link";
import { site } from "@/config/site";

const legalLinks = [
  { href: "/cgv", label: "CGV" },
  { href: "/confidentialite", label: "Politique de confidentialité" },
  { href: "/retours", label: "Politique de retour" },
  { href: "/mentions-legales", label: "Mentions légales" },
];

export function Footer() {
  return (
    <footer className="border-t border-ink-900/10 bg-ink-900 py-10 text-cream-200">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 text-center sm:px-6">
        <span className="font-serif text-lg font-medium uppercase tracking-[0.18em] text-cream-50">
          {site.brand}
        </span>
        <p className="max-w-md text-xs leading-relaxed text-ink-400">
          RootRitual est un accessoire d&apos;application et de massage du
          cuir chevelu. Il ne s&apos;agit pas d&apos;un dispositif médical et
          le produit ne garantit ni repousse ni traitement d&apos;une
          quelconque affection capillaire.
        </p>
        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-ink-400">
          {legalLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition hover:text-cream-100"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <p className="text-xs text-ink-500">
          © {new Date().getFullYear()} {site.legalName}. Tous droits
          réservés. Contact :{" "}
          <a
            href={`mailto:${site.supportEmail}`}
            className="underline underline-offset-2 hover:text-cream-200"
          >
            {site.supportEmail}
          </a>
        </p>
      </div>
    </footer>
  );
}
