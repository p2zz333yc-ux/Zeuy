import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, MeshDistortMaterial } from '@react-three/drei'
import type { Mesh } from 'three'

function Knot({ color }: { color: string }) {
  const ref = useRef<Mesh>(null)
  useFrame((_, delta) => {
    if (!ref.current) return
    ref.current.rotation.x += delta * 0.25
    ref.current.rotation.y += delta * 0.35
  })
  return (
    <Float speed={1.6} rotationIntensity={0.6} floatIntensity={1.6}>
      <mesh ref={ref}>
        <torusKnotGeometry args={[0.85, 0.28, 128, 24]} />
        <MeshDistortMaterial color={color} distort={0.25} speed={1.2} roughness={0.2} metalness={0.2} />
      </mesh>
    </Float>
  )
}

export default function MiniOrb({ color = '#82a76c' }: { color?: string }) {
  return (
    <Canvas camera={{ position: [0, 0, 4], fov: 40 }} dpr={[1, 1.6]} gl={{ alpha: true }}>
      <ambientLight intensity={0.8} color="#f6f1e4" />
      <directionalLight position={[3, 4, 2]} intensity={1.2} color="#fff7ea" />
      <pointLight position={[-3, -2, -2]} intensity={0.6} color="#d97a52" />
      <Suspense fallback={null}>
        <Knot color={color} />
      </Suspense>
    </Canvas>
  )
}
