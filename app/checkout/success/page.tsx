import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { site } from "@/config/site";

export const metadata = {
  title: `Commande confirmée — ${site.brand}`,
};

export default function CheckoutSuccessPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-24 text-center">
      <CheckCircle2 className="size-16 text-emerald-600" />
      <h1 className="mt-6 font-serif text-3xl font-semibold text-stone-900">
        Merci pour ta commande !
      </h1>
      <p className="mt-3 text-stone-600">
        Ton {site.brand} est en préparation. Tu vas recevoir un email de
        confirmation avec le suivi de ta livraison.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-full bg-rose-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-rose-700"
      >
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}
