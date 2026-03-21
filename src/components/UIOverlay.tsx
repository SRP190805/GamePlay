import { useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sun, Globe, Moon, Cloud, Disc, Zap, ArrowLeft, MoreHorizontal } from 'lucide-react'
import { useGameStore, BodyType } from '../store/gameStore'
import { EquilibriumBar } from './game/EquilibriumBar'
import { cn } from '../lib/utils'

const BODY_TYPES: { type: BodyType; label: string; icon: any; cost: number }[] = [
  { type: 'star', label: 'Star', icon: Sun, cost: 50 },
  { type: 'planet', label: 'Planet', icon: Globe, cost: 30 },
  { type: 'moon', label: 'Moon', icon: Moon, cost: 10 },
  { type: 'gas_giant', label: 'Gas Giant', icon: Cloud, cost: 40 },
  { type: 'black_hole', label: 'Black Hole', icon: Disc, cost: 200 },
  { type: 'nebula', label: 'Nebula', icon: Zap, cost: 100 },
]

export function UIOverlay() {
  const { 
    coins, 
    mode, 
    bodies, 
    selectedBodyId, 
    selectBody, 
    addBody, 
    spendCoins, 
    updateBody,
    nextTurn,
    chapter
  } = useGameStore()

  const chapterTitle = useMemo(() => {
    switch (chapter) {
      case 1: return 'Genesis'
      case 2: return 'Expansion'
      case 3: return 'Conflict'
      default: return 'Unknown'
    }
  }, [chapter])

  const selectedBody = bodies.find(b => b.id === selectedBodyId)

  const handlePlaceBody = (type: BodyType, cost: number) => {
    if (spendCoins(cost)) {
      // Random position for now, ideally player clicks on canvas
      const x = (Math.random() - 0.5) * 20
      const y = (Math.random() - 0.5) * 20
      addBody({ 
        type, 
        x, 
        y, 
        z: 0, 
        name: `New ${type.charAt(0).toUpperCase() + type.slice(1)}` 
      })
    }
  }

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
      
      {/* Top Bar */}
      <div className="flex justify-between items-start pointer-events-auto">
        <div className="flex flex-col">
           <span className="text-xs tracking-[0.2em] text-white/50 uppercase">
             {mode.replace('_', ' ')} Mode
           </span>
           <h2 className="text-xl font-light tracking-widest text-white">
             Chapter {chapter}: {chapterTitle}
           </h2>
        </div>

        <div className="bg-black/30 backdrop-blur-md border border-white/10 px-6 py-3 rounded-full flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
          <span className="font-mono text-xl text-yellow-100">{coins}</span>
          <span className="text-xs text-yellow-400/70 uppercase tracking-wider">Credits</span>
        </div>
      </div>

      {/* Center Action (Turn Button for Story Mode / Events) */}
      <div className="pointer-events-auto self-center absolute bottom-32">
        <button 
           onClick={() => nextTurn()}
           className="px-8 py-2 bg-white/5 hover:bg-white/10 border border-white/20 rounded text-sm uppercase tracking-widest transition-colors backdrop-blur-sm"
        >
          Next Cycle
        </button>
      </div>

      {/* Bottom Bar: Placement (Only in Open World or Story if allowed) */}
      <div className="flex justify-center gap-4 pointer-events-auto bg-black/40 backdrop-blur-xl p-4 rounded-2xl border border-white/5 mx-auto max-w-4xl overflow-x-auto">
        {BODY_TYPES.map((item) => (
          <button
            key={item.type}
            onClick={() => handlePlaceBody(item.type, item.cost)}
            disabled={coins < item.cost}
            className={cn(
              "flex flex-col items-center gap-2 min-w-[80px] p-3 rounded-lg transition-all border border-transparent",
              coins >= item.cost 
                ? "hover:bg-white/10 hover:border-white/20 active:scale-95 text-white" 
                : "opacity-40 cursor-not-allowed text-gray-500"
            )}
          >
            <item.icon className="w-6 h-6" />
            <span className="text-[10px] uppercase tracking-wider">{item.label}</span>
            <span className="text-[10px] font-mono text-yellow-400">{item.cost}</span>
          </button>
        ))}
      </div>

      {/* Right Panel: Selected Body Details */}
      <AnimatePresence>
        {selectedBody && (
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className="absolute top-24 right-6 w-80 bg-black/80 backdrop-blur-xl border border-white/10 p-6 rounded-lg pointer-events-auto flex flex-col gap-6"
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs uppercase text-blue-400 tracking-wider block mb-1">
                  {selectedBody.type.replace('_', ' ')}
                </span>
                <h3 className="text-2xl font-light text-white tracking-wide">
                  {selectedBody.name}
                </h3>
              </div>
              <button 
                onClick={() => selectBody(null)}
                className="text-white/50 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between text-sm text-white/70">
                <span>State</span>
                <span className={cn(
                  "uppercase font-medium",
                  selectedBody.state === 'critical' ? 'text-red-400' : 
                  selectedBody.state === 'stable' ? 'text-blue-400' : 'text-yellow-400'
                )}>
                  {selectedBody.state}
                </span>
              </div>
              
              <EquilibriumBar value={selectedBody.equilibrium} />

              <div className="pt-4 border-t border-white/10 text-xs text-white/50 leading-relaxed">
                Coordinates: {selectedBody.x.toFixed(2)}, {selectedBody.y.toFixed(2)}
                <br />
                Created Cycle: {useGameStore.getState().turnCount}
              </div>
              
              {/* Context Actions (Placeholder for now) */}
              <div className="flex gap-2 mt-2">
                <button 
                  onClick={() => updateBody(selectedBody.id, { name: selectedBody.name + ' (Renamed)' })}
                  className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded text-xs uppercase"
                >
                  Rename
                </button>
                <button className="px-3 py-2 bg-white/5 hover:bg-white/10 rounded">
                  <MoreHorizontal className="w-4 h-4 text-white/70" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
