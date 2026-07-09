import { ArrowRight, ArrowUpRight, Play, Plus, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import SafeImg from '../components/SafeImg'

const ASSETS = {
  avatar: 'https://polo-pecan-73837341.figma.site/_assets/v11/e62173d41f91350a59628e8a9a55ae078a886fb9.png?w=128',
  product: 'https://polo-pecan-73837341.figma.site/_assets/v11/3e5158dad63d392ade022e81890edc9f54d750bc.png',
  video: 'https://polo-pecan-73837341.figma.site/_assets/v11/76be6ec3a93a703b15e9cc01e764a4e3f9d7d2c0.png',
  bottomLeft: 'https://polo-pecan-73837341.figma.site/_assets/v11/8d44b25186ef45a5789c74668fb781cea4e1ff49.png',
  bottomCenter: 'https://polo-pecan-73837341.figma.site/_assets/v11/96745c4e72ad5c5208e53a885df797fd82cd854a.png?h=1024',
  bottomRight: 'https://polo-pecan-73837341.figma.site/_assets/v11/81bd2e7a66b58f3d8f3ad78fd1ebf01af8dfdee1.png',
}

const FALLBACKS = {
  avatar: '/fallbacks/avatar.svg',
  product: '/fallbacks/product.svg',
  video: '/fallbacks/video.svg',
  bottomLeft: '/fallbacks/bottom-left.svg',
  bottomCenter: '/fallbacks/bottom-center.svg',
  bottomRight: '/fallbacks/bottom-right.svg',
}

const LINE_1 = [
  { word: 'Tout', delay: 'delay-200' },
  { word: 'ce', delay: 'delay-300' },
  { word: 'que', delay: 'delay-400' },
]
const LINE_2 = [
  { word: 'vos', delay: 'delay-400' },
  { word: 'animaux', delay: 'delay-500' },
  { word: 'adorent', delay: 'delay-600', accent: true },
]

function HeroHeadingWords({ words }: { words: typeof LINE_1 }) {
  return (
    <>
      {words.map(({ word, delay, accent }: (typeof LINE_2)[number]) => (
        <span key={word} className={`inline-block animate-word-pop ${delay} ${accent ? 'text-clay-500' : ''}`}>
          {word}
        </span>
      ))}
    </>
  )
}

function ProductMiniCard({ compact = false }: { compact?: boolean }) {
  return (
    <div className="group">
      <div
        className="relative overflow-hidden rounded-2xl shadow-card"
        style={{ aspectRatio: compact ? '1/1' : '260/257' }}
      >
        <SafeImg src={ASSETS.product} fallback={FALLBACKS.product} alt="Maison Cosy pour Chat" className="h-full w-full object-cover" />
        <Link
          to="/produit/maison-cosy-chat"
          aria-label="Voir la Maison Cosy pour Chat"
          className="absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-full bg-sage-800 text-white transition-all hover:scale-110 hover:bg-sage-700"
        >
          <ArrowUpRight size={16} />
        </Link>
      </div>
      <p className="mt-2 text-gray-700" style={{ fontSize: 'clamp(12px, 1vw, 15px)' }}>
        Maison Cosy pour Chat
      </p>
      <p className="font-semibold text-sage-800" style={{ fontSize: 'clamp(13px, 1.1vw, 17px)' }}>
        49,99 €
      </p>
    </div>
  )
}

function VideoMiniCard({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl shadow-card"
      style={{ aspectRatio: compact ? '3/4' : '177/287' }}
    >
      <SafeImg src={ASSETS.video} fallback={FALLBACKS.video} alt="Avis produits en vidéo" className="h-full w-full object-cover" />
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-2 bg-gradient-to-t from-sage-900/70 to-transparent px-3 pb-3 pt-10 text-center">
        <button
          aria-label="Lire la vidéo"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-sage-800 text-white transition-transform hover:scale-110"
        >
          <Play size={15} fill="currentColor" className="ml-0.5" />
        </button>
        <p className="text-[11px] font-medium leading-snug text-white drop-shadow">
          Découvrez nos rituels en vidéo sur TikTok et YouTube
        </p>
      </div>
    </div>
  )
}

function StatVisitors({ light = true }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center">
        <SafeImg
          src={ASSETS.avatar}
          fallback={FALLBACKS.avatar}
          alt=""
          className={`h-9 w-9 rounded-full border-2 object-cover ${light ? 'border-white' : 'border-sage-50'}`}
        />
        <span
          className={`-ml-2.5 flex h-9 w-9 items-center justify-center rounded-full border-2 bg-sage-600 text-white ${
            light ? 'border-white' : 'border-sage-50'
          }`}
        >
          <Plus size={14} />
        </span>
      </div>
      <div className={light ? 'text-white drop-shadow-md' : 'text-ink'}>
        <p className="font-serif-display text-xl leading-none sm:text-2xl">98K+</p>
        <p className={`text-[11px] font-medium ${light ? 'text-white/85' : 'text-ink-soft'}`}>compagnons heureux</p>
      </div>
    </div>
  )
}

