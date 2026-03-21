import { useGameStore } from '../store/gameStore'

export function PauseMenu() {
  const { isPaused, togglePause, setMode } = useGameStore()

  if (!isPaused) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md">
      <div className="flex flex-col gap-4 p-8 border border-white/20 rounded-2xl bg-black/90 w-80 text-center shadow-2xl">
        <h2 className="text-2xl font-light tracking-widest text-white mb-4">PAUSED</h2>
        
        <button 
          onClick={togglePause}
          className="py-3 px-6 bg-white/10 hover:bg-white/20 rounded border border-white/5 transition-colors uppercase tracking-widest text-sm"
        >
          Resume
        </button>
        
        <button 
          onClick={() => { togglePause(); /* Open Settings */ }}
          className="py-3 px-6 bg-white/5 hover:bg-white/10 rounded border border-white/5 transition-colors uppercase tracking-widest text-sm text-white/70"
        >
          Settings
        </button>
        
        <button 
          onClick={() => { togglePause(); setMode('menu'); }}
          className="py-3 px-6 bg-red-500/10 hover:bg-red-500/20 rounded border border-red-500/20 transition-colors uppercase tracking-widest text-sm text-red-400 mt-4"
        >
          Exit to Menu
        </button>
      </div>
    </div>
  )
}
