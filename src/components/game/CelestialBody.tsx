import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html, Text, Float, Sparkles } from '@react-three/drei'
import * as THREE from 'three'
import { type CelestialBody as BodyType, useGameStore } from '../../store/gameStore'

interface CelestialBodyProps {
  data: BodyType
  isSelected: boolean
}

export function CelestialBody({ data, isSelected }: CelestialBodyProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const selectBody = useGameStore((state) => state.selectBody)
  
  // Color/Size based on type
  const { color, size, emissive, speed } = useMemo(() => {
    switch (data.type) {
      case 'star': return { color: '#fbbf24', size: 2, emissive: 2, speed: 0.2 }
      case 'planet': return { color: '#3b82f6', size: 1, emissive: 0.2, speed: 0.5 }
      case 'moon': return { color: '#9ca3af', size: 0.4, emissive: 0, speed: 1 }
      case 'gas_giant': return { color: '#d97706', size: 1.8, emissive: 0.1, speed: 0.3 }
      case 'black_hole': return { color: '#000000', size: 1.5, emissive: 0, speed: 2 }
      case 'nebula': return { color: '#8b5cf6', size: 3, emissive: 0.5, speed: 0.1 }
      default: return { color: 'white', size: 1, emissive: 0, speed: 1 }
    }
  }, [data.type])

  // State-based visual feedback
  const stateColor = useMemo(() => {
    if (data.state === 'critical') return '#ef4444' // Red
    if (data.state === 'stressed') return '#f59e0b' // Orange
    if (data.state === 'evolving') return '#10b981' // Green
    return '#ffffff' // White/Normal
  }, [data.state])

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * speed
    }
  })

  return (
    <group position={[data.x, data.y, data.z]}>
      {/* Selection Ring */}
      {isSelected && (
        <mesh rotation-x={Math.PI / 2}>
           <ringGeometry args={[size * 1.2, size * 1.3, 32]} />
           <meshBasicMaterial color="white" transparent opacity={0.5} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Main Body */}
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.2}>
        <mesh 
          ref={meshRef} 
          onClick={(e) => {
            e.stopPropagation()
            selectBody(data.id)
          }}
          onPointerOver={() => document.body.style.cursor = 'pointer'}
          onPointerOut={() => document.body.style.cursor = 'auto'}
        >
          <sphereGeometry args={[size, 32, 32]} />
          <meshStandardMaterial 
            color={color} 
            emissive={color}
            emissiveIntensity={emissive}
            roughness={0.4}
            metalness={0.6}
          />
        </mesh>
      </Float>

      {/* Effects */}
      {data.type === 'star' && (
         <pointLight color={color} intensity={2} distance={10} decay={2} />
      )}
      
      {data.state === 'critical' && (
        <Sparkles count={20} scale={size * 3} size={4} speed={0.4} opacity={0.5} color="red" />
      )}

      {/* Label */}
      <Html position={[0, size + 0.5, 0]} center distanceFactor={10} style={{ pointerEvents: 'none' }}>
        <div className="flex flex-col items-center">
           <span className="text-xs text-white/80 whitespace-nowrap bg-black/50 px-2 py-0.5 rounded backdrop-blur-sm">
             {data.name}
           </span>
           {/* Mini State Bar */}
           <div className="w-12 h-1 bg-gray-700 mt-1 rounded-full overflow-hidden">
             <div 
               className="h-full transition-all duration-500"
               style={{ 
                 width: `${data.equilibrium}%`,
                 backgroundColor: stateColor 
               }} 
             />
           </div>
        </div>
      </Html>
    </group>
  )
}
