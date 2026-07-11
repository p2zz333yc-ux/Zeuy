import Link from "next/link";
import { XCircle } from "lucide-react";
import { site } from "@/config/site";

export const metadata = {
  title: `Paiement annulé — ${site.brand}`,
};

export default function CheckoutCancelPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-24 text-center">
      <XCircle className="size-16 text-ink-400" />
      <h1 className="mt-6 font-serif text-3xl font-medium text-ink-900">
        Paiement annulé
      </h1>
      <p className="mt-3 text-ink-600">
        Aucune somme n&apos;a été débitée. Tu peux reprendre ta commande
        quand tu veux.
      </p>
      <Link
        href="/#pricing"
        className="mt-8 rounded-full bg-ink-900 px-6 py-3 text-sm font-semibold text-cream-50 transition hover:bg-rust-700"
      >
        Revenir aux offres
      </Link>
    </div>
  );
}
