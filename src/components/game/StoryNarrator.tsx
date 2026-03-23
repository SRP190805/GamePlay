import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'

export function StoryNarrator() {
  const narratorMessage = useGameStore((s) => s.narratorMessage)
  const setNarrator = useGameStore((s) => s.setNarrator)
  const setNarratorDone = useGameStore((s) => s.setNarratorDone)
  const [displayed, setDisplayed] = useState('')
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const charRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!narratorMessage) {
      setVisible(false)
      return
    }
    setVisible(true)
    setDisplayed('')
    let i = 0
    if (charRef.current) clearInterval(charRef.current)
    charRef.current = setInterval(() => {
      i++
      setDisplayed(narratorMessage.slice(0, i))
      if (i >= narratorMessage.length) {
        if (charRef.current) clearInterval(charRef.current)
        setNarratorDone()
        // Auto-dismiss after 7s
        if (timerRef.current) clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => setNarrator(null), 7000)
      }
    }, 24)
    return () => {
      if (charRef.current) clearInterval(charRef.current)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [narratorMessage, setNarrator, setNarratorDone])

  return (
    <AnimatePresence>
      {visible && narratorMessage && (
        <motion.div
          key={narratorMessage}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 180, damping: 22 }}
          className="absolute bottom-20 left-6 z-30 max-w-sm"
        >
          <div className="bg-black/85 border border-indigo-500/30 rounded-2xl px-5 py-4 backdrop-blur-xl shadow-2xl">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              <span className="text-indigo-300 text-[10px] uppercase tracking-widest font-mono">Narrator</span>
            </div>
            <p className="text-white/80 text-xs leading-relaxed font-light min-h-[2.5rem]">
              {displayed}
              <span className="inline-block w-0.5 h-3 bg-indigo-400 ml-0.5 animate-pulse align-middle" />
            </p>
            <button
              onClick={() => { setNarratorDone(); setNarrator(null) }}
              className="mt-3 text-white/25 hover:text-white/60 text-[10px] uppercase tracking-wider transition-colors"
            >
              Dismiss ↵
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
