"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Play } from "lucide-react";

type VideoPlayerProps = {
  /** Chemin vers ta vidéo UGC (mp4) une fois ajoutée dans /public/videos */
  src?: string;
  poster?: string;
  className?: string;
};

// Emplacement vidéo UGC. Dépose tes fichiers dans /public/videos et passe
// `src="/videos/ton-fichier.mp4"` — sans src, affiche un placeholder.
export function VideoPlayer({ src, poster, className }: VideoPlayerProps) {
  const [playing, setPlaying] = useState(false);

  if (!src) {
    return (
      <div
        className={
          "flex aspect-[9/16] w-full max-w-xs flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-cream-50/25 bg-cream-50/5 text-center text-ink-400 " +
          (className ?? "")
        }
      >
        <Play className="size-10" />
        <p className="px-6 text-sm">
          Emplacement vidéo UGC
          <br />
          <span className="text-xs">
            ajoute /public/videos/demo.mp4 puis src=&quot;/videos/demo.mp4&quot;
          </span>
        </p>
      </div>
    );
  }

  return (
    <div
      className={
        "relative aspect-[9/16] w-full max-w-xs overflow-hidden rounded-3xl bg-black shadow-xl " +
        (className ?? "")
      }
    >
      <video
        src={src}
        poster={poster}
        className="size-full object-cover"
        controls={playing}
        playsInline
        loop
        muted
        autoPlay={playing}
        onClick={() => setPlaying(true)}
      />
      {!playing ? (
        <motion.button
          type="button"
          onClick={() => setPlaying(true)}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          className="absolute inset-0 flex items-center justify-center bg-black/20"
          aria-label="Lire la vidéo"
        >
          <span className="flex size-16 items-center justify-center rounded-full bg-cream-50/90 text-rust-600">
            <Play className="size-7 translate-x-0.5 fill-current" />
          </span>
        </motion.button>
      ) : null}
    </div>
  );
}
