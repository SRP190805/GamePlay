import { useEffect } from 'react'
import { useGameStore, BODY_COSTS, BodyType } from './store/gameStore'
import { IntroCinematic } from './components/IntroCinematic'
import { MainMenu } from './components/MainMenu'
import { GameView } from './components/GameView'
import { UIOverlay } from './components/UIOverlay'
import { AnimatePresence, motion } from 'framer-motion'
import { ChoiceModal } from './components/game/ChoiceModal'
import { PauseMenu } from './components/PauseMenu'
import { GameOverScreen } from './components/GameOverScreen'
import { StoryNarrator } from './components/game/StoryNarrator'
import { BigBangOverlay } from './components/BigBangOverlay'

const KEY_BODY_MAP: Record<string, BodyType> = {
  '1': 'star', '2': 'planet', '3': 'moon', '4': 'gas_giant',
  '5': 'black_hole', '6': 'nebula', '7': 'neutron_star',
  '8': 'comet', '9': 'pulsar',
}

const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
}

function App() {
  const { mode, initSession, currentEvent, togglePause, gameOver,
    unlockedTypes, spendCoins, setPendingPlacement, isPaused } = useGameStore()

  useEffect(() => { initSession() }, [initSession])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape — pause/unpause
      if (e.key === 'Escape' && (mode === 'story' || mode === 'open_world')) {
        togglePause()
        return
      }
      // 1–9 — quick-place body types (open world only, not paused, no modal open)
      if (mode === 'open_world' && !isPaused && KEY_BODY_MAP[e.key]) {
        const type = KEY_BODY_MAP[e.key]
        const cost = BODY_COSTS[type]
        if (!unlockedTypes.includes(type)) return
        // Dispatch a custom event so UIOverlay can handle the modal flow
        window.dispatchEvent(new CustomEvent('kbShortcutPlace', { detail: { type, cost } }))
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mode, togglePause, isPaused, unlockedTypes, spendCoins, setPendingPlacement])

  return (
    <div className="w-full h-screen bg-black overflow-hidden text-white font-sans select-none relative">
      <AnimatePresence mode="wait">
        {mode === 'intro' && (
          <motion.div key="intro" variants={pageVariants} initial="initial" animate="animate"
            exit={{ opacity: 0, transition: { duration: 1.2 } }} className="absolute inset-0 z-50">
            <IntroCinematic />
          </motion.div>
        )}

        {mode === 'menu' && (
          <motion.div key="menu" variants={pageVariants} initial="initial" animate="animate"
            exit={{ opacity: 0, transition: { duration: 0.6 } }} transition={{ duration: 0.8 }}
            className="absolute inset-0 z-40">
            <MainMenu />
          </motion.div>
        )}

        {(mode === 'story' || mode === 'open_world') && (
          <motion.div key="game" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            exit={{ opacity: 0 }} transition={{ duration: 0.8 }} className="absolute inset-0 z-10">
            <GameView />
            <UIOverlay />
            <AnimatePresence>{currentEvent && <ChoiceModal />}</AnimatePresence>
            <PauseMenu />
            {mode === 'story' && <StoryNarrator />}
            <AnimatePresence>{gameOver && <GameOverScreen />}</AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Big Bang overlay — rendered outside AnimatePresence so it persists across mode transitions */}
      <BigBangOverlay />
    </div>
  )
}

export default App
