import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'
import { cn } from '../../lib/utils'
import { Zap, Anchor, Flame, ChevronRight } from 'lucide-react'

const TYPE_CONFIG = {
  genesis:     { color: 'green',  border: 'border-green-500/40',  bg: 'hover:bg-green-900/20', bar: 'bg-green-500',  icon: Zap,    label: 'Genesis',      glow: 'shadow-[0_0_20px_rgba(34,197,94,0.2)]' },
  equilibrium: { color: 'blue',   border: 'border-blue-500/40',   bg: 'hover:bg-blue-900/20',  bar: 'bg-blue-500',   icon: Anchor, label: 'Equilibrium',  glow: 'shadow-[0_0_20px_rgba(59,130,246,0.2)]' },
  collapse:    { color: 'red',    border: 'border-red-500/40',     bg: 'hover:bg-red-900/20',   bar: 'bg-red-500',    icon: Flame,  label: 'Collapse',     glow: 'shadow-[0_0_20px_rgba(239,68,68,0.2)]' },
}

export function ChoiceModal() {
  const { currentEvent, resolveEvent, mode, narratorDone } = useGameStore()
  const [resolvedIndex, setResolvedIndex] = useState<number | null>(null)
  const [resolving, setResolving] = useState(false)

  if (!currentEvent) return null

  // For story events, wait until narrator finishes typing before showing choices
  const choicesReady = !currentEvent.isStoryEvent || narratorDone

  const handleChoice = (i: number) => {
    if (resolving) return
    setResolvedIndex(i)
    setResolving(true)
    // Brief delay to show the selection flash before resolving
    setTimeout(() => {
      resolveEvent(i)
      setResolvedIndex(null)
      setResolving(false)
    }, 600)
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
        <motion.div
          initial={{ scale: 0.88, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.88, opacity: 0, y: 30 }}
          transition={{ type: 'spring', stiffness: 180, damping: 22 }}
          className="max-w-lg w-full bg-black/95 border border-white/15 rounded-2xl overflow-hidden shadow-[0_0_80px_rgba(99,102,241,0.15)]"
        >
          {/* Header */}
          <div className="relative px-8 pt-8 pb-6 border-b border-white/8">
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/10 to-transparent pointer-events-none" />
            {currentEvent.isStoryEvent && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-[9px] font-mono text-indigo-400 uppercase tracking-[0.4em] mb-3"
              >
                ◆ Story Event
              </motion.div>
            )}
            {!currentEvent.isStoryEvent && (
              <div className="text-[9px] font-mono text-red-400/80 uppercase tracking-[0.4em] mb-3">
                ⚠ Anomaly Detected
              </div>
            )}
            <h2 className="text-2xl font-light text-white tracking-wide mb-3">{currentEvent.title}</h2>
            <p className="text-white/55 leading-relaxed text-sm font-light">{currentEvent.description}</p>
          </div>

          {/* Choices — gated behind narrator for story events */}
          <div className="p-6 space-y-3">
            {!choicesReady ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center gap-3 py-8 text-white/30"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                <span className="text-xs font-mono text-white/20 ml-2 uppercase tracking-widest">Awaiting guidance...</span>
              </motion.div>
            ) : (
              currentEvent.choices.map((choice, i) => {
                const cfg = TYPE_CONFIG[choice.type]
                const Icon = cfg.icon
                const isResolved = resolvedIndex === i
                return (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleChoice(i)}
                    disabled={resolving}
                    className={cn(
                      'group w-full relative p-5 border rounded-xl transition-all text-left overflow-hidden',
                      cfg.border, cfg.bg,
                      isResolved ? cfg.glow + ' scale-[1.02] border-opacity-80' : '',
                      resolving && resolvedIndex !== i ? 'opacity-30' : ''
                    )}
                  >
                    <div className={cn('absolute left-0 top-0 bottom-0 w-0.5 transition-all group-hover:w-1', cfg.bar,
                      isResolved ? 'w-1' : '')} />
                    <div className="flex items-start justify-between pl-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className={`w-3.5 h-3.5 text-${cfg.color}-400`} />
                          <h3 className="text-white text-sm font-medium">{choice.label}</h3>
                          {isResolved && (
                            <motion.span
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className={`text-[9px] font-mono text-${cfg.color}-400 uppercase tracking-wider ml-auto`}
                            >
                              ✓ Chosen
                            </motion.span>
                          )}
                        </div>
                        <p className="text-white/40 text-xs leading-relaxed">{choice.description}</p>
                        {/* Story mode: show predefined outcome */}
                        {mode === 'story' && (
                          <p className="text-white/25 text-[10px] mt-2 italic leading-relaxed flex items-start gap-1">
                            <ChevronRight className="w-3 h-3 shrink-0 mt-0.5 opacity-50" />
                            {choice.outcome}
                          </p>
                        )}
                      </div>
                      <div className="text-right ml-4 shrink-0">
                        <span className="block text-yellow-400 font-mono text-base">+{choice.coinReward}</span>
                        <span className="text-[9px] text-white/25 uppercase tracking-wider">credits</span>
                      </div>
                    </div>
                  </motion.button>
                )
              })
            )}
          </div>

          {mode === 'story' && (
            <div className="px-6 pb-5 text-center text-[9px] text-white/20 font-mono uppercase tracking-widest">
              Story Mode · Outcomes are predefined
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
