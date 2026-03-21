import { useRef, useEffect, Suspense } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Stars, OrbitControls, Environment, PerspectiveCamera, Loader } from '@react-three/drei'
import { useGameStore } from '../store/gameStore'
import { CelestialBody } from './game/CelestialBody'
import * as THREE from 'three'

function SceneContent() {
  const { bodies, selectedBodyId, selectBody, addBody } = useGameStore()
  const controlsRef = useRef<any>(null)
  
  const selectedBody = bodies.find(b => b.id === selectedBodyId)

  useEffect(() => {
    if (controlsRef.current) {
      if (selectedBody) {
        // Focus on selected body
        const target = new THREE.Vector3(selectedBody.x, selectedBody.y, selectedBody.z)
        // Smooth transition could be done with lerping in useFrame, but direct set is fine for now
        // To animate, we'd need useFrame. Let's keep it simple.
        controlsRef.current.target.copy(target)
      } else {
        // Reset to center
        controlsRef.current.target.set(0, 0, 0)
      }
    }
  }, [selectedBody])

  const handlePlaneClick = (e: any) => {
    // Only verify we clicked the background plane
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
        <planeGeometry args={[500, 500]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      <Suspense fallback={null}>
        {bodies.map((body) => (
          <CelestialBody 
            key={body.id} 
            data={body} 
            isSelected={selectedBodyId === body.id} 
          />
        ))}
      </Suspense>
      
      <OrbitControls 
        ref={controlsRef}
        enableRotate={true} 
        enableZoom={true} 
        enablePan={true} 
        mouseButtons={{
          LEFT: THREE.MOUSE.ROTATE, // User asked for "mouse click and hold" rotation (usually LEFT)
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.PAN
        }}
        minDistance={5}
        maxDistance={100}
        dampingFactor={0.05}
        enableDamping
      />
    </>
  )
}

export function GameView() {
  return (
    <div className="absolute inset-0 z-0 bg-black">
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 10, 30]} fov={60} />
        <SceneContent />
        <fog attach="fog" args={['#000', 30, 150]} />
      </Canvas>
      <Loader containerStyles={{ background: 'black' }} />
      
      {/* 360 Hint */}
      <div className="absolute bottom-8 left-8 z-10 pointer-events-none text-white/30 text-xs uppercase tracking-widest animate-pulse">
        Drag to Rotate 360° • Scroll to Zoom
      </div>
    </div>
  )
}
