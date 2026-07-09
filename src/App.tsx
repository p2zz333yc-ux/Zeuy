import { AnimatePresence } from 'framer-motion'
import { Route, Routes, useLocation } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import PageTransition from './components/PageTransition'
import CartToast from './components/CartToast'
import { CartProvider } from './context/CartContext'
import { useLenis } from './lib/useLenis'
import Home from './pages/Home'
import Boutique from './pages/Boutique'
import ProductDetail from './pages/ProductDetail'
import Contact from './pages/Contact'
import NotFound from './pages/NotFound'

function AnimatedRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Home /></PageTransition>} />
        <Route path="/boutique" element={<PageTransition><Boutique /></PageTransition>} />
        <Route path="/produit/:slug" element={<PageTransition><ProductDetail /></PageTransition>} />
        <Route path="/contact" element={<PageTransition><Contact /></PageTransition>} />
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  )
}

function App() {
  useLenis()
  const location = useLocation()
  const isHome = location.pathname === '/'

  return (
    <CartProvider>
      <div className={`flex flex-col ${isHome ? 'h-svh overflow-hidden bg-sage-50' : 'min-h-svh'}`}>
        <Header />
        <main className="flex flex-1 flex-col overflow-x-hidden">
          <AnimatedRoutes />
        </main>
        {!isHome && <Footer />}
        <CartToast />
      </div>
    </CartProvider>
  )
}

export default App
