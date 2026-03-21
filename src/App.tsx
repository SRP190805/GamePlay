import { useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { useGameStore } from './store/gameStore'
import { IntroCinematic } from './components/IntroCinematic'
import { MainMenu } from './components/MainMenu'
import { GameView } from './components/GameView'
import { UIOverlay } from './components/UIOverlay'

import { AnimatePresence, motion } from 'framer-motion'
import { ChoiceModal } from './components/game/ChoiceModal'
import { PauseMenu } from './components/PauseMenu'
import { GameOverScreen } from './components/GameOverScreen'

function App() {
  const { mode, initSession, currentEvent, togglePause, isPaused, gameOver } = useGameStore()

  useEffect(() => {
    initSession()
  }, [initSession])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (mode === 'story' || mode === 'open_world') {
           togglePause()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mode, togglePause])

  return (
    <div className="w-full h-screen bg-black overflow-hidden text-white font-sans select-none relative">
      <AnimatePresence mode="wait">
        {mode === 'intro' && (
          <motion.div 
            key="intro" 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 1 } }}
            className="absolute inset-0 z-50"
          >
            <IntroCinematic />
          </motion.div>
        )}
        
        {mode === 'menu' && (
          <motion.div 
            key="menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.5 } }} 
            className="absolute inset-0 z-40"
          >
            <MainMenu />
          </motion.div>
        )}

        {(mode === 'story' || mode === 'open_world') && (
          <motion.div 
            key="game"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 w-full h-full"
          >
            <GameView />
            <UIOverlay />
            {currentEvent && <ChoiceModal />}
            {isPaused && <PauseMenu />}
            {gameOver && <GameOverScreen />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default App
