import { useRef, useMemo, useCallback, useEffect, Suspense, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Stars, OrbitControls, PerspectiveCamera, Loader } from '@react-three/drei'
import { useGameStore, CelestialBody as BodyData } from '../store/gameStore'
import { CelestialBody } from './game/CelestialBody'
import * as THREE from 'three'

// Orbit ring for a body — tilted by orbitInclination
function OrbitRing({ radius, inclination }: { radius: number; inclination: number }) {
  const { settings } = useGameStore()
  if (!settings.showOrbits || radius <= 0) return null
  return (
    <mesh rotation-x={Math.PI / 2} rotation-z={inclination}>
      <ringGeometry args={[radius - 0.04, radius + 0.04, 128]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.06} side={THREE.DoubleSide} />
    </mesh>
  )
}

// Recursive body renderer with proper Kepler orbit + orbital plane inclination
function RecursiveBody({
  body, childrenMap, depth = 0
}: {
  body: BodyData
  childrenMap: Map<string, BodyData[]>
  depth?: number
}) {
  const { selectedBodyId } = useGameStore()
  const isSelected = selectedBodyId === body.id
  // inclinationGroupRef rotates the entire orbital plane
  const inclinationGroupRef = useRef<THREE.Group>(null)
  // orbitGroupRef moves the body along the orbit within the tilted plane
  const orbitGroupRef = useRef<THREE.Group>(null)
  const worldPosRef = useRef(new THREE.Vector3())

  const inclination = body.orbitInclination ?? 0

  useFrame(({ clock }) => {
    // Apply orbital plane tilt
    if (inclinationGroupRef.current) {
      inclinationGroupRef.current.rotation.z = inclination
    }
    if (!orbitGroupRef.current) return
    if (body.parentId && body.orbitRadius > 0) {
      const t = clock.getElapsedTime() * (body.orbitSpeed || 0.05) + (body.orbitAngle || 0)
      const r = body.orbitRadius
      orbitGroupRef.current.position.set(Math.cos(t) * r, 0, Math.sin(t) * r)
    } else {
      orbitGroupRef.current.position.set(body.x, body.y, body.z)
    }
    worldPosRef.current.setFromMatrixPosition(orbitGroupRef.current.matrixWorld)
  })

  const myChildren = childrenMap.get(body.id) || []

  return (
    // Outer group: tilts the whole orbital plane
    <group ref={inclinationGroupRef}>
      <OrbitRing radius={body.orbitRadius} inclination={0} />
      {/* Inner group: moves along the orbit */}
      <group ref={orbitGroupRef}>
        <CelestialBody data={body} isSelected={isSelected} />
        {myChildren.map(child => (
          <RecursiveBody
            key={child.id}
            body={child}
            childrenMap={childrenMap}
            depth={depth + 1}
          />
        ))}
      </group>
    </group>
  )
}

// Camera zoom-to-body when narrator focuses on a body
function CameraController() {
  const narratorFocusBodyId = useGameStore((s) => s.narratorFocusBodyId)
  const bodies = useGameStore((s) => s.bodies)
  const { camera } = useThree()
  const controlsRef = useRef<any>(null)
  const targetPos = useRef(new THREE.Vector3())
  const zooming = useRef(false)
  const zoomProgress = useRef(0)
  const startCamPos = useRef(new THREE.Vector3())
  const startTarget = useRef(new THREE.Vector3())

  useEffect(() => {
    if (!narratorFocusBodyId) return
    const body = bodies.find(b => b.id === narratorFocusBodyId)
    if (!body) return
    // Approximate world position (root bodies only for simplicity)
    targetPos.current.set(body.x || 0, body.y || 0, body.z || 0)
    startCamPos.current.copy(camera.position)
    startTarget.current.set(0, 0, 0)
    zooming.current = true
    zoomProgress.current = 0
  }, [narratorFocusBodyId, bodies, camera])

  useFrame(() => {
    if (!zooming.current) return
    zoomProgress.current = Math.min(1, zoomProgress.current + 0.025)
    const t = zoomProgress.current
    const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
    const dest = targetPos.current.clone().add(new THREE.Vector3(0, 12, 20))
    camera.position.lerpVectors(startCamPos.current, dest, ease)
    if (t >= 1) zooming.current = false
  })

  return null
}

// Placement cursor — shows where you'll place the body
function PlacementCursor() {
  const { pendingPlacement } = useGameStore()
  const meshRef = useRef<THREE.Mesh>(null)
  const { raycaster, camera, gl } = useThree()
  const planeRef = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0))
  const intersectPoint = useRef(new THREE.Vector3())

  useFrame(() => {
    if (!meshRef.current || !pendingPlacement) return
    raycaster.ray.intersectPlane(planeRef.current, intersectPoint.current)
    meshRef.current.position.copy(intersectPoint.current)
  })

  if (!pendingPlacement) return null

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.5, 16, 16]} />
      <meshBasicMaterial color="#60a5fa" transparent opacity={0.5} wireframe />
    </mesh>
  )
}

