import { useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import type { ReactNode, MouseEvent } from 'react'

type TiltCardProps = {
  children: ReactNode
  className?: string
  maxTilt?: number
}

export default function TiltCard({ children, className, maxTilt = 12 }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0.5)
  const y = useMotionValue(0.5)

  const springX = useSpring(x, { stiffness: 200, damping: 20 })
  const springY = useSpring(y, { stiffness: 200, damping: 20 })

  const rotateX = useTransform(springY, [0, 1], [maxTilt, -maxTilt])
  const rotateY = useTransform(springX, [0, 1], [-maxTilt, maxTilt])
  const translateZ = useTransform(springX, () => 24)
  const glowX = useTransform(springX, [0, 1], [0, 100])
  const glowY = useTransform(springY, [0, 1], [0, 100])

  function handleMove(e: MouseEvent<HTMLDivElement>) {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    x.set((e.clientX - rect.left) / rect.width)
    y.set((e.clientY - rect.top) / rect.height)
  }

  function handleLeave() {
    x.set(0.5)
    y.set(0.5)
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={`perspective-1200 ${className ?? ''}`}
    >
      <motion.div
        className="preserve-3d relative h-full"
        style={{ rotateX, rotateY, translateZ }}
      >
        <motion.div
          className="pointer-events-none absolute -inset-px rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: useTransform(
              [glowX, glowY],
              ([gx, gy]) =>
                `radial-gradient(280px circle at ${gx}% ${gy}%, rgba(255,255,255,0.35), transparent 65%)`,
            ),
          }}
        />
        {children}
      </motion.div>
    </motion.div>
  )
}
