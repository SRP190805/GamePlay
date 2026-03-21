import { motion, AnimatePresence } from 'framer-motion'
import { Play, BookOpen, Settings, Info, X } from 'lucide-react'
import { useGameStore } from '../store/gameStore'
import { Canvas } from '@react-three/fiber'
import { Stars, Float } from '@react-three/drei'
import { useState } from 'react'
import { SettingsMenu } from './SettingsMenu'

function MenuBackground() {
  return (
    <div className="absolute inset-0 -z-10 bg-black">
      <Canvas camera={{ position: [0, 0, 1] }}>
        <Stars radius={300} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        <ambientLight intensity={0.5} />
        <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
            {/* Can add floating geometric shapes or debris here later */}
        </Float>
      </Canvas>
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/50" />
    </div>
  )
}

export function MainMenu() {
  const setMode = useGameStore((state) => state.setMode)
  const [showAbout, setShowAbout] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const handleStart = (mode: 'story' | 'open_world') => {
      setMode(mode)
  }

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-8 overflow-hidden">
      <MenuBackground />
      
      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                <SettingsMenu onClose={() => setShowSettings(false)} />
            </div>
        )}
      </AnimatePresence>

      {/* About Modal */}
      <AnimatePresence>
        {showAbout && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
             <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.9, opacity: 0 }}
               className="w-full max-w-lg bg-zinc-900 border border-white/10 p-8 rounded-2xl shadow-2xl relative text-center"
             >
               <button onClick={() => setShowAbout(false)} className="absolute top-4 right-4 text-white/50 hover:text-white">
                 <X className="w-6 h-6" />
               </button>
               <h2 className="text-3xl font-light tracking-[0.2em] text-white mb-4 uppercase">Cosmogenesis</h2>
               <div className="w-24 h-px bg-blue-500 mx-auto mb-8" />
               <p className="text-white/70 leading-relaxed mb-6 font-light">
                 An immersive space simulation where you shape the destiny of the cosmos. Nurture stars, forge planets, and guide your system through the ages or witness its collapse into the void.
               </p>
               <blockquote className="text-white/40 italic font-serif text-lg mb-8">
                 "We are made of starstuff."
               </blockquote>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mb-16 text-center z-10"
      >
        <h1 className="text-5xl md:text-7xl font-light tracking-[0.2em] text-white drop-shadow-[0_0_25px_rgba(255,255,255,0.3)]">
          COSMOGENESIS
        </h1>
        <p className="mt-4 text-white/40 tracking-widest text-sm uppercase">
            Sculpt the Void. Defy Entropy.
        </p>
      </motion.div>

      <div className="grid gap-6 w-full max-w-md z-10">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
            whileHover={{ scale: 1.02, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleStart('story')}
            className="group relative flex items-center p-6 bg-white/5 border border-white/10 backdrop-blur-sm rounded-lg overflow-hidden transition-all text-left"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <BookOpen className="w-8 h-8 mr-6 text-blue-300 group-hover:text-blue-100 transition-colors shrink-0" />
            <div>
              <h3 className="text-xl font-medium tracking-wide text-white group-hover:text-blue-50 transition-colors uppercase">
                Story Mode
              </h3>
              <p className="text-xs text-white/50 mt-1">Guided survival. Protect Sol Prime.</p>
            </div>
          </motion.button>

          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.9 }}
            whileHover={{ scale: 1.02, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleStart('open_world')}
            className="group relative flex items-center p-6 bg-white/5 border border-white/10 backdrop-blur-sm rounded-lg overflow-hidden transition-all text-left"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <Play className="w-8 h-8 mr-6 text-purple-300 group-hover:text-purple-100 transition-colors shrink-0" />
            <div>
              <h3 className="text-xl font-medium tracking-wide text-white group-hover:text-purple-50 transition-colors uppercase">
                Open World
              </h3>
              <p className="text-xs text-white/50 mt-1">Infinite canvas. Create freely.</p>
            </div>
          </motion.button>

          <div className="grid grid-cols-2 gap-4">
            <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0 }}
                onClick={() => setShowSettings(true)}
                className="flex flex-col items-center justify-center p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all"
            >
                <Settings className="w-6 h-6 text-white/70 mb-2" />
                <span className="text-xs uppercase tracking-wider text-white/70">Settings</span>
            </motion.button>
            
            <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1 }}
                onClick={() => setShowAbout(true)}
                className="flex flex-col items-center justify-center p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all"
            >
                <Info className="w-6 h-6 text-white/70 mb-2" />
                <span className="text-xs uppercase tracking-wider text-white/70">About</span>
            </motion.button>
          </div>
      </div>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 text-xs text-gray-600 tracking-widest"
      >
        VERSION 1.0.0
      </motion.div>
    </div>
  )
}
