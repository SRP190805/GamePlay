import { useEffect, useMemo, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sun, Globe, Moon, Cloud, Disc, Zap, ArrowLeft, MoreHorizontal, Bell, Trash2, Settings, Info } from 'lucide-react'
import { useGameStore, BodyType } from '../store/gameStore'
import { EquilibriumBar } from './game/EquilibriumBar'
import { cn } from '../lib/utils'
import { SettingsMenu } from './SettingsMenu'

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
    removeBody,
    nextTurn,
    chapter
  } = useGameStore()
  
  const [showSettings, setShowSettings] = useState(false)

  const chapterTitle = useMemo(() => {
    switch (chapter) {
      case 1: return 'Genesis'
      case 2: return 'Expansion'
      case 3: return 'Conflict'
      default: return 'Unknown'
    }
  }, [chapter])

  const [toast, setToast] = useState<{ msg: string, type: 'info' | 'success' | 'warning' } | null>(null)
  const prevCoins = useRef(coins)
  const prevTurn = useRef(useGameStore.getState().turnCount)

  useEffect(() => {
    if (coins > prevCoins.current) {
      setToast({ msg: `+${coins - prevCoins.current} Credits`, type: 'success' })
      setTimeout(() => setToast(null), 2000)
    } else if (coins < prevCoins.current) {
        // Spend
    }
    prevCoins.current = coins
  }, [coins])

  useEffect(() => {
     const currentTurn = useGameStore.getState().turnCount
     if (currentTurn > prevTurn.current) {
        setToast({ msg: `Cycle ${currentTurn} Initiated`, type: 'info' })
        setTimeout(() => setToast(null), 2000)
     }
     prevTurn.current = currentTurn
  }, [nextTurn]) 

  const selectedBody = bodies.find(b => b.id === selectedBodyId)

  const handlePlaceBody = (type: BodyType, cost: number) => {
    if (spendCoins(cost)) {
      // Find a "parent" if nearby, or just place randomly in view.
      // For improved UX, we'd cast a ray.
      // For now, let's just place at random location near center or near selected body.
      let parentId: string | null = null
      let x = (Math.random() - 0.5) * 10
      let z = (Math.random() - 0.5) * 10 // Use Z instead of Y for floor plane layout
      
      if (selectedBodyId) {
         // Place in orbit of selected?
         // User requirement: "if a star/planet is put and planets/moons are put around it it should revolve"
         const parent = bodies.find(b => b.id === selectedBodyId)
         if (parent && (parent.type === 'star' || parent.type === 'planet' || parent.type === 'gas_giant')) {
            parentId = parent.id
            x = 0 
            z = 0 // Relative
            // Set orbit radius
            const radius = parent.type === 'star' ? 10 + Math.random() * 10 : 4 + Math.random() * 2
            
            addBody({ 
              type, 
              x, 
              y: 0, 
              z, 
              name: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
              equilibrium: 50,
              state: 'stable',
              parentId,
              orbitRadius: radius,
              orbitSpeed: (Math.random() * 0.5) + 0.1,
              orbitAngle: Math.random() * Math.PI * 2,
              rotationSpeed: 0.01
            })
            return
         }
      }

      addBody({ 
        type, 
        x, 
        y: 0, 
        z, 
        name: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
        equilibrium: 50,
        state: 'stable',
        parentId: null,
        orbitRadius: 0,
        orbitSpeed: 0,
        orbitAngle: 0,
        rotationSpeed: 0.01
      })
    }
  }

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 overflow-hidden">
      
      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
            <div className="pointer-events-auto absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <SettingsMenu onClose={() => setShowSettings(false)} />
            </div>
        )}
      </AnimatePresence>

      {/* Notifications */}
      <AnimatePresence>
        {toast && (
          <motion.div
             initial={{ opacity: 0, y: -20, x: 20 }}
             animate={{ opacity: 1, y: 0, x: 0 }}
             exit={{ opacity: 0, y: -20 }}
             className={cn(
               "absolute top-24 right-6 pointer-events-none z-50 flex items-center gap-3 px-6 py-3 rounded-lg backdrop-blur-xl border shadow-2xl",
               toast.type === 'success' ? "bg-green-500/10 border-green-500/20 text-green-200" :
               toast.type === 'warning' ? "bg-red-500/10 border-red-500/20 text-red-200" :
               "bg-blue-500/10 border-blue-500/20 text-blue-200"
             )}
          >
             <Bell className="w-4 h-4" />
             <span className="text-sm font-medium tracking-wide">{toast.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Bar */}
      <div className="flex justify-between items-start w-full pointer-events-none z-10">
        <div className="flex flex-col gap-2">
            <div className="flex flex-col bg-black/40 p-4 rounded-br-2xl border-b border-r border-white/10 backdrop-blur-md pointer-events-auto shadow-xl">
               <span className="text-xs tracking-[0.2em] text-white/50 uppercase mb-1">
                 {mode.replace('_', ' ')} Mode
               </span>
               <h2 className="text-xl font-light tracking-widest text-white">
                 Chapter {chapter}: {chapterTitle}
               </h2>
               {mode === 'story' && (
                 <div className="mt-2 text-xs text-blue-300/80 max-w-xs leading-relaxed">
                   <span className="font-bold text-blue-400">Objective:</span> Ensure the stability of your system. Avoid total collapse.
                 </div>
               )}
            </div>
            
            <button 
                onClick={() => setShowSettings(true)}
                className="pointer-events-auto w-10 h-10 flex items-center justify-center bg-black/40 hover:bg-white/10 rounded-full border border-white/10 backdrop-blur-md transition-colors"
            >
                <Settings className="w-4 h-4 text-white/70" />
            </button>
        </div>

        <div className="bg-black/30 backdrop-blur-md border border-white/10 px-6 py-3 rounded-bl-2xl flex items-center gap-3 shadow-lg pointer-events-auto">
          <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse shadow-[0_0_10px_yellow]" />
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

      {/* Bottom Bar: Placement (Only in Open World) */}
      {mode === 'open_world' && (
        <div className="flex justify-center gap-4 pointer-events-auto bg-black/40 backdrop-blur-xl p-4 rounded-2xl border border-white/5 mx-auto max-w-4xl overflow-x-auto">
          {BODY_TYPES.map((item) => (
            <button
              key={item.type}
              onClick={() => handlePlaceBody(item.type, item.cost)}
              disabled={coins < item.cost}
              title={`Cost: ${item.cost} Credits`}
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
      )}

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
              
              {/* Context Actions */}
              <div className="flex gap-2 mt-2">
                <button 
                  onClick={() => updateBody(selectedBody.id, { name: selectedBody.name + ' (Renamed)' })}
                  className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded text-xs uppercase"
                >
                  Rename
                </button>
                {mode === 'open_world' && (
                    <button 
                        onClick={() => removeBody(selectedBody.id)}
                        className="px-3 py-2 bg-red-500/10 hover:bg-red-500/30 text-red-400 rounded transition-colors"
                        title="Delete Body"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
