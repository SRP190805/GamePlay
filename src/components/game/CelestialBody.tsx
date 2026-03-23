import { useRef, useMemo, useState, useEffect, Suspense } from 'react'
import { useFrame, type RootState } from '@react-three/fiber'
import { Html, Sparkles, useTexture, Trail } from '@react-three/drei'
import * as THREE from 'three'
import { type CelestialBody as BodyData, useGameStore } from '../../store/gameStore'
import { soundManager } from '../../lib/sound'

interface Props { data: BodyData; isSelected: boolean }

// Procedural star shader — hot plasma surface
const starVertexShader = `
  varying vec3 vNormal;
  varying vec2 vUv;
  uniform float uTime;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vUv = uv;
    vec3 pos = position;
    pos += normal * sin(pos.x * 4.0 + uTime) * 0.04;
    pos += normal * cos(pos.z * 3.0 + uTime * 1.3) * 0.03;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`
const starFragmentShader = `
  varying vec3 vNormal;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec3 uColor;
  void main() {
    float noise = sin(vUv.x * 20.0 + uTime * 2.0) * cos(vUv.y * 15.0 + uTime) * 0.5 + 0.5;
    float limb = 1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0));
    vec3 col = mix(uColor, uColor * 0.4, limb * 0.7);
    col = mix(col, vec3(1.0, 0.9, 0.6), noise * 0.3);
    gl_FragColor = vec4(col, 1.0);
  }
`

// Procedural planet shader with atmosphere
const planetFragmentShader = `
  varying vec3 vNormal;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec3 uColor;
  uniform vec3 uAtmColor;
  uniform sampler2D uMap;
  uniform bool uHasMap;
  void main() {
    vec3 base = uHasMap ? texture2D(uMap, vUv).rgb : uColor;
    float fresnel = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
    vec3 atm = uAtmColor * fresnel * 1.5;
    gl_FragColor = vec4(base + atm, 1.0);
  }
`
const planetVertexShader = `
  varying vec3 vNormal;
  varying vec2 vUv;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

// Black hole shader
const blackHoleFragmentShader = `
  varying vec3 vNormal;
  varying vec2 vUv;
  uniform float uTime;
  void main() {
    vec2 uv = vUv - 0.5;
    float r = length(uv);
    float angle = atan(uv.y, uv.x) + uTime * 0.5;
    float swirl = sin(angle * 6.0 + r * 20.0 - uTime * 3.0) * 0.5 + 0.5;
    vec3 col = mix(vec3(0.0), vec3(0.4, 0.0, 0.8), swirl * (1.0 - r * 2.0));
    float edge = smoothstep(0.45, 0.5, r);
    gl_FragColor = vec4(col * (1.0 - edge), 1.0);
  }