// Click handler for placement
function ClickPlane() {
  const { pendingPlacement, placeBodyAt, selectBody } = useGameStore()
  const planeRef = useRef<THREE.Mesh>(null)

  const handleClick = useCallback((e: any) => {
    e.stopPropagation()
    if (pendingPlacement) {
      placeBodyAt(e.point.x, e.point.z)
    } else {
      selectBody(null)
    }
  }, [pendingPlacement, placeBodyAt, selectBody])

  return (
    <mesh ref={planeRef} rotation-x={-Math.PI / 2} position={[0, 0, 0]} onClick={handleClick} visible={false}>
      <planeGeometry args={[2000, 2000]} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  )
}

// Drag plane — active when dragging a body
function BodyDragPlane({ onMove, onEnd }: { onMove: (x: number, z: number) => void; onEnd: () => void }) {
  return (
    <mesh
      rotation-x={-Math.PI / 2}
      position={[0, 0, 0]}
      onPointerMove={(e) => { e.stopPropagation(); onMove(e.point.x, e.point.z) }}
      onPointerUp={(e) => { e.stopPropagation(); onEnd() }}
      onPointerLeave={onEnd}
      visible={false}
    >
      <planeGeometry args={[2000, 2000]} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  )
}

// Ambient nebula background particles
function NebulaBackground() {
  const count = 200
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 400
      arr[i * 3 + 1] = (Math.random() - 0.5) * 200
      arr[i * 3 + 2] = (Math.random() - 0.5) * 400
    }
    return arr
  }, [])
  const colors = useMemo(() => {
    const arr = new Float32Array(count * 3)
    const palette = [[0.5, 0.2, 0.8], [0.2, 0.4, 0.9], [0.8, 0.3, 0.5]]
    for (let i = 0; i < count; i++) {
      const c = palette[Math.floor(Math.random() * palette.length)]
      arr[i * 3] = c[0]; arr[i * 3 + 1] = c[1]; arr[i * 3 + 2] = c[2]
    }
    return arr
  }, [])
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial size={1.5} vertexColors transparent opacity={0.3} sizeAttenuation />
    </points>
  )
}

function SceneContent() {
  const { bodies, settings } = useGameStore()
  const controlsRef = useRef<any>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const { moveBody, selectedBodyId, mode } = useGameStore()

  // Expose drag state so CelestialBody can trigger it
  useEffect(() => {
    const handler = (e: Event) => {
      const { id } = (e as CustomEvent<{ id: string }>).detail
      const body = useGameStore.getState().bodies.find(b => b.id === id)
      // Only allow dragging root bodies (no parent) in open_world
      if (body && !body.parentId && mode === 'open_world') {
        setDraggingId(id)
        if (controlsRef.current) controlsRef.current.enabled = false
      }
    }
    window.addEventListener('bodyDragStart', handler)
    return () => window.removeEventListener('bodyDragStart', handler)
  }, [mode])

  const handleDragMove = useCallback((x: number, z: number) => {
    if (draggingId) moveBody(draggingId, x, z)
  }, [draggingId, moveBody])

  const handleDragEnd = useCallback(() => {
    setDraggingId(null)
    if (controlsRef.current) controlsRef.current.enabled = true
  }, [])

  const { rootBodies, childrenMap } = useMemo(() => {
    const rootBodies: BodyData[] = []
    const childrenMap = new Map<string, BodyData[]>()
    bodies.forEach(body => {
      if (body.parentId) {
        if (!childrenMap.has(body.parentId)) childrenMap.set(body.parentId, [])
        childrenMap.get(body.parentId)!.push(body)
      } else {
        rootBodies.push(body)
      }
    })
    return { rootBodies, childrenMap }
  }, [bodies])

  return (
    <>
      <ambientLight intensity={0.05} />
      <directionalLight position={[50, 30, 20]} intensity={0.8} castShadow />
      <pointLight position={[-30, -20, -30]} intensity={0.3} color="#4c1d95" />

      <Stars radius={400} depth={150} count={8000} factor={5} saturation={0.6} fade speed={0.3} />
      <NebulaBackground />

      <CameraController />
      <ClickPlane />
      <PlacementCursor />
      {draggingId && <BodyDragPlane onMove={handleDragMove} onEnd={handleDragEnd} />}

      <Suspense fallback={null}>
        {rootBodies.map(body => (
          <RecursiveBody key={body.id} body={body} childrenMap={childrenMap} />
        ))}
      </Suspense>

      <OrbitControls
        ref={controlsRef}
        enableRotate enableZoom enablePan
        minDistance={3} maxDistance={300}
        dampingFactor={0.06} enableDamping
        rotateSpeed={settings.motionSensitivity}
        zoomSpeed={settings.motionSensitivity}
        panSpeed={settings.motionSensitivity}
      />
    </>
  )
}

export function GameView() {
  return (
    <div className="absolute inset-0 z-0 bg-black w-full h-full">
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
        className="w-full h-full"
      >
        <PerspectiveCamera makeDefault position={[0, 25, 50]} fov={55} near={0.1} far={2000} />
        <fog attach="fog" args={['#000005', 80, 500]} />
        <SceneContent />
      </Canvas>
      <Loader containerStyles={{ background: 'rgba(0,0,0,0.95)' }} />
      <div className="absolute bottom-6 left-6 z-10 pointer-events-none text-white/20 text-[10px] uppercase tracking-widest">
        Drag · Rotate · Scroll to Zoom
      </div>
    </div>
  )
}
