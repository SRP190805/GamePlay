import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import { useState } from 'react'
import { SettingsMenu } from './SettingsMenu'
import { SaveMenu } from './SaveMenu'

export function PauseMenu() {
  const { isPaused, togglePause, setMode } = useGameStore()
  const [showSettings, setShowSettings] = useState(false)
  const [showSave, setShowSave] = useState(false)

  if (!isPaused) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-lg">
        <AnimatePresence>
          {showSettings && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <SettingsMenu onClose={() => setShowSettings(false)} />
            </div>
          )}
          {showSave && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <SaveMenu onClose={() => setShowSave(false)} initialTab="save" />
            </div>
          )}
        </AnimatePresence>

        {!showSettings && !showSave && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            className="flex flex-col gap-3 p-8 border border-white/12 rounded-2xl bg-black/95 w-72 text-center shadow-2xl"
          >
            <div className="mb-4">
              <div className="text-[9px] font-mono text-white/30 uppercase tracking-[0.4em] mb-2">The Cartographer</div>
              <h2 className="text-xl font-thin tracking-[0.3em] text-white uppercase">Paused</h2>
            </div>

            <motion.button
              whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.12)' }}
              whileTap={{ scale: 0.98 }}
              onClick={togglePause}
              className="py-3 px-6 bg-white/8 rounded-lg border border-white/8 transition-colors uppercase tracking-widest text-xs text-white"
            >
              Resume
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowSave(true)}
              className="py-3 px-6 bg-white/4 hover:bg-white/8 rounded-lg border border-white/8 transition-colors uppercase tracking-widest text-xs text-white/60"
            >
              Save / Load
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowSettings(true)}
              className="py-3 px-6 bg-white/4 hover:bg-white/8 rounded-lg border border-white/8 transition-colors uppercase tracking-widest text-xs text-white/60"
            >
              Settings
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { togglePause(); setMode('menu') }}
              className="py-3 px-6 bg-red-500/8 hover:bg-red-500/15 rounded-lg border border-red-500/15 transition-colors uppercase tracking-widest text-xs text-red-400 mt-2"
            >
              Exit to Menu
            </motion.button>
          </motion.div>
        )}
      </div>
    </AnimatePresence>
  )
}
