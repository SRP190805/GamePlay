import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import { soundManager } from '../lib/sound'

export function IntroCinematic() {
  const setMode = useGameStore(s => s.setMode)
  const [step, setStep] = useState(0)

  useEffect(() => {
    soundManager.init()
    const t1 = setTimeout(() => { setStep(1); soundManager.playTick() }, 800)
    const t2 = setTimeout(() => { setStep(2); soundManager.playSpawn() }, 2500)
    const t3 = setTimeout(() => { setStep(3) }, 4500)
    const t4 = setTimeout(() => { setStep(4); soundManager.playSuccess() }, 6500)
    const t5 = setTimeout(() => setMode('menu'), 10000)
    return () => [t1, t2, t3, t4, t5].forEach(clearTimeout)
  }, [setMode])

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden">
      <button
        onClick={() => setMode('menu')}
        className="absolute bottom-8 right-8 text-white/30 hover:text-white/70 text-[10px] uppercase tracking-[0.3em] transition-colors z-50 font-mono"
      >
        Skip →
      </button>

      {/* Particle field */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 80 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-px h-px bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: step >= 1 ? [0, Math.random() * 0.8, 0] : 0 }}
            transition={{ duration: 2 + Math.random() * 3, delay: Math.random() * 2, repeat: Infinity }}
          />
        ))}
      </div>

      {/* Big bang point */}
      <AnimatePresence>
        {step >= 1 && step < 3 && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={step === 2
              ? { opacity: [1, 0.6, 0], scale: [1, 80], filter: ['blur(0px)', 'blur(30px)'] }
              : { opacity: 1, scale: 1 }
            }
            transition={{ duration: step === 2 ? 2.5 : 1, ease: 'easeInOut' }}
            className="w-3 h-3 bg-white rounded-full shadow-[0_0_60px_30px_rgba(255,255,255,0.9)]"
          />
        )}
      </AnimatePresence>

      {/* Shockwave rings */}
      {step >= 2 && (
        <>
          {[0, 0.3, 0.6].map((delay, i) => (
            <motion.div
              key={i}
              className="absolute border border-white/20 rounded-full"
              initial={{ width: 0, height: 0, opacity: 0.8 }}
              animate={{ width: '200vw', height: '200vw', opacity: 0 }}
              transition={{ duration: 3, delay, ease: 'easeOut' }}
              style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
            />
          ))}
        </>
      )}

      {/* Color wash */}
      {step >= 2 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.4, 0.1] }}
          transition={{ duration: 3 }}
          className="absolute inset-0 bg-gradient-radial from-indigo-900/60 via-purple-900/30 to-transparent pointer-events-none"
        />
      )}

      {/* Title reveal */}
      <AnimatePresence>
        {step >= 3 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5 }}
            className="absolute text-center z-10 px-8"
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-[10px] uppercase tracking-[0.6em] text-white/30 font-mono mb-6"
            >
              Cosmic Cartography
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, letterSpacing: '0.8em' }}
              animate={{ opacity: 1, letterSpacing: '0.3em' }}
              transition={{ duration: 2, ease: 'easeOut' }}
              className="text-5xl md:text-8xl font-thin text-transparent bg-clip-text bg-gradient-to-b from-white via-white/80 to-white/20"
            >
              THE CARTOGRAPHER
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              className="mt-6 text-white/30 tracking-[0.4em] text-xs uppercase font-light"
            >
              Chart the Void. Defy Entropy.
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fade to menu */}
      {step >= 4 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2 }}
          className="absolute inset-0 bg-black pointer-events-none z-20"
        />
      )}
    </div>
  )
}
