# RootRitual — site e-commerce one-product

Site e-commerce one-page pour l'applicateur d'huile de cuir chevelu 2-en-1
RootRitual (picots à billes métalliques + massage + LED rouge + fenêtre de
dosage graduée). Next.js 15 (App Router) + TypeScript + Tailwind CSS +
Framer Motion + Stripe Checkout.

## Lancer le projet en local

```bash
npm install
cp .env.example .env.local   # puis renseigne tes clés Stripe test
npm run dev
```

Le site est disponible sur [http://localhost:3000](http://localhost:3000).

```bash
npm run build   # build de production
npm run start   # sert le build de production en local
npm run lint    # ESLint
```

## Clés Stripe

1. Crée un compte sur [dashboard.stripe.com](https://dashboard.stripe.com).
2. Récupère tes clés **Test mode** dans
   [dashboard.stripe.com/test/apikeys](https://dashboard.stripe.com/test/apikeys)
   (préfixes `pk_test_...` et `sk_test_...`).
3. Copie `.env.example` vers `.env.local` et colle-les :

   ```
   STRIPE_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

4. Le bouton d'achat crée une session Stripe Checkout à la volée (prix
   définis dans `config/site.ts`, pas besoin de créer des produits dans le
   dashboard Stripe). Sans clé configurée, le bouton affiche un message
   d'erreur propre au lieu de planter.
5. Teste un paiement avec la carte de test `4242 4242 4242 4242`, une date
   future et n'importe quel CVC.
6. **Pour encaisser en vrai** : remplace les clés `pk_test_`/`sk_test_` par
   `pk_live_`/`sk_live_` **directement dans les variables d'environnement de
   ton projet Vercel** (jamais dans un fichier commité).

## Déployer sur Vercel

1. Pousse ce dépôt sur GitHub (déjà fait si tu lis ceci depuis la branche
   Claude Code).
2. Sur [vercel.com/new](https://vercel.com/new), importe le repo — Vercel
   détecte Next.js automatiquement, aucune config nécessaire.
3. Dans **Project Settings → Environment Variables**, ajoute :
   - `STRIPE_SECRET_KEY`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `NEXT_PUBLIC_SITE_URL` (l'URL finale de ton site, ex. `https://rootritual.com`)
4. Déploie. Chaque push sur la branche connectée redéploie automatiquement.

## Changer le nom de marque / les prix / les textes

Tout est centralisé dans **`config/site.ts`** : nom de marque, tagline,
sous-titre, note moyenne, garantie, et les 3 bundles (prix, libellés,
badges). Modifie ce fichier, rien d'autre à toucher pour rebrander le site.

## Où remplacer les images placeholder par tes vraies photos

- `public/images/product-hero.jpg` — visuel principal utilisé dans le Hero
  (`components/Hero.tsx`).
- `public/images/product-dosage.jpg` — visuel de la fenêtre de dosage
  utilisé dans la section Solution (`components/SolutionSection.tsx`).
- `public/og-image.png` (1200×630) — image de partage Open Graph / Twitter,
  référencée dans `app/layout.tsx`.
- Vidéos UGC : dépose tes fichiers `.mp4` dans `public/videos/` puis passe
  `src="/videos/ton-fichier.mp4"` au composant `VideoPlayer`
  (`components/VideoPlayer.tsx`), utilisé dans `SolutionSection.tsx`.
- Les images actuelles (`product-hero.jpg`, `product-dosage.jpg`,
  `og-image.png`) sont dérivées des photos produit que tu as fournies —
  recadrées et légèrement retouchées. Remplace-les par tes propres shooting
  photo / rendus 3D dès que possible pour la meilleure qualité et pour
  varier les angles (packaging, texture, contexte d'usage).

## Pages légales

`app/cgv`, `app/confidentialite`, `app/retours`, `app/mentions-legales`
contiennent des templates génériques marqués `⚠️ À compléter`. Ce sont des
points de départ, pas des textes juridiquement valides — fais-les relire
par un professionnel avant mise en ligne (voir la checklist plus bas).

## Structure

```
app/                  routes App Router (page d'accueil, checkout, pages légales, sitemap, robots)
components/           sections de la page + composants partagés (BuyButton, Reveal, VideoPlayer...)
config/site.ts         marque, prix, textes — fichier de config central
lib/stripe.ts          client Stripe côté serveur
public/images/          visuels produit
```

## Ce qu'il reste à faire manuellement

- [ ] **Clés Stripe live** (`sk_live_...` / `pk_live_...`) une fois prêt à
      vendre pour de vrai, à ajouter dans les variables d'environnement
      Vercel (jamais en clair dans le repo).
- [ ] **Nom de domaine** : acheter et connecter `rootritual.com` (ou autre)
      dans Vercel, puis mettre à jour `domain` dans `config/site.ts` et
      `NEXT_PUBLIC_SITE_URL`.
- [ ] **Vraies photos/vidéos produit** : shooting complet (packaging,
      contexte d'usage, avant/après application) pour remplacer
      `product-hero.jpg` / `product-dosage.jpg`, + vidéos UGC dans
      `public/videos/`.
- [ ] **Textes légaux définitifs** : SIRET, forme juridique, adresse,
      conditions de retour précises — à faire valider par un professionnel
      du droit (CGV, confidentialité RGPD, mentions légales).
- [ ] **Emails transactionnels** : la page de succès de commande
      (`app/checkout/success`) ne déclenche pour l'instant aucun email —
      Stripe peut envoyer un reçu automatique (à activer dans les
      paramètres Stripe) ; prévoir un email de confirmation/expédition
      côté logistique.
- [ ] **Analytics** : aucun outil de mesure (GA4, Meta Pixel, TikTok Pixel)
      n'est installé — indispensable vu que le trafic vient de TikTok/Meta.
- [ ] **Avis clients réels** : les 6 témoignages sont des placeholders
      réalistes à remplacer par de vrais avis dès qu'ils existent
      (`components/Testimonials.tsx`).
- [ ] **Compteur de stock** (`stockRemaining` dans `config/site.ts`) est
      statique — à connecter à un vrai stock ou à mettre à jour
      manuellement.
