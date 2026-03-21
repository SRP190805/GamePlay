import { useMemo } from 'react'

interface EquilibriumBarProps {
  value: number // 0-100
}

export function EquilibriumBar({ value }: EquilibriumBarProps) {
  // 0-33: Collapse (Red)
  // 33-66: Equilibrium (Blue/White)
  // 66-100: Genesis (Gold/Green)
  
  const zoneColor = useMemo(() => {
    if (value < 33) return 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'
    if (value > 66) return 'bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)]'
    return 'bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.5)]'
  }, [value])

  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between text-xs uppercase tracking-widest text-white/50">
        <span>Collapse</span>
        <span>Equilibrium</span>
        <span>Genesis</span>
      </div>
      
      <div className="relative h-4 bg-gray-900 rounded-full overflow-hidden border border-white/10">
        {/* Zones Background */}
        <div className="absolute inset-0 flex opacity-20">
          <div className="w-1/3 h-full bg-red-900" />
          <div className="w-1/3 h-full bg-blue-900" />
          <div className="w-1/3 h-full bg-yellow-900" />
        </div>

        {/* Needle */}
        <div 
          className="absolute top-0 bottom-0 w-1 bg-white transition-all duration-500 ease-out z-10"
          style={{ left: `${value}%` }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-6 bg-white rounded shadow-lg" />
        </div>
        
        {/* Glow Overlay */}
        <div 
          className={`absolute inset-0 transition-opacity duration-500 pointer-events-none opacity-30 ${zoneColor}`}
          style={{ 
            background: `radial-gradient(circle at ${value}% 50%, currentColor, transparent 70%)` 
          }}
        />
      </div>
      
      <div className="text-right text-xs text-white/70 font-mono">
        {value.toFixed(1)}%
      </div>
    </div>
  )
}
