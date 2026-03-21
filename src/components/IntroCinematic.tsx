import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../store/gameStore'

export function IntroCinematic() {
  const setMode = useGameStore((state) => state.setMode)
  const [step, setStep] = useState(0)

  useEffect(() => {
    const timer1 = setTimeout(() => setStep(1), 1000) // Light appears
    const timer2 = setTimeout(() => setStep(2), 3000) // Expansion
    const timer3 = setTimeout(() => setStep(3), 6000) // Text
    const timer4 = setTimeout(() => setMode('menu'), 9000) // End

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
      clearTimeout(timer4)
    }
  }, [setMode])

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-black z-50">
      <button 
        onClick={() => setMode('menu')}
        className="absolute bottom-8 right-8 text-white/50 hover:text-white text-sm uppercase tracking-widest transition-colors z-50"
      >
        Skip Intro
      </button>

      <AnimatePresence>
        {step >= 1 && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: step === 2 ? [1, 0.8, 1] : 1, 
              scale: step === 2 ? 50 : 1,
              filter: step === 2 ? 'blur(20px)' : 'blur(0px)'
            }}
            transition={{ duration: step === 2 ? 3 : 1.5, ease: "easeInOut" }}
            className="w-4 h-4 bg-white rounded-full shadow-[0_0_50px_20px_rgba(255,255,255,0.8)]"
          />
        )}
      </AnimatePresence>
      
      {step >= 2 && (
         <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-blue-900/20 to-black pointer-events-none" />
      )}

      {step >= 3 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5 }}
          className="absolute text-center z-10"
        >
          <h1 className="text-6xl md:text-8xl font-thin tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500">
            COSMOGENESIS
          </h1>
          <p className="mt-4 text-blue-200/60 tracking-widest text-sm uppercase">
            From dust, we rise
          </p>
        </motion.div>
      )}
    </div>
  )
}
