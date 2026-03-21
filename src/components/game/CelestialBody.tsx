import { useRef, useMemo, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html, Text, Float, Sparkles, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { type CelestialBody as BodyType, useGameStore } from '../../store/gameStore'
import { soundManager } from '../../lib/sound'

interface CelestialBodyProps {
  data: BodyType
  isSelected: boolean
}

// Fallback or specific textures
const TEXTURE_MAPS: Record<string, string> = {
  earth: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg',
  moon: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/moon_1024.jpg',
  mars: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/mars_1k.jpg',
  venus: 'https://upload.wikimedia.org/wikipedia/commons/e/e5/Venus-real_color.jpg', // Risky, might fail
  jupiter: 'https://upload.wikimedia.org/wikipedia/commons/e/e2/Jupiter.jpg', // Risky
}

function TexturedSphere({ type, color, size, emissive }: { type: string, color: string, size: number, emissive: number }) {
  // Attempt to load texture based on type (simplified mapping)
  let textureUrl = null
  if (type === 'planet') textureUrl = TEXTURE_MAPS.earth
  if (type === 'moon') textureUrl = TEXTURE_MAPS.moon
  if (type === 'gas_giant') textureUrl = TEXTURE_MAPS.jupiter // If fails, fallback color
  
  // Use texture if available, else color
  const props = useMemo(() => ({
      color: color,
      emissive: color,
      emissiveIntensity: emissive,
      roughness: 0.8,
      metalness: 0.2,
      map: undefined as THREE.Texture | undefined
  }), [color, emissive])

  try {
     if (textureUrl) {
       // Note: useTexture hook might suspend, need Suspense wrapper in parent
       // For safety in this environment without Suspense boundary here, we might skip
       // But let's try standard approach.
       const texture = useTexture(textureUrl)
       return (
         <meshStandardMaterial {...props} map={texture} />
       )
     }
  } catch (e) {
    // Fallback
  }

  return <meshStandardMaterial {...props} />
}


export function CelestialBody({ data, isSelected }: CelestialBodyProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const selectBody = useGameStore((state) => state.selectBody)
  const [hovered, setHover] = useState(false)
  
  // Color/Size based on type
  const { color, size, emissive, speed } = useMemo(() => {
    switch (data.type) {
      case 'star': return { color: '#fbbf24', size: 3, emissive: 2, speed: 0.1 }
      case 'planet': return { color: '#3b82f6', size: 1, emissive: 0.1, speed: 0.4 }
      case 'moon': return { color: '#9ca3af', size: 0.4, emissive: 0, speed: 1 }
      case 'gas_giant': return { color: '#d97706', size: 2.2, emissive: 0.1, speed: 0.2 }
      case 'black_hole': return { color: '#000000', size: 1.5, emissive: 0, speed: 2 }
      case 'nebula': return { color: '#8b5cf6', size: 4, emissive: 0.5, speed: 0.05 }
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
      // Use rotation speed from data if available, else fallback to type speed
      const rotSpeed = data.rotationSpeed || speed || 0.1
      meshRef.current.rotation.y += delta * rotSpeed
    }
  })

  const handleClick = (e: any) => {
    e.stopPropagation()
    soundManager.playSelect()
    selectBody(data.id)
  }

  return (
    <group> 
      {/* Position is handled by parent RecursiveBody to allow orbits */}
      {/* Selection Ring */}
      {isSelected && (
        <mesh rotation-x={Math.PI / 2}>
           <ringGeometry args={[size * 1.4, size * 1.5, 64]} />
           <meshBasicMaterial color="white" transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Main Body */}
      <Float speed={2} rotationIntensity={0.1} floatIntensity={0.1}>
        <mesh 
          ref={meshRef} 
          onClick={handleClick}
          onPointerOver={() => { setHover(true); soundManager.playHover() }}
          onPointerOut={() => setHover(false)}
          scale={hovered ? 1.05 : 1}
        >
          <sphereGeometry args={[size, 64, 64]} />
          {/* Custom Material Logic inline for simplicity without external texture loader hook issues */}
          {/* For now, just standard material with color, as useTexture requires Suspense upstream */}
          {data.type === 'black_hole' ? (
             <meshBasicMaterial color="black" />
          ) : (
             <meshStandardMaterial 
                color={color} 
                emissive={color}
                emissiveIntensity={emissive}
                roughness={0.4}
                metalness={0.6}
             />
          )}
        </mesh>
      </Float>

      {/* Accretion Disk for Black Hole */}
      {data.type === 'black_hole' && (
        <mesh rotation-x={Math.PI / 2.5}>
          <ringGeometry args={[size * 1.5, size * 3, 64]} />
          <meshBasicMaterial color="#a855f7" transparent opacity={0.4} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Atmosphere Glow for Planets */}
      {data.type === 'planet' && (
         <mesh scale={1.2}>
            <sphereGeometry args={[size, 32, 32]} />
            <meshBasicMaterial color="#60a5fa" transparent opacity={0.1} blending={THREE.AdditiveBlending} side={THREE.BackSide}/>
         </mesh>
      )}

      {/* Effects */}
      {data.type === 'star' && (
         <pointLight color={color} intensity={3} distance={50} decay={2} />
      )}
      
      {data.state === 'critical' && (
        <Sparkles count={40} scale={size * 4} size={6} speed={0.8} opacity={0.8} color="red" />
      )}

      {/* Label */}
      <Html position={[0, size + 1.5, 0]} center distanceFactor={15} style={{ pointerEvents: 'none' }}>
        <div className={`flex flex-col items-center transition-opacity duration-300 ${isSelected || hovered ? 'opacity-100' : 'opacity-60'}`}>
           <span className="text-xs text-white/90 whitespace-nowrap bg-black/60 px-3 py-1 rounded-full backdrop-blur-md border border-white/10 shadow-lg">
             {data.name}
           </span>
           {/* Mini State Bar */}
           <div className="w-16 h-1.5 bg-gray-800 mt-2 rounded-full overflow-hidden border border-white/10">
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
