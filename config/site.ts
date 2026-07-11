// Fichier de config central. Change le nom de marque, les prix ou les textes ici :
// tout le site (metadata, Stripe, sections) lit ces valeurs.

export const site = {
  brand: "RootRitual",
  legalName: "RootRitual SAS",
  domain: "rootritual.com",
  tagline: "L'huile aux racines. Pas sur tes mains.",
  subtitle:
    "L'applicateur 2-en-1 qui dépose ton huile précisément aux racines et masse ton cuir chevelu en même temps. Zéro gaspillage, zéro mains grasses.",
  productName: "L'Applicateur RootRitual",
  currency: "EUR",
  currencySymbol: "€",
  supportEmail: "contact@rootritual.com",
  instagram: "https://instagram.com",
  tiktok: "https://tiktok.com",
  rating: {
    value: 4.8,
    count: 1247,
  },
  freeShipping: true,
  guaranteeDays: 30,
} as const;

export type Bundle = {
  id: string;
  units: number;
  label: string;
  price: number;
  compareAtPrice?: number;
  badge?: string;
  popular?: boolean;
  description: string;
  stripePriceLabel: string;
};

export const bundles: Bundle[] = [
  {
    id: "bundle-1",
    units: 1,
    label: "Découverte",
    price: 29.99,
    compareAtPrice: 39.99,
    description: "1 applicateur RootRitual",
    stripePriceLabel: "RootRitual — 1 applicateur",
  },
  {
    id: "bundle-2",
    units: 2,
    label: "Duo",
    price: 49.99,
    compareAtPrice: 79.98,
    badge: "Le plus populaire",
    popular: true,
    description: "2 applicateurs RootRitual — toi + un proche",
    stripePriceLabel: "RootRitual — 2 applicateurs",
  },
  {
    id: "bundle-3",
    units: 3,
    label: "Rituel complet",
    price: 64.99,
    compareAtPrice: 119.97,
    badge: "Meilleure valeur",
    description: "3 applicateurs RootRitual — famille ou cadeaux",
    stripePriceLabel: "RootRitual — 3 applicateurs",
  },
];

export const stockRemaining = 34; // compteur de stock discret, à mettre à jour manuellement
