import { Suspense, useRef, type ReactElement } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, MeshDistortMaterial, Sparkles } from '@react-three/drei'
import type { Group } from 'three'
import type { ProductShape } from '../../data/products'

function Bottle({ color }: { color: string }) {
  return (
    <group>
      <mesh position={[0, -0.1, 0]}>
        <cylinderGeometry args={[0.62, 0.7, 1.6, 32]} />
        <meshPhysicalMaterial color={color} roughness={0.2} metalness={0.05} clearcoat={0.6} />
      </mesh>
      <mesh position={[0, 0.95, 0]}>
        <cylinderGeometry args={[0.28, 0.4, 0.5, 32]} />
        <meshPhysicalMaterial color={color} roughness={0.2} clearcoat={0.6} />
      </mesh>
      <mesh position={[0, 1.28, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.22, 32]} />
        <meshStandardMaterial color="#3d4a3a" roughness={0.5} />
      </mesh>
    </group>
  )
}

function Jar({ color }: { color: string }) {
  return (
    <group>
      <mesh>
        <cylinderGeometry args={[0.85, 0.8, 1.1, 40]} />
        <meshPhysicalMaterial color={color} roughness={0.25} clearcoat={0.5} />
      </mesh>
      <mesh position={[0, 0.66, 0]}>
        <cylinderGeometry args={[0.88, 0.88, 0.28, 40]} />
        <meshStandardMaterial color="#f6f1e4" roughness={0.4} />
      </mesh>
    </group>
  )
}

function Ball({ color }: { color: string }) {
  return (
    <mesh>
      <sphereGeometry args={[0.95, 48, 48]} />
      <MeshDistortMaterial color={color} distort={0.15} speed={1.2} roughness={0.35} />
    </mesh>
  )
}

function Drop({ color }: { color: string }) {
  return (
    <group rotation={[Math.PI, 0, 0]}>
      <mesh position={[0, -0.3, 0]} scale={[1, 1.3, 1]}>
        <sphereGeometry args={[0.8, 40, 40]} />
        <meshPhysicalMaterial color={color} roughness={0.15} clearcoat={0.7} transmission={0.15} />
      </mesh>
      <mesh position={[0, 0.75, 0]}>
        <coneGeometry args={[0.28, 0.9, 32]} />
        <meshPhysicalMaterial color={color} roughness={0.15} clearcoat={0.7} />
      </mesh>
    </group>
  )
}

function Diffuser({ color }: { color: string }) {
  return (
    <group>
      <mesh position={[0, -0.4, 0]}>
        <cylinderGeometry args={[0.7, 0.75, 0.9, 32]} />
        <meshPhysicalMaterial color={color} roughness={0.2} clearcoat={0.5} />
      </mesh>
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.18, 0.5, 0.9, 32]} />
        <meshPhysicalMaterial color="#f6f1e4" roughness={0.3} transparent opacity={0.85} />
      </mesh>
      <mesh position={[0, 0.9, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.5, 12]} />
        <meshStandardMaterial color="#c6d7b9" roughness={0.5} />
      </mesh>
    </group>
  )
}

const SHAPES: Record<ProductShape, (props: { color: string }) => ReactElement> = {
  bottle: Bottle,
  jar: Jar,
  ball: Ball,
  drop: Drop,
  diffuser: Diffuser,
}

function Rig({ shape, color }: { shape: ProductShape; color: string }) {
  const group = useRef<Group>(null)
  const ShapeComponent = SHAPES[shape]

  useFrame((state, delta) => {
    if (!group.current) return
    group.current.rotation.y += delta * 0.35
    group.current.rotation.y += state.pointer.x * 0.002
  })

  return (
    <group ref={group}>
      <Float speed={1.5} rotationIntensity={0.25} floatIntensity={0.8}>
        <ShapeComponent color={color} />
      </Float>
    </group>
  )
}

export default function ProductScene({ shape, color }: { shape: ProductShape; color: string }) {
  return (
    <Canvas camera={{ position: [0, 0.3, 4.2], fov: 38 }} dpr={[1, 1.8]} gl={{ alpha: true }}>
      <ambientLight intensity={0.75} color="#f6f1e4" />
      <directionalLight position={[3, 4, 3]} intensity={1.5} color="#fff7ea" />
      <pointLight position={[-3, -2, -2]} intensity={0.7} color="#d97a52" />
      <pointLight position={[2, -3, 2]} intensity={0.4} color="#c6d7b9" />
      <Suspense fallback={null}>
        <Rig shape={shape} color={color} />
        <Sparkles count={30} scale={4} size={2} speed={0.25} color="#f4dca0" opacity={0.5} />
      </Suspense>
    </Canvas>
  )
}
