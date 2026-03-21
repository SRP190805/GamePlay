import { motion } from 'framer-motion'

interface EquilibriumBarProps {
  value: number // 0-100
}

export function EquilibriumBar({ value }: EquilibriumBarProps) {
  const getZone = () => {
    if (value < 33) return { label: 'Collapse', color: 'text-red-500', barColor: 'bg-red-500' }
    if (value > 66) return { label: 'Genesis', color: 'text-yellow-400', barColor: 'bg-yellow-400' }
    return { label: 'Equilibrium', color: 'text-blue-400', barColor: 'bg-blue-400' }
  }

  const { label, color, barColor } = getZone()

  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between items-end">
        <div className="text-[10px] uppercase tracking-wider text-white/50">Stability</div>
        <div className={`text-xs font-bold uppercase tracking-widest ${color}`}>{label}</div>
      </div>
      
      <div className="relative h-2 bg-white/5 rounded-full overflow-hidden border border-white/10">
        {/* Background Gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-red-900/40 via-blue-900/40 to-yellow-900/40" />
        
        {/* Indicator */}
        <motion.div 
          className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_white] z-10"
          initial={{ left: `${value}%` }}
          animate={{ left: `${value}%` }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
        >
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-4 ${barColor} rounded-full shadow-lg border border-white/50`} />
        </motion.div>
      </div>
      
      <div className="flex justify-between text-[10px] font-mono text-white/30">
        <span>0%</span>
        <span className="text-white/70">{value.toFixed(1)}%</span>
        <span>100%</span>
      </div>
    </div>
  )
}
