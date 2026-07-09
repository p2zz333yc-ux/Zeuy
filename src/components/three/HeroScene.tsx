import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import FloatingBlob from './FloatingBlob'

function Rig() {
  const group = useRef<Group>(null)

  useFrame((state) => {
    if (!group.current) return
    const targetY = state.pointer.x * 0.35
    const targetX = -state.pointer.y * 0.2
    group.current.rotation.y += (targetY - group.current.rotation.y) * 0.04
    group.current.rotation.x += (targetX - group.current.rotation.x) * 0.04
  })

  return (
    <group ref={group}>
      <FloatingBlob />
    </group>
  )
}

export default function HeroScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 6.2], fov: 42 }}
      dpr={[1, 1.8]}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.7} color="#f6f1e4" />
      <directionalLight position={[4, 5, 3]} intensity={1.4} color="#fff7ea" />
      <pointLight position={[-4, -2, -3]} intensity={0.8} color="#e6976f" />
      <pointLight position={[3, -3, 2]} intensity={0.5} color="#c6d7b9" />
      <Suspense fallback={null}>
        <Rig />
      </Suspense>
    </Canvas>
  )
}
