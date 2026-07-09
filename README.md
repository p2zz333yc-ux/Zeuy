# Zenimo

Zenimo est un site e-commerce vitrine pour des produits de bien-être naturels destinés aux chiens et chats : soins, aromathérapie, compléments alimentaires, jouets zen et accessoires.

Construit avec React, TypeScript, Vite et Tailwind CSS v4. La page d'accueil est un hero plein écran (sans défilement) animé en CSS : titres « word pop », cartes latérales produit/vidéo, bandeau de trois photos avec statistiques et bouton d'appel à l'action, décliné en trois breakpoints (mobile, tablette, desktop). Les fiches produits conservent leurs scènes 3D Three.js (via React Three Fiber et Drei), les transitions de page en perspective 3D et les tilts de cartes reposent sur Framer Motion, et le défilement fluide sur Lenis. Les visuels du hero sont chargés depuis un CDN externe avec un repli SVG local automatique en cas d'indisponibilité.

## Démarrer

```bash
npm install
npm run dev
```

## Build de production

```bash
npm run build
npm run preview
```

## Structure

- `src/pages` — Accueil, Boutique, Fiche produit, Contact
- `src/components/three` — scènes Three.js (héros, showcase produit, orbe décoratif)
- `src/components` — Navbar, Footer, cartes produits (tilt 3D), transitions de page, panier (toast)
- `src/data/products.ts` — catalogue produits
- `src/context/CartContext.tsx` — état du panier (démo front-end)
