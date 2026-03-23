import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, Compass, Settings, Info, X, Star, Lock, FolderOpen } from 'lucide-react'
import { useGameStore } from '../store/gameStore'
import { Canvas, useFrame } from '@react-three/fiber'
import { Stars, Float } from '@react-three/drei'
import { useState, useRef } from 'react'
import { SettingsMenu } from './SettingsMenu'
import { SaveMenu } from './SaveMenu'
import * as THREE from 'three'
import { soundManager } from '../lib/sound'

function RotatingOrb({ position, color, size }: { position: [number, number, number]; color: string; size: number }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.getElapsedTime() * 0.3
      ref.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.2) * 0.2
    }
  })
  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.5}>
      <mesh ref={ref} position={position}>
        <sphereGeometry args={[size, 32, 32]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} roughness={0.3} metalness={0.7} />
      </mesh>
    </Float>
  )
}

function MenuBackground() {
  return (
    <div className="absolute inset-0 -z-10 bg-black">
      <Canvas camera={{ position: [0, 0, 10], fov: 60 }}>
        <Stars radius={300} depth={60} count={6000} factor={4} saturation={0.3} fade speed={0.5} />
        <ambientLight intensity={0.3} />
        <pointLight position={[5, 5, 5]} intensity={1} color="#6366f1" />
        <pointLight position={[-5, -3, 3]} intensity={0.5} color="#8b5cf6" />
        <RotatingOrb position={[-4, 1, 0]} color="#3b82f6" size={0.8} />
        <RotatingOrb position={[4, -1, -2]} color="#8b5cf6" size={0.5} />
        <RotatingOrb position={[0, 3, -3]} color="#fbbf24" size={0.3} />
        <RotatingOrb position={[-2, -2, -1]} color="#10b981" size={0.4} />
      </Canvas>
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black/60" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />
    </div>
  )
}

export function MainMenu() {
  const { setMode, totalCreditsEarned } = useGameStore()
  const [showAbout, setShowAbout] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showSave, setShowSave] = useState(false)

  const handleStart = (mode: 'story' | 'open_world') => {
    soundManager.init()
    soundManager.playSuccess()
    setMode(mode)
  }

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-8 overflow-hidden">
      <MenuBackground />

      <AnimatePresence>
        {showSettings && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <SettingsMenu onClose={() => setShowSettings(false)} />
          </div>
        )}
        {showSave && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <SaveMenu onClose={() => setShowSave(false)} initialTab="load" />
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAbout && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-lg bg-black/95 border border-white/10 p-8 rounded-2xl shadow-2xl relative"
            >
              <button onClick={() => setShowAbout(false)} className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-3xl font-thin tracking-[0.3em] text-white mb-2 uppercase text-center">The Cartographer</h2>
              <div className="w-16 h-px bg-blue-500/60 mx-auto mb-6" />
              <p className="text-white/60 leading-relaxed mb-4 font-light text-sm text-center">
                Chart the cosmos. Shape the destiny of solar systems. Guide celestial bodies through the ages — or witness their collapse into the void.
              </p>
              <p className="text-white/40 leading-relaxed mb-6 font-light text-xs text-center">
                Every decision echoes across the universe. Every body you place obeys the laws of gravity, orbital mechanics, and stellar physics.
              </p>
              <blockquote className="text-white/30 italic font-serif text-sm text-center border-t border-white/10 pt-4">
                "The cosmos is within us. We are made of star-stuff."
              </blockquote>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 1, ease: 'easeOut' }}
        className="mb-16 text-center z-10"
      >
        <motion.div
          initial={{ opacity: 0, letterSpacing: '0.5em' }}
          animate={{ opacity: 1, letterSpacing: '0.3em' }}
          transition={{ delay: 0.5, duration: 1.5 }}
          className="text-[10px] uppercase text-white/30 tracking-[0.5em] mb-4 font-mono"
        >
          Cosmic Cartography
        </motion.div>
        <h1 className="text-5xl md:text-7xl font-thin tracking-[0.25em] text-transparent bg-clip-text bg-gradient-to-b from-white via-white/90 to-white/40 drop-shadow-[0_0_40px_rgba(255,255,255,0.2)]">
          THE CARTOGRAPHER
        </h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-4 text-white/30 tracking-[0.3em] text-xs uppercase"
        >
          Chart the Void. Defy Entropy.
        </motion.p>
        {totalCreditsEarned > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="mt-3 flex items-center justify-center gap-2 text-yellow-400/60 text-xs font-mono"
          >
            <Star className="w-3 h-3" />
            {totalCreditsEarned.toLocaleString()} total credits earned
          </motion.div>
        )}
      </motion.div>

      {/* Menu buttons */}
      <div className="grid gap-4 w-full max-w-md z-10">
        <motion.button
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
          whileHover={{ scale: 1.02, x: 4 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleStart('story')}
          className="group relative flex items-center p-6 bg-white/4 border border-white/10 backdrop-blur-sm rounded-xl overflow-hidden transition-all text-left hover:border-blue-500/40"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          <BookOpen className="w-7 h-7 mr-5 text-blue-400/70 group-hover:text-blue-300 transition-colors shrink-0" />
          <div>
            <h3 className="text-base font-light tracking-[0.15em] text-white group-hover:text-blue-50 transition-colors uppercase">
              Story Mode
            </h3>
            <p className="text-xs text-white/35 mt-1 font-light">Guided narrative · Predefined outcomes · Restricted sandbox</p>
          </div>
        </motion.button>

        <motion.button
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.85 }}
          whileHover={{ scale: 1.02, x: 4 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleStart('open_world')}
          className="group relative flex items-center p-6 bg-white/4 border border-white/10 backdrop-blur-sm rounded-xl overflow-hidden transition-all text-left hover:border-purple-500/40"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          <Compass className="w-7 h-7 mr-5 text-purple-400/70 group-hover:text-purple-300 transition-colors shrink-0" />
          <div>
            <h3 className="text-base font-light tracking-[0.15em] text-white group-hover:text-purple-50 transition-colors uppercase">
              Open World
            </h3>
            <p className="text-xs text-white/35 mt-1 font-light">Infinite canvas · Click to place · Name your worlds</p>
          </div>
        </motion.button>

        <div className="grid grid-cols-3 gap-3">
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowSettings(true)}
            className="flex flex-col items-center justify-center p-4 bg-white/4 hover:bg-white/8 border border-white/10 hover:border-white/20 rounded-xl transition-all"
          >
            <Settings className="w-5 h-5 text-white/50 mb-2" />
            <span className="text-[10px] uppercase tracking-widest text-white/50">Settings</span>
          </motion.button>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.05 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowSave(true)}
            className="flex flex-col items-center justify-center p-4 bg-white/4 hover:bg-white/8 border border-white/10 hover:border-green-500/30 rounded-xl transition-all"
          >
            <FolderOpen className="w-5 h-5 text-green-400/60 mb-2" />
            <span className="text-[10px] uppercase tracking-widest text-white/50">Load Save</span>
          </motion.button>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowAbout(true)}
            className="flex flex-col items-center justify-center p-4 bg-white/4 hover:bg-white/8 border border-white/10 hover:border-white/20 rounded-xl transition-all"
          >
            <Info className="w-5 h-5 text-white/50 mb-2" />
            <span className="text-[10px] uppercase tracking-widest text-white/50">About</span>
          </motion.button>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8 }}
        className="absolute bottom-6 text-[9px] text-white/15 tracking-[0.3em] uppercase font-mono"
      >
        The Cartographer · v2.0
      </motion.div>
    </div>
  )
}
