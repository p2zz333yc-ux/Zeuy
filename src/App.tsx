import { AnimatePresence } from 'framer-motion'
import { Route, Routes, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
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

  return (
    <CartProvider>
      <Navbar />
      <main className="flex-1 overflow-hidden">
        <AnimatedRoutes />
      </main>
      <Footer />
      <CartToast />
    </CartProvider>
  )
}

export default App
