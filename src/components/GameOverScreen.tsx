import { motion } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import { RefreshCcw } from 'lucide-react'

export function GameOverScreen() {
  const { gameOver, restartGame } = useGameStore()

  if (!gameOver) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-lg">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-lg p-8 border border-red-500/30 rounded-2xl bg-black shadow-[0_0_100px_rgba(239,68,68,0.2)]"
      >
        <h1 className="text-5xl font-light text-red-500 tracking-[0.2em] mb-2 uppercase">
          Terminated
        </h1>
        <div className="w-24 h-1 bg-red-500 mx-auto mb-8" />
        
        <p className="text-xl text-white/80 font-light mb-8 leading-relaxed">
          {gameOver.reason}
        </p>
        
        <button
          onClick={restartGame}
          className="group flex items-center justify-center gap-3 px-8 py-3 mx-auto bg-white/5 hover:bg-white/10 border border-white/20 rounded transition-all hover:scale-105"
        >
          <RefreshCcw className="w-5 h-5 text-red-400 group-hover:rotate-180 transition-transform duration-500" />
          <span className="uppercase tracking-widest text-sm text-white group-hover:text-red-100">Reinitialize</span>
        </button>
      </motion.div>
    </div>
  )
}
