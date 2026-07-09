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
  /** Photo produit (CDN) ; en son absence ou en cas d'échec de chargement, la carte affiche l'emoji animé. */
  image?: string
}

const HF_CDN = 'https://d8j0ntlcm91z4.cloudfront.net/user_3G8WFZ16pJpe7wOuL9i74mMYvEc'

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
    image: `${HF_CDN}/hf_20260709_233635_3de0d271-9c6c-4394-9cfa-f881e610b999_min.webp`,
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
    image: `${HF_CDN}/hf_20260709_233637_cf041aa0-16d3-4820-8b00-80bcbbf358e3_min.webp`,
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
    image: `${HF_CDN}/hf_20260709_233640_4645f0eb-17d0-4063-8670-a00f499d109b_min.webp`,
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
    image: `${HF_CDN}/hf_20260709_233815_4b8d7e10-4eb7-411e-8502-a9e4d615736b_min.webp`,
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
    image: `${HF_CDN}/hf_20260709_233817_4fee1dd6-f4f4-4132-86d8-8594a87f0019_min.webp`,
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
    image: `${HF_CDN}/hf_20260709_233819_25b0d787-5b10-4f15-ba48-5f5ad39c030e_min.webp`,
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
    image: `${HF_CDN}/hf_20260709_233950_dcae6c8a-73ec-4ad9-81a1-dd52e4a123db_min.webp`,
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
    id: '9',
    slug: 'maison-cosy-chat',
    image: `${HF_CDN}/hf_20260709_233436_ce3aeab3-c67a-45ba-97b2-360c247007bf_min.webp`,
    name: 'Maison Cosy pour Chat',
    category: 'Accessoires',
    price: 49.99,
    tagline: 'Un refuge douillet pour des siestes sereines',
    description:
      'Nichée dans un tissu bouclette ultra-doux, cette maison cocon offre à votre chat un refuge à sa taille où il se sent protégé. Sa structure moelleuse garde la chaleur et son coussin réversible se lave en machine.',
    benefits: ['Tissu bouclette certifié Oeko-Tex', 'Coussin réversible lavable', 'Structure stable et moelleuse'],
    color: '#a3c090',
    shape: 'jar',
    badge: 'Nouveau',
    species: ['Chat'],
  },
  {
    id: '8',
    slug: 'diffuseur-ambiance-zen',
    image: `${HF_CDN}/hf_20260709_233952_a6a5d843-7cda-45d9-ad29-140f539c155f_min.webp`,
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
