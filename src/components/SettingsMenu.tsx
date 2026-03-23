import { useState } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import { Volume2, VolumeX, MousePointer2, X, Eye, EyeOff, Layers, Zap, Monitor } from 'lucide-react'
import { soundManager } from '../lib/sound'

function Slider({ label, icon: Icon, value, min, max, step = 1, unit = '', color = 'blue',
  onChange }: {
  label: string; icon: any; value: number; min: number; max: number;
  step?: number; unit?: string; color?: string; onChange: (v: number) => void
}) {
  const pct = ((value - min) / (max - min)) * 100
  const colorMap: Record<string, string> = {
    blue: 'accent-blue-500', purple: 'accent-purple-500',
    green: 'accent-green-500', yellow: 'accent-yellow-500', red: 'accent-red-500'
  }
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Icon className={`w-4 h-4 text-${color}-400`} />
          <span className="text-white/60 text-xs uppercase tracking-wider">{label}</span>
        </div>
        <span className="font-mono text-xs bg-white/5 px-2 py-1 rounded text-white/70">
          {typeof value === 'number' && !Number.isInteger(value) ? value.toFixed(1) : value}{unit}
        </span>
      </div>
      <div className="relative">
        <div className="h-1 bg-white/8 rounded-full overflow-hidden">
          <div className={`h-full bg-${color}-500 rounded-full transition-all`} style={{ width: `${pct}%` }} />
        </div>
        <input type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(Number(e.target.value))}
          className={`absolute inset-0 w-full opacity-0 cursor-pointer h-1 ${colorMap[color]}`}
        />
      </div>
    </div>
  )
}

function Toggle({ label, icon: Icon, value, onChange, color = 'blue' }: {
  label: string; icon: any; value: boolean; onChange: (v: boolean) => void; color?: string
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Icon className={`w-4 h-4 text-${color}-400`} />
        <span className="text-white/60 text-xs uppercase tracking-wider">{label}</span>
      </div>
      <button onClick={() => onChange(!value)}
        className={`relative w-10 h-5 rounded-full transition-colors ${value ? `bg-${color}-600` : 'bg-white/10'}`}>
        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${value ? 'left-5' : 'left-0.5'}`} />
      </button>
    </div>
  )
}

export function SettingsMenu({ onClose }: { onClose: () => void }) {
  const { settings, updateSettings } = useGameStore()
  const [local, setLocal] = useState(settings)
  const [activeTab, setActiveTab] = useState<'audio' | 'visual' | 'controls'>('audio')

  const set = (key: keyof typeof settings, value: any) => {
    setLocal(prev => ({ ...prev, [key]: value }))
    if (key === 'volume') soundManager.setVolume(value)
  }

  const handleSave = () => {
    updateSettings(local)
    soundManager.playSelect()
    onClose()
  }

  const tabs = [
    { id: 'audio', label: 'Audio' },
    { id: 'visual', label: 'Visual' },
    { id: 'controls', label: 'Controls' },
  ] as const

  return (
    <motion.div
      initial={{ scale: 0.92, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.92, opacity: 0, y: 20 }}
      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      className="w-full max-w-md bg-black/95 border border-white/12 p-0 rounded-2xl shadow-2xl relative overflow-hidden"
      onClick={e => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/8">
        <div>
          <h2 className="text-white font-light tracking-[0.2em] uppercase text-sm">System Configuration</h2>
          <p className="text-white/30 text-[10px] mt-0.5">The Cartographer</p>
        </div>
        <button onClick={onClose} className="text-white/30 hover:text-white transition-colors p-1">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/8">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 text-[10px] uppercase tracking-widest transition-colors ${
              activeTab === tab.id ? 'text-white border-b border-white' : 'text-white/30 hover:text-white/60'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-6 space-y-6 min-h-[220px]">
        {activeTab === 'audio' && (
          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <Slider label="Master Volume" icon={local.volume === 0 ? VolumeX : Volume2}
              value={local.volume} min={0} max={100} unit="%" color="blue"
              onChange={v => set('volume', v)} />
            <Slider label="Bloom Intensity" icon={Zap}
              value={local.bloomIntensity} min={0} max={3} step={0.1} color="yellow"
              onChange={v => set('bloomIntensity', v)} />
            <div className="bg-white/3 rounded-lg p-3 text-white/30 text-[10px] leading-relaxed">
              Ambient cosmic drone adapts to system equilibrium. Higher stability = deeper resonance.
            </div>
          </motion.div>
        )}

        {activeTab === 'visual' && (
          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <Toggle label="Show Orbit Rings" icon={local.showOrbits ? Eye : EyeOff}
              value={local.showOrbits} onChange={v => set('showOrbits', v)} color="purple" />
            <Toggle label="Show Body Labels" icon={Layers}
              value={local.showLabels} onChange={v => set('showLabels', v)} color="green" />
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Monitor className="w-4 h-4 text-blue-400" />
                <span className="text-white/60 text-xs uppercase tracking-wider">Graphics Quality</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(['low', 'medium', 'high'] as const).map(q => (
                  <button key={q} onClick={() => set('graphicsQuality', q)}
                    className={`py-2 rounded text-[10px] uppercase tracking-wider transition-colors ${
                      local.graphicsQuality === q
                        ? 'bg-blue-600 text-white'
                        : 'bg-white/5 text-white/40 hover:bg-white/10'
                    }`}>
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'controls' && (
          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <Slider label="Camera Sensitivity" icon={MousePointer2}
              value={local.motionSensitivity} min={0.1} max={3.0} step={0.1} color="purple"
              onChange={v => set('motionSensitivity', v)} />
            <div className="space-y-2 text-[10px] text-white/30 bg-white/3 rounded-lg p-3">
              <div className="flex justify-between"><span>Rotate</span><span className="text-white/50">Left Drag</span></div>
              <div className="flex justify-between"><span>Pan</span><span className="text-white/50">Right Drag</span></div>
              <div className="flex justify-between"><span>Zoom</span><span className="text-white/50">Scroll Wheel</span></div>
              <div className="flex justify-between"><span>Pause</span><span className="text-white/50">Escape</span></div>
              <div className="flex justify-between"><span>Select</span><span className="text-white/50">Click Body</span></div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Footer */}
      <div className="flex gap-3 px-6 pb-6">
        <button onClick={onClose}
          className="flex-1 py-2.5 border border-white/10 text-white/40 text-[10px] uppercase tracking-widest rounded hover:bg-white/5 transition-colors">
          Cancel
        </button>
        <button onClick={handleSave}
          className="flex-1 py-2.5 bg-white text-black text-[10px] uppercase tracking-widest font-bold rounded hover:bg-blue-50 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.15)]">
          Apply
        </button>
      </div>
    </motion.div>
  )
}
