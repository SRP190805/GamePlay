import { motion } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import { RefreshCcw } from 'lucide-react'

export function GameOverScreen() {
  const { gameOver, restartGame, storyOutcomes } = useGameStore()

  if (!gameOver) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-xl">
      {/* Particle decay effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 40 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-px h-px bg-red-500 rounded-full"
            style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
            animate={{ opacity: [0, 0.6, 0], scale: [0, 3, 0] }}
            transition={{ duration: 2 + Math.random() * 2, delay: Math.random() * 3, repeat: Infinity }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 150, damping: 20 }}
        className="text-center max-w-lg p-10 border border-red-500/20 rounded-2xl bg-black/90 shadow-[0_0_120px_rgba(239,68,68,0.15)] relative z-10"
      >
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="text-[9px] font-mono text-red-400/60 uppercase tracking-[0.5em] mb-4">System Terminated</div>
          <h1 className="text-5xl font-thin text-red-400 tracking-[0.2em] mb-2 uppercase">Collapse</h1>
          <div className="w-16 h-px bg-red-500/40 mx-auto mb-6" />
          <p className="text-white/60 font-light mb-8 leading-relaxed text-sm">{gameOver.reason}</p>
        </motion.div>

        {/* Story outcomes log */}
        {storyOutcomes.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mb-8 bg-white/3 rounded-xl p-4 text-left"
          >
            <div className="text-[9px] text-white/30 uppercase tracking-widest mb-3 font-mono">Chronicle of Decisions</div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {storyOutcomes.map((o, i) => (
                <div key={i} className="text-white/40 text-[10px] leading-relaxed border-l border-white/10 pl-2">
                  {i + 1}. {o}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={restartGame}
          className="group flex items-center justify-center gap-3 px-8 py-3 mx-auto bg-white/5 hover:bg-white/10 border border-white/15 rounded-xl transition-all"
        >
          <RefreshCcw className="w-4 h-4 text-red-400 group-hover:rotate-180 transition-transform duration-500" />
          <span className="uppercase tracking-widest text-xs text-white/70 group-hover:text-white">Reinitialize</span>
        </motion.button>
      </motion.div>
    </div>
  )
}
