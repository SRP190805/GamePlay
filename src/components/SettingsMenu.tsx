import { useState } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import { Volume2, VolumeX, MousePointer2, X } from 'lucide-react'

export function SettingsMenu({ onClose }: { onClose: () => void }) {
  const { settings, updateSettings } = useGameStore()
  const [localSettings, setLocalSettings] = useState(settings)

  const handleChange = (key: keyof typeof settings, value: number) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = () => {
    updateSettings(localSettings)
    onClose()
  }

  return (
    <motion.div 
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      className="w-full max-w-md bg-zinc-900 border border-white/10 p-8 rounded-2xl shadow-2xl relative"
      onClick={(e) => e.stopPropagation()} 
    >
      <button 
        onClick={onClose} 
        className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
      >
        <X className="w-6 h-6" />
      </button>

      <h2 className="text-2xl font-light tracking-[0.2em] text-white mb-8 uppercase text-center border-b border-white/10 pb-4">
        System Config
      </h2>

      <div className="space-y-8">
        {/* Volume */}
        <div className="space-y-4">
          <div className="flex justify-between items-center text-sm text-white/70">
            <div className="flex items-center gap-3">
              {localSettings.volume === 0 ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-blue-400" />}
              <span className="uppercase tracking-wide text-xs">Audio Output Level</span>
            </div>
            <span className="font-mono text-xs bg-white/5 px-2 py-1 rounded">{localSettings.volume}%</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={localSettings.volume} 
            onChange={(e) => handleChange('volume', Number(e.target.value))}
            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>

        {/* Sensitivity */}
        <div className="space-y-4">
          <div className="flex justify-between items-center text-sm text-white/70">
            <div className="flex items-center gap-3">
              <MousePointer2 className="w-5 h-5 text-purple-400" />
              <span className="uppercase tracking-wide text-xs">Camera Sensitivity</span>
            </div>
            <span className="font-mono text-xs bg-white/5 px-2 py-1 rounded">{localSettings.motionSensitivity.toFixed(1)}x</span>
          </div>
          <input 
            type="range" 
            min="0.1" 
            max="2.0" 
            step="0.1"
            value={localSettings.motionSensitivity} 
            onChange={(e) => handleChange('motionSensitivity', Number(e.target.value))}
            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
          />
        </div>
      </div>

      <div className="mt-10 flex justify-center gap-4">
        <button 
          onClick={onClose}
          className="px-6 py-3 bg-transparent border border-white/20 text-white/50 text-xs uppercase tracking-widest font-bold hover:bg-white/5 hover:text-white transition-colors rounded"
        >
          Cancel
        </button>
        <button 
          onClick={handleSave}
          className="px-8 py-3 bg-white text-black text-xs uppercase tracking-widest font-bold hover:bg-blue-50 transition-colors rounded shadow-[0_0_15px_rgba(255,255,255,0.3)]"
        >
          Apply Changes
        </button>
      </div>
    </motion.div>
  )
}
