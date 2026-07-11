"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { bundles } from "@/config/site";
import clsx from "clsx";

type BuyButtonProps = {
  bundleId?: string;
  label?: string;
  className?: string;
  variant?: "primary" | "secondary";
};

export function BuyButton({
  bundleId = bundles.find((b) => b.popular)?.id ?? bundles[0].id,
  label = "Commander maintenant",
  className,
  variant = "primary",
}: BuyButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bundleId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(
          "Le paiement n'est pas encore configuré (clés Stripe manquantes)."
        );
      }
    } catch {
      setError("Une erreur est survenue. Réessaie.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <motion.button
        type="button"
        onClick={handleClick}
        disabled={loading}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className={clsx(
          "inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-base font-semibold shadow-lg transition-colors disabled:opacity-70",
          variant === "primary"
            ? "bg-rose-600 text-white hover:bg-rose-700 shadow-rose-600/30"
            : "bg-white text-rose-700 hover:bg-rose-50 border border-rose-200",
          className
        )}
      >
        {loading ? <Loader2 className="size-5 animate-spin" /> : null}
        {label}
      </motion.button>
      {error ? (
        <p className="max-w-xs text-center text-xs text-rose-600">{error}</p>
      ) : null}
    </div>
  );
}
