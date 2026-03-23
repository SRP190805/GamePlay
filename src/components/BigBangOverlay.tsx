import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../store/gameStore'

// Shockwave ring — expands outward and fades
function ShockwaveRing({ delay, color, duration }: { delay: number; color: string; duration: number }) {
  return (
    <motion.div
      className="absolute rounded-full border-2 pointer-events-none"
      style={{ borderColor: color, left: '50%', top: '50%', translateX: '-50%', translateY: '-50%' }}
      initial={{ width: 0, height: 0, opacity: 0.9 }}
      animate={{ width: '300vmax', height: '300vmax', opacity: 0 }}
      transition={{ delay, duration, ease: [0.2, 0, 0.8, 1] }}
    />
  )
}

// Particle burst — radial sparks flying outward
function Particles({ count = 40 }: { count?: number }) {
  const particles = Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * 360
    const dist = 30 + Math.random() * 45
    const size = 2 + Math.random() * 4
    const delay = Math.random() * 0.3
    const dur = 0.8 + Math.random() * 0.8
    return { angle, dist, size, delay, dur }
  })

  return (
    <>
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: p.size, height: p.size,
            left: '50%', top: '50%',
            background: `hsl(${30 + Math.random() * 40}, 100%, ${70 + Math.random() * 30}%)`,
          }}
          initial={{ x: '-50%', y: '-50%', opacity: 1, scale: 1 }}
          animate={{
            x: `calc(-50% + ${Math.cos((p.angle * Math.PI) / 180) * p.dist}vw)`,
            y: `calc(-50% + ${Math.sin((p.angle * Math.PI) / 180) * p.dist}vh)`,
            opacity: 0,
            scale: 0,
          }}
          transition={{ delay: p.delay, duration: p.dur, ease: 'easeOut' }}
        />
      ))}
    </>
  )
}

export function BigBangOverlay() {
  const bigBang = useGameStore((s) => s.bigBang)
  const mode = useGameStore((s) => s.mode)
  const [phase, setPhase] = useState<'idle' | 'impact' | 'white' | 'fadeout' | 'text'>('idle')
  const timerRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const clear = () => timerRef.current.forEach(clearTimeout)

  useEffect(() => {
    if (!bigBang) { setPhase('idle'); return }

    clear()
    // Phase timeline:
    // 0ms    — impact flash (instant white)
    // 200ms  — full white hold
    // 800ms  — shockwaves + particles visible
    // 2000ms — fade to deep black
    // 2800ms — "The Universe Resets" text
    // 4500ms — store clears bigBang and restarts (handled in store)

    setPhase('impact')
    timerRef.current.push(setTimeout(() => setPhase('white'),   200))
    timerRef.current.push(setTimeout(() => setPhase('fadeout'), 1800))
    timerRef.current.push(setTimeout(() => setPhase('text'),    2600))

    return clear
  }, [bigBang])

  if (phase === 'idle') return null

  return (
    <AnimatePresence>
      <motion.div
        key="bigbang"
        className="fixed inset-0 z-[500] overflow-hidden pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Base layer — goes white on impact, then fades to black */}
        <motion.div
          className="absolute inset-0"
          animate={
            phase === 'impact' ? { backgroundColor: '#ffffff', opacity: 1 } :
            phase === 'white'  ? { backgroundColor: '#ffffff', opacity: 1 } :
            phase === 'fadeout'? { backgroundColor: '#000000', opacity: 1 } :
            phase === 'text'   ? { backgroundColor: '#000000', opacity: 1 } :
            { opacity: 0 }
          }
          transition={
            phase === 'impact'  ? { duration: 0.15, ease: 'easeIn' } :
            phase === 'white'   ? { duration: 0.05 } :
            phase === 'fadeout' ? { duration: 1.2, ease: 'easeInOut' } :
            { duration: 0.3 }
          }
        />

        {/* Shockwave rings — appear during white phase */}
        {(phase === 'white' || phase === 'fadeout') && (
          <>
            <ShockwaveRing delay={0}    color="#ffffff" duration={2.0} />
            <ShockwaveRing delay={0.15} color="#fde68a" duration={2.2} />
            <ShockwaveRing delay={0.3}  color="#f97316" duration={2.4} />
            <ShockwaveRing delay={0.5}  color="#7c3aed" duration={2.8} />
            <ShockwaveRing delay={0.7}  color="#3b82f6" duration={3.2} />
          </>
        )}

        {/* Particle burst */}
        {(phase === 'white' || phase === 'fadeout') && <Particles count={60} />}

        {/* Central glow orb */}
        {(phase === 'white' || phase === 'fadeout') && (
          <motion.div
            className="absolute rounded-full pointer-events-none"
            style={{ left: '50%', top: '50%', translateX: '-50%', translateY: '-50%',
              background: 'radial-gradient(circle, #ffffff 0%, #fde68a 30%, #f97316 60%, transparent 100%)' }}
            initial={{ width: 0, height: 0, opacity: 1 }}
            animate={{ width: '60vw', height: '60vw', opacity: 0 }}
            transition={{ duration: 1.8, ease: [0.1, 0, 0.6, 1] }}
          />
        )}

        {/* "The Universe Resets" text */}
        {phase === 'text' && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <motion.p
              className="text-white/30 text-[10px] uppercase tracking-[0.5em] font-mono mb-4"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              Catastrophic Collision
            </motion.p>
            <motion.h1
              className="text-white text-4xl font-light tracking-widest uppercase"
              initial={{ y: 20, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.8, ease: 'easeOut' }}
            >
              The Universe Resets
            </motion.h1>
            <motion.div
              className="mt-8 flex gap-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.0 }}
            >
              {[0, 1, 2].map(i => (
                <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-white/40"
                  animate={{ opacity: [0.2, 1, 0.2] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} />
              ))}
            </motion.div>
            <motion.p
              className="mt-4 text-white/30 text-xs font-mono tracking-widest"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
            >
              {mode === 'open_world' ? 'Open World' : 'Story Mode'} restarting...
            </motion.p>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
