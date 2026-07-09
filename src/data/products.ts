export type ProductShape = 'bottle' | 'jar' | 'ball' | 'drop' | 'diffuser'

export type Product = {
  id: string
  slug: string
  name: string
  category: string
  price: number
  tagline: string
  description: string
  benefits: string[]
  color: string
  shape: ProductShape
  badge?: string
  species: ('Chien' | 'Chat')[]
}

export const categories = [
  'Tous',
  'Soins & Toilettage',
  'Compléments',
  'Aromathérapie',
  'Jouets zen',
  'Accessoires',
] as const

export const products: Product[] = [
  {
    id: '1',
    slug: 'baume-apaisant-pattes',
    name: 'Baume Apaisant Pattes',
    category: 'Soins & Toilettage',
    price: 18.9,
    tagline: 'Protège et adoucit les coussinets',
    description:
      "Un baume onctueux à la cire d'abeille et au beurre de karité qui nourrit les coussinets fragilisés par le froid, le sable chaud ou le bitume. Application quotidienne, absorption rapide.",
    benefits: ['100% ingrédients naturels', 'Sans parfum irritant', 'Testé sous contrôle vétérinaire'],
    color: '#648a4e',
    shape: 'jar',
    badge: 'Best-seller',
    species: ['Chien', 'Chat'],
  },
  {
    id: '2',
    slug: 'huile-calme-lavande',
    name: 'Huile de Calme Lavande',
    category: 'Aromathérapie',
    price: 24.5,
    tagline: 'Apaise en quelques respirations',
    description:
      "Un mélange doux d'hydrolat de lavande vraie et de camomille romaine, formulé spécialement pour les muqueuses sensibles des animaux. Quelques gouttes sur le panier suffisent à instaurer une ambiance sereine.",
    benefits: ['Sans huiles essentielles toxiques', 'Formule vétérinaire', 'Effet calmant en 10 min'],
    color: '#d97a52',
    shape: 'drop',
    species: ['Chien', 'Chat'],
  },
  {
    id: '3',
    slug: 'complement-articulations-serenes',
    name: 'Articulations Sereines',
    category: 'Compléments',
    price: 29.9,
    tagline: 'Souplesse et confort au quotidien',
    description:
      'Glucosamine, chondroïtine et curcuma se combinent dans ces croquilles savoureuses pour soutenir la mobilité des seniors et des sportifs. Une cure de 6 semaines pour retrouver l’élan des premières promenades.',
    benefits: ['Glucosamine + curcuma', 'Recommandé dès 7 ans', 'Goût volaille irrésistible'],
    color: '#e9c163',
    shape: 'jar',
    badge: 'Nouveau',
    species: ['Chien'],
  },
  {
    id: '4',
    slug: 'shampoing-avoine-camomille',
    name: 'Shampoing Avoine & Camomille',
    category: 'Soins & Toilettage',
    price: 16.5,
    tagline: 'Un pelage doux comme un nuage',
    description:
      "Formulé sans sulfate pour les peaux réactives, ce shampoing à l'avoine colloïdale nettoie en douceur et laisse un pelage soyeux et parfumé, sans agresser le film protecteur de la peau.",
    benefits: ['pH neutre adapté aux animaux', 'Sans sulfates ni parabènes', 'Parfum léger et naturel'],
    color: '#82a76c',
    shape: 'bottle',
    species: ['Chien', 'Chat'],
  },
  {
    id: '5',
    slug: 'spray-anti-stress-voyage',
    name: 'Spray Anti-Stress Voyage',
    category: 'Aromathérapie',
    price: 21.9,
    tagline: 'Sérénité avant chaque trajet',
    description:
      'Conçu pour les trajets en voiture, les visites vétérinaires ou les feux d’artifice, ce spray aux phéromones apaisantes et à la fleur d’oranger crée une bulle de calme immédiate sur le panier ou la cage de transport.',
    benefits: ['Action en 5 minutes', 'Sans alcool', 'Flacon nomade 100ml'],
    color: '#bd5f3c',
    shape: 'bottle',
    species: ['Chien', 'Chat'],
  },
  {
    id: '6',
    slug: 'balle-massage-sensoriel',
    name: 'Balle Massage Sensoriel',
    category: 'Jouets zen',
    price: 12.9,
    tagline: 'Stimule le corps, apaise l’esprit',
    description:
      "Texturée pour masser délicatement les gencives et stimuler la motricité, cette balle en caoutchouc naturel encourage un jeu calme et concentré, idéal pour canaliser l'énergie en douceur.",
    benefits: ['Caoutchouc naturel', 'Flotte dans l’eau', 'Renforce la mâchoire en douceur'],
    color: '#f4dca0',
    shape: 'ball',
    species: ['Chien'],
  },
  {
    id: '7',
    slug: 'coussin-chauffant-lavande',
    name: 'Coussin Chauffant Lavande',
    category: 'Accessoires',
    price: 34.0,
    tagline: 'Chaleur douce, parfum apaisant',
    description:
      'Rempli de graines de lin et de fleurs de lavande séchées, ce coussin se réchauffe au micro-ondes et diffuse une chaleur enveloppante qui soulage les articulations tout en libérant un parfum relaxant.',
    benefits: ['Chauffe 30 minutes', 'Housse lavable en machine', 'Lavande de Provence'],
    color: '#4d6f3a',
    shape: 'jar',
    species: ['Chien', 'Chat'],
  },
  {
    id: '8',
    slug: 'diffuseur-ambiance-zen',
    name: 'Diffuseur Ambiance Zen',
    category: 'Accessoires',
    price: 39.9,
    tagline: 'Une maison sereine pour votre compagnon',
    description:
      'Ce diffuseur électrique libère en continu des phéromones apaisantes qui aident à réduire le marquage, les miaulements excessifs et l’anxiété de séparation. Discret et silencieux, il s’intègre dans chaque pièce.',
    benefits: ['Couvre jusqu’à 50m²', 'Recharge 30 jours incluse', 'Sans bruit, sans chaleur excessive'],
    color: '#3c582e',
    shape: 'diffuser',
    badge: 'Coup de cœur',
    species: ['Chat'],
  },
]

export const getProductBySlug = (slug: string) => products.find((p) => p.slug === slug)
