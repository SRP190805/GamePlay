import { useRef } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Stars, OrbitControls, Environment, PerspectiveCamera } from '@react-three/drei'
import { useGameStore } from '../store/gameStore'
import { CelestialBody } from './game/CelestialBody'
import * as THREE from 'three'

function SceneContent() {
  const { bodies, selectedBodyId, selectBody, mode, addBody } = useGameStore()
  const { camera } = useThree()

  const handlePlaneClick = (e: any) => {
    // Only place bodies if deselecting or in open world placement mode (handled by UI)
    // For now, clicking empty space deselects
    selectBody(null)
    
    // Logic for placement would go here if we had a "placing" state
    // For now, we will add a random body for testing if we hold Shift
    if (e.shiftKey) {
        addBody({
            type: 'star',
            x: e.point.x,
            y: e.point.y,
            z: 0,
            name: 'New Star ' + Math.floor(Math.random() * 100)
        })
    }
  }

  return (
    <>
      <ambientLight intensity={0.2} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <Stars radius={300} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      
      {/* Invisible plane for clicking background */}
      <mesh 
        position={[0, 0, -5]} 
        rotation={[0, 0, 0]} 
        onClick={handlePlaneClick}
        visible={false}
      >
        <planeGeometry args={[100, 100]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {bodies.map((body) => (
        <CelestialBody 
          key={body.id} 
          data={body} 
          isSelected={selectedBodyId === body.id} 
        />
      ))}
      
      <OrbitControls 
        enableRotate={false} 
        enableZoom={true} 
        enablePan={true} 
        mouseButtons={{
          LEFT: THREE.MOUSE.PAN,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.ROTATE
        }}
        minDistance={5}
        maxDistance={50}
      />
    </>
  )
}

export function GameView() {
  return (
    <div className="absolute inset-0 z-0 bg-black">
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 20]} />
        <SceneContent />
        {/* Postprocessing could go here: Bloom, Vignette */}
      </Canvas>
    </div>
  )
}
