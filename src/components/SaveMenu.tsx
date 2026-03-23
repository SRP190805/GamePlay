import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Save, FolderOpen, Trash2, X, Loader2 } from 'lucide-react'
import { useGameStore, SaveSlot } from '../store/gameStore'

interface SaveMenuProps {
  onClose: () => void
  /** 'save' shows save + load, 'load' shows load only (from main menu) */
  initialTab?: 'save' | 'load'
}

const SLOT_LABELS = ['I', 'II', 'III'] as const

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) +
    ' · ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

export function SaveMenu({ onClose, initialTab = 'save' }: SaveMenuProps) {
  const { saveProgress, loadSave, deleteSave, listSaves, mode, togglePause } = useGameStore()
  const [tab, setTab] = useState<'save' | 'load'>(initialTab)
  const [slots, setSlots] = useState<(SaveSlot | null)[]>([null, null, null])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<number | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [tableError, setTableError] = useState(false)

  const inGame = mode === 'story' || mode === 'open_world'

  const refresh = async () => {
    setLoading(true)
    setTableError(false)
    const saves = await listSaves()
    // listSaves returns [] on error — check if the table actually exists
    // by seeing if we got an error logged (we check via a probe)
    const probe = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/save_slots?limit=0`, {
      headers: {
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
    })
    if (!probe.ok && probe.status !== 406) {
      setTableError(true)
    }
    const arr: (SaveSlot | null)[] = [null, null, null]
    saves.forEach(s => { arr[s.slot_index - 1] = s })
    setSlots(arr)
    setLoading(false)
  }

  useEffect(() => { refresh() }, [])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  const handleSave = async (idx: number) => {
    setBusy(idx)
    await saveProgress((idx + 1) as 1 | 2 | 3)
    await refresh()
    setBusy(null)
    showToast(`Saved to slot ${SLOT_LABELS[idx]}`)
  }

  const handleLoad = async (idx: number) => {
    setBusy(idx)
    const ok = await loadSave((idx + 1) as 1 | 2 | 3)
    setBusy(null)
    if (ok) {
      showToast(`Loaded slot ${SLOT_LABELS[idx]}`)
      // Small delay so toast is visible before closing
      setTimeout(() => {
        if (inGame) togglePause()
        onClose()
      }, 600)
    } else {
      showToast('Nothing saved in that slot.')
    }
  }

  const handleDelete = async (idx: number) => {
    setBusy(idx)
    await deleteSave((idx + 1) as 1 | 2 | 3)
    await refresh()
    setBusy(null)
    setConfirmDelete(null)
    showToast(`Slot ${SLOT_LABELS[idx]} cleared`)
  }

  return (
    <motion.div
      initial={{ scale: 0.92, opacity: 0, y: 16 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.92, opacity: 0, y: 16 }}
      transition={{ type: 'spring', stiffness: 220, damping: 26 }}
      className="relative w-full max-w-sm bg-black/95 border border-white/12 rounded-2xl p-6 shadow-2xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="text-[9px] font-mono text-white/30 uppercase tracking-[0.4em] mb-1">The Cartographer</div>
          <h2 className="text-base font-thin tracking-[0.3em] text-white uppercase">
            {tab === 'save' ? 'Save Progress' : 'Load Save'}
          </h2>
        </div>
        <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs — only show if in-game (can both save and load) */}
      {inGame && (
        <div className="flex gap-2 mb-5">
          {(['save', 'load'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-1.5 rounded-lg text-[10px] uppercase tracking-widest transition-colors border ${
                tab === t
                  ? 'bg-white/10 border-white/20 text-white'
                  : 'bg-transparent border-white/6 text-white/35 hover:text-white/60'
              }`}
            >
              {t === 'save' ? 'Save' : 'Load'}
            </button>
          ))}
        </div>
      )}

      {/* Table missing error */}
      {tableError && (
        <div className="mb-4 p-3 bg-orange-500/10 border border-orange-500/30 rounded-xl text-[10px] text-orange-300 leading-relaxed">
          <div className="font-mono font-bold mb-1">⚠ Database setup required</div>
          <div className="text-orange-300/70">
            Run <span className="font-mono bg-black/40 px-1 rounded">00002_save_slots.sql</span> in your{' '}
            <a
              href={`${import.meta.env.VITE_SUPABASE_URL?.replace('.supabase.co', '')}.supabase.com/project/_/sql`}
              target="_blank"
              rel="noreferrer"
              className="underline text-orange-200"
            >
              Supabase SQL editor
            </a>
          </div>
        </div>
      )}

      {/* Slots */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-5 h-5 text-white/30 animate-spin" />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {slots.map((slot, idx) => (
            <div
              key={idx}
              className="relative flex items-center gap-3 p-3 rounded-xl border border-white/8 bg-white/3"
            >
              {/* Slot number */}
              <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/6 border border-white/10 text-white/40 font-mono text-xs shrink-0">
                {SLOT_LABELS[idx]}
              </div>

              {/* Slot info */}
              <div className="flex-1 min-w-0">
                {slot ? (
                  <>
                    <div className="text-xs text-white/80 truncate">{slot.label}</div>
                    <div className="text-[10px] text-white/35 mt-0.5 font-mono">
                      {slot.mode === 'story' ? 'Story' : 'Open World'} · Ch.{slot.chapter} · T{slot.turn_count} · {slot.body_count} bodies
                    </div>
                    <div className="text-[9px] text-white/20 mt-0.5 font-mono">{formatDate(slot.saved_at)}</div>
                  </>
                ) : (
                  <div className="text-xs text-white/20 italic">Empty slot</div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-1.5 shrink-0">
                {tab === 'save' && inGame && (
                  <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => handleSave(idx)}
                    disabled={busy !== null}
                    className="p-1.5 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/20 text-blue-400 transition-colors disabled:opacity-40"
                    title="Save here"
                  >
                    {busy === idx ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  </motion.button>
                )}

                {slot && (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.94 }}
                      onClick={() => handleLoad(idx)}
                      disabled={busy !== null}
                      className="p-1.5 rounded-lg bg-green-500/15 hover:bg-green-500/25 border border-green-500/20 text-green-400 transition-colors disabled:opacity-40"
                      title="Load this save"
                    >
                      {busy === idx && tab === 'load' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FolderOpen className="w-3.5 h-3.5" />}
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.94 }}
                      onClick={() => setConfirmDelete(idx)}
                      disabled={busy !== null}
                      className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/15 text-red-400/70 transition-colors disabled:opacity-40"
                      title="Delete save"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </motion.button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirm dialog */}
      <AnimatePresence>
        {confirmDelete !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/80 rounded-2xl backdrop-blur-sm"
          >
            <div className="text-center p-6">
              <p className="text-white/70 text-sm mb-4">Delete slot {SLOT_LABELS[confirmDelete]}?</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => handleDelete(confirmDelete)}
                  className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-400 text-xs uppercase tracking-widest transition-colors"
                >
                  Delete
                </button>
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="px-4 py-2 bg-white/6 hover:bg-white/10 border border-white/10 rounded-lg text-white/50 text-xs uppercase tracking-widest transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute -bottom-10 left-0 right-0 flex justify-center"
          >
            <div className="px-4 py-1.5 bg-white/10 border border-white/15 rounded-full text-[10px] text-white/70 font-mono tracking-widest">
              {toast}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
