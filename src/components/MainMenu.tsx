import { motion } from 'framer-motion'
import { Play, BookOpen, Settings } from 'lucide-react'
import { useGameStore } from '../store/gameStore'
import { Canvas } from '@react-three/fiber'
import { Stars, Float } from '@react-three/drei'

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

  const menuItems = [
    { id: 'story', label: 'Story Mode', icon: BookOpen, desc: 'A guided narrative journey through the cosmos.' },
    { id: 'open_world', label: 'Open World', icon: Play, desc: 'Forge your own universe in an infinite sandbox.' },
    { id: 'settings', label: 'Settings', icon: Settings, desc: 'Configure audio and visual preferences.' },
  ]

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-8">
      <MenuBackground />
      
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mb-16 text-center"
      >
        <h1 className="text-5xl font-light tracking-[0.2em] text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
          COSMOGENESIS
        </h1>
      </motion.div>

      <div className="grid gap-6 w-full max-w-md">
        {menuItems.map((item, index) => (
          <motion.button
            key={item.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 + index * 0.1 }}
            whileHover={{ scale: 1.02, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => item.id !== 'settings' && setMode(item.id as any)}
            className="group relative flex items-center p-6 bg-white/5 border border-white/10 backdrop-blur-sm rounded-lg overflow-hidden transition-all"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <item.icon className="w-6 h-6 mr-4 text-blue-300 group-hover:text-blue-100 transition-colors" />
            
            <div className="text-left">
              <h3 className="text-lg font-medium tracking-wide text-white group-hover:text-blue-50 transition-colors">
                {item.label}
              </h3>
              <p className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors">
                {item.desc}
              </p>
            </div>
          </motion.button>
        ))}
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
