# Zenimo

Zenimo est un site e-commerce vitrine pour des produits de bien-être naturels destinés aux chiens et chats : soins, aromathérapie, compléments alimentaires, jouets zen et accessoires.

Construit avec React, TypeScript, Vite et Tailwind CSS v4. Les animations et transitions 3D reposent sur Three.js (via React Three Fiber et Drei) pour les scènes 3D (héros animé, showcase produit, éléments décoratifs) et sur Framer Motion pour les transitions de page en perspective 3D, les tilts de cartes produits et les révélations au scroll. Le défilement fluide est assuré par Lenis.

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
