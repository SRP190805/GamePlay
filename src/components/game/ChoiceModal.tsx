import { motion } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'
import { cn } from '../../lib/utils'

export function ChoiceModal() {
  const { currentEvent, resolveEvent } = useGameStore()

  if (!currentEvent) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-xl w-full bg-black/90 border border-white/20 rounded-2xl p-8 shadow-[0_0_50px_rgba(255,255,255,0.1)]"
      >
        <div className="mb-8 text-center">
          <span className="text-xs font-mono text-red-400 uppercase tracking-widest mb-2 block">Anomaly Detected</span>
          <h2 className="text-3xl font-light text-white mb-4">{currentEvent.title}</h2>
          <p className="text-white/70 leading-relaxed text-lg">{currentEvent.description}</p>
        </div>

        <div className="grid gap-4">
          {currentEvent.choices.map((choice, index) => (
            <button
              key={index}
              onClick={() => resolveEvent(index)}
              className="group relative p-6 border border-white/10 rounded-lg hover:bg-white/5 transition-all text-left overflow-hidden"
            >
              <div className={cn(
                "absolute left-0 top-0 bottom-0 w-1 transition-all",
                choice.type === 'genesis' ? 'bg-green-500 group-hover:w-2' : 
                choice.type === 'equilibrium' ? 'bg-blue-500 group-hover:w-2' : 
                'bg-red-500 group-hover:w-2'
              )} />
              
              <div className="flex justify-between items-center pl-4">
                <div>
                  <h3 className="text-white text-lg font-medium mb-1 group-hover:text-blue-200 transition-colors">
                    {choice.label}
                  </h3>
                  <p className="text-xs text-white/40 uppercase tracking-wider">
                    Effect: {choice.type}
                  </p>
                </div>
                <div className="text-right">
                   <span className="block text-yellow-400 font-mono text-lg">+{choice.coinReward}</span>
                   <span className="text-[10px] text-white/30 uppercase">Credits</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
