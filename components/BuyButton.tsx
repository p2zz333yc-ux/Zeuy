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
          "inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-[0.95rem] font-semibold tracking-wide shadow-lg transition-colors disabled:opacity-70",
          variant === "primary"
            ? "bg-ink-900 text-cream-50 shadow-ink-900/25 hover:bg-rust-700"
            : "border border-ink-900/15 bg-cream-50 text-ink-900 hover:border-rust-500 hover:text-rust-600",
          className
        )}
      >
        {loading ? <Loader2 className="size-5 animate-spin" /> : null}
        {label}
      </motion.button>
      {error ? (
        <p className="max-w-xs text-center text-xs text-rust-600">{error}</p>
      ) : null}
    </div>
  );
}
