import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Float, MeshDistortMaterial, Sparkles } from '@react-three/drei'
import type { Mesh } from 'three'

export default function FloatingBlob() {
  const meshRef = useRef<Mesh>(null)

  useFrame((state) => {
    if (!meshRef.current) return
    meshRef.current.rotation.y = state.clock.elapsedTime * 0.15
    meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.15
  })

  return (
    <group>
      <Float speed={1.4} rotationIntensity={0.4} floatIntensity={1.2}>
        <mesh ref={meshRef} scale={1.9}>
          <icosahedronGeometry args={[1, 6]} />
          <MeshDistortMaterial
            color="#82a76c"
            attach="material"
            distort={0.4}
            speed={1.6}
            roughness={0.15}
            metalness={0.1}
            envMapIntensity={0.6}
          />
        </mesh>
      </Float>

      <Float speed={2} rotationIntensity={1} floatIntensity={2} position={[2.4, 1.1, -1]}>
        <mesh scale={0.42}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial color="#d97a52" roughness={0.25} metalness={0.15} />
        </mesh>
      </Float>

      <Float speed={1.7} rotationIntensity={1} floatIntensity={1.6} position={[-2.2, -0.8, -0.6]}>
        <mesh scale={0.3}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial color="#e9c163" roughness={0.3} metalness={0.1} />
        </mesh>
      </Float>

      <Float speed={1.2} rotationIntensity={0.8} floatIntensity={1.4} position={[1.4, -1.6, 0.4]}>
        <mesh scale={0.22}>
          <torusGeometry args={[1, 0.4, 16, 32]} />
          <meshStandardMaterial color="#f6f1e4" roughness={0.4} />
        </mesh>
      </Float>

      <Sparkles count={40} scale={6} size={2.4} speed={0.3} color="#f4dca0" opacity={0.6} />
    </group>
  )
}
