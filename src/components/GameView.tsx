import { useRef, useEffect, Suspense, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Stars, OrbitControls, PerspectiveCamera, Loader } from '@react-three/drei'
import { useGameStore, CelestialBody as BodyType } from '../store/gameStore'
import { CelestialBody } from './game/CelestialBody'
import * as THREE from 'three'

// Helper to build hierarchy
const buildHierarchy = (bodies: BodyType[]) => {
  const rootBodies: BodyType[] = []
  const childrenMap = new Map<string, BodyType[]>()

  bodies.forEach(body => {
    if (body.parentId) {
      if (!childrenMap.has(body.parentId)) {
        childrenMap.set(body.parentId, [])
      }
      childrenMap.get(body.parentId)!.push(body)
    } else {
      rootBodies.push(body)
    }
  })

  return { rootBodies, childrenMap }
}

const RecursiveBody = ({ body, childrenMap, depth = 0 }: { body: BodyType, childrenMap: Map<string, BodyType[]>, depth?: number }) => {
  const { selectedBodyId } = useGameStore()
  const isSelected = selectedBodyId === body.id
  const groupRef = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    if (groupRef.current) {
      // Orbital Movement
      // If depth > 0 (child), position is relative to parent (0,0,0 of this group)
      // Actually, wait.
      // In Three.js, if I nest:
      // <Group ref={parent}>
      //    <Mesh />
      //    <Group ref={child} position={[x,0,0]} />
      // </Group>
      // The child position is relative.
      // So here, I need to animate the child group's position based on orbit.
      
      if (body.parentId) {
         // Calculate position based on time
         const t = clock.getElapsedTime() * (body.orbitSpeed || 0.1) + (body.orbitAngle || 0)
         const r = body.orbitRadius || 5
         const x = Math.cos(t) * r
         const z = Math.sin(t) * r
         groupRef.current.position.set(x, 0, z)
      } else {
         // Root body: Static or placed position
         groupRef.current.position.set(body.x, body.y, body.z)
      }
    }
  })

  const myChildren = childrenMap.get(body.id) || []

  return (
    <group ref={groupRef}>
      <CelestialBody data={body} isSelected={isSelected} />
      {myChildren.map(child => (
        <RecursiveBody key={child.id} body={child} childrenMap={childrenMap} depth={depth + 1} />
      ))}
    </group>
  )
}

function SceneContent() {
  const { bodies, selectedBodyId, selectBody, settings } = useGameStore()
  const controlsRef = useRef<any>(null)
  
  // Re-build hierarchy when bodies change
  const { rootBodies, childrenMap } = useMemo(() => buildHierarchy(bodies), [bodies])
  
  // Camera Target Logic
  // Since we are using hierarchical grouping, the world position of a child is dynamic.
  // We need to find the world position of the selected body to focus camera.
  // This is tricky in React without refs to every instance.
  // Alternative: Just let OrbitControls focus on (0,0,0) or last known position.
  // Or, since we have the data, we can compute the position mathematically!
  
  // Helper to compute world position from data hierarchy
  const computeWorldPosition = (id: string): THREE.Vector3 => {
     const body = bodies.find(b => b.id === id)
     if (!body) return new THREE.Vector3(0,0,0)
     
     let pos = new THREE.Vector3(0,0,0)
     
     // Recursively add parent positions (simplified, doesn't account for rotation yet if parents rotated)
     // Actually, we are using orbit based on time. 
     // We'd need the exact time state.
     // For now, let's just Focus on Center (0,0,0) if root, or just don't auto-pan aggressively.
     // User requirement: "360 camera rotation... click and hold pivot drag"
     // OrbitControls does this by default around target.
     
     // If we want to follow a moving planet, we need to update target every frame.
     return new THREE.Vector3(0,0,0) // Placeholder
  }

  // Update controls sensitivity
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.rotateSpeed = settings.motionSensitivity
      controlsRef.current.zoomSpeed = settings.motionSensitivity
      controlsRef.current.panSpeed = settings.motionSensitivity
    }
  }, [settings.motionSensitivity])

  const handlePlaneClick = (e: any) => {
    if (e.object.userData.isBackground) {
        selectBody(null)
    }
  }

  return (
    <>
      <ambientLight intensity={0.1} />
      <directionalLight position={[50, 20, 30]} intensity={1.5} castShadow />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#4c1d95" />
      
      <Stars radius={300} depth={100} count={7000} factor={4} saturation={0.5} fade speed={0.5} />
      
      {/* Invisible plane for clicking background */}
      <mesh 
        position={[0, 0, -10]} 
        rotation={[0, 0, 0]} 
        onClick={handlePlaneClick}
        visible={false}
        userData={{ isBackground: true }}
      >
        <planeGeometry args={[1000, 1000]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      <Suspense fallback={null}>
        {rootBodies.map((body) => (
           <RecursiveBody key={body.id} body={body} childrenMap={childrenMap} />
        ))}
      </Suspense>
      
      <OrbitControls 
        ref={controlsRef}
        enableRotate={true} 
        enableZoom={true} 
        enablePan={true} 
        minDistance={5}
        maxDistance={200}
        dampingFactor={0.05}
        enableDamping
      />
    </>
  )
}

export function GameView() {
  return (
    <div className="absolute inset-0 z-0 bg-black w-full h-full">
      <Canvas shadows dpr={[1, 2]} className="w-full h-full">
        <PerspectiveCamera makeDefault position={[0, 20, 40]} fov={60} />
        <SceneContent />
        <fog attach="fog" args={['#000', 30, 250]} />
      </Canvas>
      <Loader containerStyles={{ background: 'black' }} />
      
      {/* 360 Hint */}
      <div className="absolute bottom-8 left-8 z-10 pointer-events-none text-white/30 text-xs uppercase tracking-widest animate-pulse">
        Drag to Rotate 360° • Scroll to Zoom
      </div>
    </div>
  )
}