`

function StarMesh({ size, color }: { size: number; color: string }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(color) },
  }), [color])
  useFrame(({ clock }: RootState) => { uniforms.uTime.value = clock.getElapsedTime() })
  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[size, 64, 64]} />
      <shaderMaterial vertexShader={starVertexShader} fragmentShader={starFragmentShader} uniforms={uniforms} />
    </mesh>
  )
}

function PlanetMesh({ size, color, atmColor, textureUrl }: { size: number; color: string; atmColor: string; textureUrl?: string }) {
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(color) },
    uAtmColor: { value: new THREE.Color(atmColor) },
    uMap: { value: null },
    uHasMap: { value: false },
  }), [color, atmColor])

  return (
    <Suspense fallback={
      <mesh>
        <sphereGeometry args={[size, 32, 32]} />
        <meshStandardMaterial color={color} roughness={0.7} metalness={0.1} />
      </mesh>
    }>
      {textureUrl
        ? <TexturedPlanet size={size} uniforms={uniforms} textureUrl={textureUrl} />
        : <mesh>
            <sphereGeometry args={[size, 64, 64]} />
            <shaderMaterial vertexShader={planetVertexShader} fragmentShader={planetFragmentShader} uniforms={uniforms} />
          </mesh>
      }
    </Suspense>
  )
}

function TexturedPlanet({ size, uniforms, textureUrl }: { size: number; uniforms: any; textureUrl: string }) {
  const texture = useTexture(textureUrl)
  uniforms.uMap.value = texture
  uniforms.uHasMap.value = true
  return (
    <mesh>
      <sphereGeometry args={[size, 64, 64]} />
      <shaderMaterial vertexShader={planetVertexShader} fragmentShader={planetFragmentShader} uniforms={uniforms} />
    </mesh>
  )
}

function BlackHoleMesh({ size }: { size: number }) {
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), [])
  useFrame(({ clock }: RootState) => { uniforms.uTime.value = clock.getElapsedTime() })
  return (
    <>
      <mesh>
        <sphereGeometry args={[size, 64, 64]} />
        <shaderMaterial fragmentShader={blackHoleFragmentShader}
          vertexShader={planetVertexShader} uniforms={uniforms} />
      </mesh>
      {/* Accretion disk */}
      <mesh rotation-x={Math.PI / 2.2}>
        <ringGeometry args={[size * 1.6, size * 3.5, 128]} />
        <meshBasicMaterial color="#7c3aed" transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation-x={Math.PI / 2.2} rotation-z={0.3}>
        <ringGeometry args={[size * 1.4, size * 2.0, 128]} />
        <meshBasicMaterial color="#c084fc" transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>
    </>
  )
}

function GasGiantMesh({ size, color }: { size: number; color: string }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(color) },
    uAtmColor: { value: new THREE.Color('#f97316') },
    uMap: { value: null }, uHasMap: { value: false },
  }), [color])
  useFrame(({ clock }: RootState) => { uniforms.uTime.value = clock.getElapsedTime() })
  return (
    <>
      <mesh ref={meshRef}>
        <sphereGeometry args={[size, 64, 64]} />
        <shaderMaterial vertexShader={planetVertexShader} fragmentShader={planetFragmentShader} uniforms={uniforms} />
      </mesh>
      {/* Ring system */}
      <mesh rotation-x={Math.PI / 2.5}>
        <ringGeometry args={[size * 1.3, size * 2.2, 128]} />
        <meshBasicMaterial color="#d97706" transparent opacity={0.35} side={THREE.DoubleSide} />
      </mesh>
    </>
  )
}

function NebulaMesh({ size, color }: { size: number; color: string }) {
  return (
    <>
      <mesh>
        <sphereGeometry args={[size, 32, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>
      <Sparkles count={120} scale={size * 2.5} size={4} speed={0.3} opacity={0.6} color={color} />
    </>
  )
}

function NeutronStarMesh({ size }: { size: number }) {
  const meshRef = useRef<THREE.Mesh>(null)
  useFrame(({ clock }: RootState) => {
    if (meshRef.current) meshRef.current.rotation.y = clock.getElapsedTime() * 5
  })
  return (
    <>
      <mesh ref={meshRef}>
        <sphereGeometry args={[size, 32, 32]} />
        <meshStandardMaterial color="#e0f2fe" emissive="#7dd3fc" emissiveIntensity={3} roughness={0.1} metalness={0.9} />
      </mesh>
      <Sparkles count={60} scale={size * 3} size={3} speed={1.5} opacity={0.9} color="#7dd3fc" />
    </>
  )
}

function PulsarMesh({ size }: { size: number }) {
  const beamRef = useRef<THREE.Mesh>(null)
  useFrame(({ clock }: RootState) => {
    if (beamRef.current) beamRef.current.rotation.y = clock.getElapsedTime() * 8
  })
  return (
    <>
      <mesh>
        <sphereGeometry args={[size, 32, 32]} />
        <meshStandardMaterial color="#fef9c3" emissive="#fde047" emissiveIntensity={4} />
      </mesh>
      <mesh ref={beamRef}>
        <cylinderGeometry args={[0.05, 0.05, size * 20, 8]} />
        <meshBasicMaterial color="#fde047" transparent opacity={0.4} />
      </mesh>
    </>
  )
}

function CometMesh({ size }: { size: number }) {
  return (
    <>
      <mesh>
        <sphereGeometry args={[size, 16, 16]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.9} />
      </mesh>
      <Trail width={0.3} length={8} color="#93c5fd" attenuation={(t) => t * t}>
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.01, 4, 4]} />
          <meshBasicMaterial />
        </mesh>
      </Trail>
    </>
  )
}

function WhiteDwarfMesh({ size }: { size: number }) {
  return (
    <mesh>
      <sphereGeometry args={[size, 32, 32]} />
      <meshStandardMaterial color="#f8fafc" emissive="#e2e8f0" emissiveIntensity={2} roughness={0.05} metalness={0.8} />
    </mesh>
  )
}

function SupernovaMesh({ size }: { size: number }) {
  const meshRef = useRef<THREE.Mesh>(null)
  useFrame(({ clock }: RootState) => {
    if (meshRef.current) {
      const s = 1 + Math.sin(clock.getElapsedTime() * 2) * 0.1
      meshRef.current.scale.setScalar(s)
    }
  })
  return (
    <>
      <mesh ref={meshRef}>
        <sphereGeometry args={[size, 32, 32]} />
        <meshStandardMaterial color="#fbbf24" emissive="#ef4444" emissiveIntensity={3} transparent opacity={0.9} />
      </mesh>
      <Sparkles count={200} scale={size * 4} size={8} speed={2} opacity={1} color="#fbbf24" />
    </>
  )
}

const TEXTURE_URLS: Partial<Record<string, string>> = {
  planet: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg',
  moon: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/moon_1024.jpg',
}

const BODY_CONFIG: Record<string, { color: string; atmColor: string; size: number; emissive: number }> = {
  star:         { color: '#fbbf24', atmColor: '#fde68a', size: 3.0, emissive: 3 },
  planet:       { color: '#3b82f6', atmColor: '#93c5fd', size: 1.0, emissive: 0 },
  moon:         { color: '#94a3b8', atmColor: '#cbd5e1', size: 0.4, emissive: 0 },
  gas_giant:    { color: '#d97706', atmColor: '#f97316', size: 2.2, emissive: 0 },
  black_hole:   { color: '#000000', atmColor: '#7c3aed', size: 1.5, emissive: 0 },
  nebula:       { color: '#8b5cf6', atmColor: '#a78bfa', size: 4.0, emissive: 0.5 },
  neutron_star: { color: '#e0f2fe', atmColor: '#7dd3fc', size: 0.6, emissive: 4 },
  asteroid_belt:{ color: '#78716c', atmColor: '#a8a29e', size: 0.3, emissive: 0 },
  comet:        { color: '#e2e8f0', atmColor: '#93c5fd', size: 0.3, emissive: 0 },
  pulsar:       { color: '#fef9c3', atmColor: '#fde047', size: 0.7, emissive: 4 },
  white_dwarf:  { color: '#f8fafc', atmColor: '#e2e8f0', size: 0.5, emissive: 2 },
  supernova:    { color: '#fbbf24', atmColor: '#ef4444', size: 3.5, emissive: 3 },
}

export function CelestialBody({ data, isSelected }: Props) {
  const groupRef = useRef<THREE.Group>(null)
  const selectBody = useGameStore((s) => s.selectBody)
  const mergeFlash = useGameStore((s) => s.mergeFlash)
  const [hovered, setHover] = useState(false)
  const [mergeAnim, setMergeAnim] = useState(false)
  const [mergeRingOpacity, setMergeRingOpacity] = useState(0)
  const cfg = BODY_CONFIG[data.type] || BODY_CONFIG.planet
  const baseScale = data.mergeScale ?? 1

  // Trigger merge animation when this body is the merge target
  useEffect(() => {
    if (mergeFlash === data.id) {
      setMergeAnim(true)
      setMergeRingOpacity(1)
      const fadeOut = setTimeout(() => setMergeRingOpacity(0), 600)
      const end = setTimeout(() => setMergeAnim(false), 1200)
      return () => { clearTimeout(fadeOut); clearTimeout(end) }
    }
  }, [mergeFlash, data.id])

  const stateColor = useMemo(() => {
    if (data.state === 'critical') return '#ef4444'
    if (data.state === 'stressed') return '#f59e0b'
    if (data.state === 'evolving') return '#10b981'
    return '#6ee7b7'
  }, [data.state])

  useFrame((_state: RootState, delta: number) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * (data.rotationSpeed || 0.005)
      groupRef.current.rotation.z = data.axialTilt || 0
      // Animate scale: pulse up on merge, then settle to mergeScale
      const targetScale = baseScale * (mergeAnim ? 1.35 : 1) * (hovered ? 1.06 : 1)
      groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.12)
    }
  })

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation()
    selectBody(data.id)
  }

  const handlePointerDown = (e: { stopPropagation: () => void; button: number }) => {
    e.stopPropagation()
    // Left-click drag on an already-selected root body → move mode
    if (e.button === 0 && !data.parentId) {
      window.dispatchEvent(new CustomEvent('bodyDragStart', { detail: { id: data.id } }))
    }
  }

  const renderBody = () => {
    switch (data.type) {
      case 'star':         return <StarMesh size={cfg.size} color={cfg.color} />
      case 'planet':       return <PlanetMesh size={cfg.size} color={cfg.color} atmColor={cfg.atmColor} textureUrl={TEXTURE_URLS.planet} />
      case 'moon':         return <PlanetMesh size={cfg.size} color={cfg.color} atmColor={cfg.atmColor} textureUrl={TEXTURE_URLS.moon} />
      case 'gas_giant':    return <GasGiantMesh size={cfg.size} color={cfg.color} />
      case 'black_hole':   return <BlackHoleMesh size={cfg.size} />
      case 'nebula':       return <NebulaMesh size={cfg.size} color={cfg.color} />
      case 'neutron_star': return <NeutronStarMesh size={cfg.size} />
      case 'comet':        return <CometMesh size={cfg.size} />
      case 'pulsar':       return <PulsarMesh size={cfg.size} />
      case 'white_dwarf':  return <WhiteDwarfMesh size={cfg.size} />
      case 'supernova':    return <SupernovaMesh size={cfg.size} />
      case 'asteroid_belt':return (
        <mesh>
          <sphereGeometry args={[cfg.size, 8, 8]} />
          <meshStandardMaterial color={cfg.color} roughness={1} />
        </mesh>
      )
      default: return (
        <mesh>
          <sphereGeometry args={[cfg.size, 32, 32]} />
          <meshStandardMaterial color={cfg.color} />
        </mesh>
      )
    }
  }

  return (
    <group
      ref={groupRef}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerOver={() => { setHover(true); soundManager.playHover() }}
      onPointerOut={() => setHover(false)}
    >
      {/* Selection ring */}
      {isSelected && (
        <mesh rotation-x={Math.PI / 2}>
          <ringGeometry args={[cfg.size * 1.5, cfg.size * 1.65, 128]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.7} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* State pulse ring */}
      {(data.state === 'critical' || data.state === 'stressed') && (
        <mesh rotation-x={Math.PI / 2}>
          <ringGeometry args={[cfg.size * 1.7, cfg.size * 1.8, 64]} />
          <meshBasicMaterial color={stateColor} transparent opacity={0.5} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Merge flash ring — glowing burst when body grows */}
      {mergeAnim && (
        <mesh rotation-x={Math.PI / 2}>
          <ringGeometry args={[cfg.size * 1.8, cfg.size * 2.8, 64]} />
          <meshBasicMaterial color="#facc15" transparent opacity={mergeRingOpacity} side={THREE.DoubleSide} />
        </mesh>
      )}
      {mergeAnim && (
        <Sparkles count={80} scale={cfg.size * 3.5} size={6} speed={1.5} opacity={0.9} color="#facc15" />
      )}

      {renderBody()}

      {/* Star light */}
      {data.type === 'star' && (
        <pointLight color={cfg.color} intensity={4} distance={80} decay={2} />
      )}
      {data.type === 'supernova' && (
        <pointLight color="#ef4444" intensity={6} distance={120} decay={2} />
      )}
      {data.type === 'pulsar' && (
        <pointLight color="#fde047" intensity={5} distance={60} decay={2} />
      )}

      {/* Critical sparkles */}
      {data.state === 'critical' && (
        <Sparkles count={50} scale={cfg.size * 4} size={5} speed={1.2} opacity={0.9} color="#ef4444" />
      )}
      {data.state === 'evolving' && (
        <Sparkles count={30} scale={cfg.size * 3} size={3} speed={0.6} opacity={0.7} color="#10b981" />
      )}

      {/* Merge count badge — shows how many times grown */}
      {(data.mergeCount ?? 0) > 0 && (
        <Html position={[cfg.size * baseScale + 0.5, cfg.size * baseScale + 0.5, 0]} center distanceFactor={18} style={{ pointerEvents: 'none' }}>
          <div className="text-[9px] font-mono text-yellow-300 bg-yellow-900/70 border border-yellow-500/40 rounded-full px-1.5 py-0.5 leading-none">
            ×{(data.mergeCount ?? 0) + 1}
          </div>
        </Html>
      )}

      {/* Label */}
      <Html position={[0, cfg.size * baseScale + 1.8, 0]} center distanceFactor={18} style={{ pointerEvents: 'none' }}>
        <div className={`flex flex-col items-center transition-all duration-300 ${isSelected || hovered ? 'opacity-100' : 'opacity-50'}`}>
          <span className="text-[11px] text-white/90 whitespace-nowrap bg-black/70 px-3 py-1 rounded-full backdrop-blur-md border border-white/20 shadow-lg font-mono tracking-wider">
            {data.name}
          </span>
          <div className="w-16 h-1 bg-gray-800 mt-1.5 rounded-full overflow-hidden border border-white/10">
            <div className="h-full transition-all duration-700 rounded-full"
              style={{ width: `${data.equilibrium}%`, backgroundColor: stateColor }} />
          </div>
        </div>
      </Html>
    </group>
  )
}