function StatRating({ light = true }: { light?: boolean }) {
  return (
    <div className={`flex items-center gap-2 ${light ? 'text-white drop-shadow-md' : 'text-ink'}`}>
      <Star size={20} className="text-clay-400" fill="currentColor" stroke="none" />
      <p className="font-serif-display text-xl leading-none sm:text-2xl">4.6</p>
    </div>
  )
}

function BottomImages({ maxHeights }: { maxHeights?: [string, string, string] }) {
  return (
    <div className="flex w-full items-end">
      <div className="relative flex-1 animate-photo-reveal delay-700">
        <SafeImg
          src={ASSETS.bottomLeft}
          fallback={FALLBACKS.bottomLeft}
          alt="Chien détendu"
          className="block h-auto w-full object-cover"
          style={maxHeights ? { maxHeight: maxHeights[0] } : undefined}
        />
        <div
          className="absolute animate-scale-in delay-1000"
          style={{ bottom: 'clamp(20px, 4vh, 50px)', left: 'clamp(16px, 2.5vw, 40px)' }}
        >
          <StatVisitors />
        </div>
      </div>

      <div className="relative flex-[1.265] animate-photo-reveal delay-600">
        <SafeImg
          src={ASSETS.bottomCenter}
          fallback={FALLBACKS.bottomCenter}
          alt="Chat serein"
          className="block h-auto w-full object-cover"
          style={maxHeights ? { maxHeight: maxHeights[1] } : undefined}
        />
        <div
          className="absolute inset-x-3 flex animate-scale-in flex-col items-center gap-3 text-center delay-1100 sm:gap-4"
          style={{ bottom: 'clamp(20px, 4vh, 50px)' }}
        >
          <h2
            className="font-serif-display leading-tight text-white drop-shadow-md"
            style={{ fontSize: 'clamp(18px, 2.2vw, 34px)' }}
          >
            Les meilleurs produits
            <br />
            pour votre compagnon
          </h2>
          <Link
            to="/boutique"
            className="flex items-center gap-2 rounded-full bg-clay-500 px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition-all hover:-translate-y-0.5 hover:bg-clay-600"
          >
            Explorer la boutique
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>

      <div className="relative flex-1 animate-photo-reveal delay-800">
        <SafeImg
          src={ASSETS.bottomRight}
          fallback={FALLBACKS.bottomRight}
          alt="Chiot joueur"
          className="block h-auto w-full object-cover"
          style={maxHeights ? { maxHeight: maxHeights[2] } : undefined}
        />
        <div
          className="absolute animate-scale-in delay-1200"
          style={{ bottom: 'clamp(20px, 4vh, 50px)', right: 'clamp(16px, 2.5vw, 40px)' }}
        >
          <StatRating />
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <section className="relative flex flex-1 flex-col overflow-hidden bg-sage-50">
      {/* ── Desktop (lg+) ─────────────────────────────── */}
      <div className="relative hidden flex-1 lg:block">
        <div className="relative z-[5] px-12 pt-[5.4rem] text-center">
          <h1
            className="font-serif-display tracking-tight text-sage-800"
            style={{ fontSize: 'clamp(60px, 7.5vw, 110px)', lineHeight: 0.95 }}
          >
            <span className="block space-x-[0.22em]">
              <HeroHeadingWords words={LINE_1} />
            </span>
            <span className="block space-x-[0.22em]">
              <HeroHeadingWords words={LINE_2} />
            </span>
          </h1>
        </div>

        <div
          className="absolute left-12 top-[50px] z-20 animate-slide-in-left delay-600"
          style={{ width: 'clamp(160px, 14vw, 260px)' }}
        >
          <ProductMiniCard />
        </div>

        <div
          className="absolute right-12 top-[50px] z-20 animate-slide-in-right delay-700"
          style={{ width: 'clamp(120px, 10vw, 177px)' }}
        >
          <VideoMiniCard />
        </div>

        <div className="absolute bottom-0 left-0 right-0 z-10">
          <BottomImages maxHeights={['min(70vh, 55vw)', 'min(85vh, 70vw)', 'min(70vh, 55vw)']} />
        </div>
      </div>

      {/* ── Tablet (md → lg) ──────────────────────────── */}
      <div className="relative hidden flex-1 md:block lg:hidden">
        <div className="relative z-[5] px-48 pt-16 text-center">
          <h1 className="font-serif-display text-6xl tracking-tight text-sage-800" style={{ lineHeight: 0.98 }}>
            <span className="block space-x-[0.22em]">
              <HeroHeadingWords words={LINE_1} />
            </span>
            <span className="block space-x-[0.22em]">
              <HeroHeadingWords words={LINE_2} />
            </span>
          </h1>
        </div>

        <div className="absolute left-4 top-[80px] z-20 w-[160px] animate-slide-in-left delay-600">
          <ProductMiniCard />
        </div>

        <div className="absolute right-4 top-[80px] z-20 w-[120px] animate-slide-in-right delay-700">
          <VideoMiniCard />
        </div>

        <div className="absolute bottom-0 left-0 right-0 z-10">
          <BottomImages maxHeights={['60vh', '75vh', '60vh']} />
        </div>
      </div>

      {/* ── Mobile (< md) ─────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden md:hidden">
        <div className="px-4 pt-3 text-center">
          <h1 className="font-serif-display text-[36px] leading-[1.02] tracking-tight text-sage-800">
            <span className="block space-x-[0.22em]">
              <HeroHeadingWords words={LINE_1} />
            </span>
            <span className="block space-x-[0.22em]">
              <HeroHeadingWords words={LINE_2} />
            </span>
          </h1>
          <p className="mt-2 animate-fade-up text-sm text-ink-soft delay-500">
            Soins naturels, aromathérapie douce et accessoires zen pour chiens et chats.
          </p>
          <Link
            to="/boutique"
            className="mt-3 inline-flex animate-fade-up items-center gap-2 rounded-full bg-clay-500 px-5 py-2.5 text-sm font-semibold text-white delay-600"
          >
            Explorer la boutique
            <ArrowRight size={15} />
          </Link>
        </div>

        <div className="mt-4 flex gap-3 px-4">
          <div className="flex-1 animate-slide-in-left delay-700">
            <ProductMiniCard compact />
          </div>
          <div className="flex-1 animate-slide-in-right delay-800">
            <VideoMiniCard compact />
          </div>
        </div>

        <div className="mt-4 flex animate-fade-up items-center justify-between px-5 delay-900">
          <StatVisitors light={false} />
          <span className="h-8 w-px bg-sage-200" />
          <StatRating light={false} />
        </div>

        <div className="mt-auto flex items-end pt-4">
          <div className="flex-1 animate-photo-reveal delay-800">
            <SafeImg src={ASSETS.bottomLeft} fallback={FALLBACKS.bottomLeft} alt="Chien détendu" className="block h-auto w-full" />
          </div>
          <div className="flex-[1.265] animate-photo-reveal delay-700">
            <SafeImg src={ASSETS.bottomCenter} fallback={FALLBACKS.bottomCenter} alt="Chat serein" className="block h-auto w-full" />
          </div>
          <div className="flex-1 animate-photo-reveal delay-900">
            <SafeImg src={ASSETS.bottomRight} fallback={FALLBACKS.bottomRight} alt="Chiot joueur" className="block h-auto w-full" />
          </div>
        </div>
      </div>
    </section>
  )
}
