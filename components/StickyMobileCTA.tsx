"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BuyButton } from "@/components/BuyButton";
import { bundles, site } from "@/config/site";

export function StickyMobileCTA() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > window.innerHeight * 0.7);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const popular = bundles.find((b) => b.popular) ?? bundles[0];

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-between gap-3 border-t border-ink-900/10 bg-cream-50/95 px-4 py-3 shadow-[0_-4px_16px_rgba(36,26,18,0.08)] backdrop-blur sm:hidden"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          <div className="leading-tight">
            <p className="font-serif text-sm font-medium text-ink-900">
              {site.brand}
            </p>
            <p className="text-xs text-ink-500">
              {popular.price.toFixed(2).replace(".", ",")}
              {site.currencySymbol} · {popular.label}
            </p>
          </div>
          <BuyButton
            bundleId={popular.id}
            label="Commander"
            className="px-5 py-3 text-sm"
          />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
