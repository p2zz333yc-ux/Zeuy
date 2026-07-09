import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

const variants = {
  initial: { opacity: 0, rotateY: -8, rotateX: 4, scale: 0.96, y: 40 },
  animate: { opacity: 1, rotateY: 0, rotateX: 0, scale: 1, y: 0 },
  exit: { opacity: 0, rotateY: 8, rotateX: -4, scale: 0.97, y: -30 },
}

export default function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      className="flex flex-1 flex-col"
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      style={{ transformPerspective: 1400, transformOrigin: 'center top' }}
    >
      {children}
    </motion.div>
  )
}
