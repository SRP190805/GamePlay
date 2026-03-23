import { useEffect, useMemo, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sun, Globe, Moon, Cloud, Disc, Zap,
  Lock, Star, Atom, Flame, Wind, Orbit, Settings, Trash2, GitBranch, AlertTriangle, List } from 'lucide-react'
import { useGameStore, BodyType, BODY_COSTS, UNLOCK_COSTS, defaultMass } from '../store/gameStore'
import { EquilibriumBar } from './game/EquilibriumBar'
import { cn } from '../lib/utils'
import { SettingsMenu } from './SettingsMenu'
import { soundManager } from '../lib/sound'

const BODY_DEFS: { type: BodyType; label: string; icon: any; desc: string; key?: string }[] = [
  { type: 'star',          label: 'Star',         icon: Sun,   desc: 'Anchor of a solar system',         key: '1' },
  { type: 'planet',        label: 'Planet',       icon: Globe, desc: 'Rocky or oceanic world',           key: '2' },
  { type: 'moon',          label: 'Moon',         icon: Moon,  desc: 'Natural satellite',                key: '3' },
  { type: 'gas_giant',     label: 'Gas Giant',    icon: Cloud, desc: 'Massive gas world with rings',     key: '4' },
  { type: 'black_hole',    label: 'Black Hole',   icon: Disc,  desc: 'Singularity of infinite density',  key: '5' },
  { type: 'nebula',        label: 'Nebula',       icon: Zap,   desc: 'Stellar nursery cloud',            key: '6' },
  { type: 'neutron_star',  label: 'Neutron Star', icon: Atom,  desc: 'Ultra-dense stellar remnant',      key: '7' },
  { type: 'comet',         label: 'Comet',        icon: Star,  desc: 'Icy body with a glowing tail',     key: '8' },
  { type: 'pulsar',        label: 'Pulsar',       icon: Orbit, desc: 'Rapidly rotating neutron star',    key: '9' },
  { type: 'white_dwarf',   label: 'White Dwarf',  icon: Flame, desc: 'Cooling stellar core remnant' },
  { type: 'asteroid_belt', label: 'Asteroid Belt',icon: Wind,  desc: 'Ring of rocky debris' },
]

function PlacementModal({ type, onConfirm, onCancel }: {
  type: BodyType; onConfirm: (name: string) => void; onCancel: () => void
}) {
  const def = BODY_DEFS.find(d => d.type === type)
  const [name, setName] = useState(def?.label || type)
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div className="bg-black/90 border border-white/20 rounded-2xl p-8 w-full max-w-sm shadow-2xl"
        onClick={e => e.stopPropagation()}>
        <h3 className="text-white text-lg font-light tracking-widest uppercase mb-1">Name Your {def?.label}</h3>
        <p className="text-white/40 text-xs mb-6">{def?.desc}</p>
        <input
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && name.trim()) onConfirm(name.trim()) }}
          className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white text-sm font-mono outline-none focus:border-blue-400 transition-colors mb-6"
          placeholder="Enter a name..."
          maxLength={32}
        />
        <p className="text-white/30 text-xs mb-6 text-center">Then click anywhere in space to place it</p>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 py-2 border border-white/10 rounded text-white/50 text-xs uppercase tracking-wider hover:bg-white/5 transition-colors">
            Cancel
          </button>
          <button onClick={() => name.trim() && onConfirm(name.trim())}
            className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 rounded text-white text-xs uppercase tracking-wider transition-colors">
            Place
          </button>
        </div>
      </div>
    </motion.div>
  )
}

function UnlockModal({ type, cost, onClose }: { type: BodyType; cost: number; onClose: () => void }) {
  const { totalCreditsEarned, unlockBodyType } = useGameStore()
  const def = BODY_DEFS.find(d => d.type === type)
  const canAfford = totalCreditsEarned >= cost
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="bg-black/90 border border-yellow-500/30 rounded-2xl p-8 w-full max-w-sm shadow-2xl"
        onClick={e => e.stopPropagation()}>
        <div className="text-center mb-6">
          <Lock className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
          <h3 className="text-white text-lg font-light tracking-widest uppercase">{def?.label}</h3>
          <p className="text-white/40 text-xs mt-1">{def?.desc}</p>
        </div>
        <div className="bg-white/5 rounded-lg p-4 mb-6 text-center">
          <span className="text-yellow-400 font-mono text-2xl">{cost}</span>
          <span className="text-white/40 text-xs ml-2">total credits required</span>
          <div className="mt-2 text-white/30 text-xs">You have earned: <span className="text-white/60">{totalCreditsEarned}</span></div>
        </div>
        {canAfford ? (
          <button onClick={() => { unlockBodyType(type); onClose() }}
            className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 rounded text-black text-xs uppercase tracking-widest font-bold transition-colors">
            Unlock Now
          </button>
        ) : (
          <div className="text-center text-white/30 text-xs">Keep earning credits to unlock this entity</div>
        )}
      </div>
    </motion.div>
  )
}

// Modal for reassigning a body's orbit to a new parent
function ReOrbitModal({ body, onClose }: { body: import('../store/gameStore').CelestialBody; onClose: () => void }) {
  const { bodies, reassignOrbit } = useGameStore()
  const [warning, setWarning] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const bodyMass = (body.mass || defaultMass[body.type] || 0.001) * (body.mergeScale || 1)

  // Candidates: all bodies except self, self's current children (would be circular), and bodies lighter than self
  const isDescendant = (ancestorId: string, targetId: string): boolean => {
    const children = bodies.filter(b => b.parentId === ancestorId)
    return children.some(c => c.id === targetId || isDescendant(c.id, targetId))
  }

  const candidates = bodies.filter(b => {
    if (b.id === body.id) return false
    if (isDescendant(body.id, b.id)) return false // would be circular
    return true
  }).map(b => {
    const bMass = (b.mass || defaultMass[b.type] || 0.001) * (b.mergeScale || 1)
    return { ...b, effectiveMass: bMass, canOrbit: bMass > bodyMass }
  }).sort((a, b) => b.effectiveMass - a.effectiveMass)

  const handleSelect = (targetId: string | null) => {
    const result = reassignOrbit(body.id, targetId)
    if (!result.ok) {
      setWarning(result.reason || 'Cannot reassign orbit.')
      setTimeout(() => setWarning(null), 3500)
    } else {
      const targetName = targetId ? bodies.find(b => b.id === targetId)?.name : 'free space'
      setSuccess(`${body.name} now orbits ${targetName}`)
      setTimeout(() => { setSuccess(null); onClose() }, 1200)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[250] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92, y: 16 }}
        transition={{ type: 'spring', stiffness: 220, damping: 26 }}
        className="w-full max-w-sm bg-black/95 border border-white/12 rounded-2xl p-5 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-white text-sm font-light tracking-[0.2em] uppercase">Change Orbit</h3>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors text-lg leading-none">✕</button>
        </div>
        <p className="text-white/35 text-[10px] mb-4 font-mono">
          Select a body for <span className="text-white/60">{body.name}</span> to orbit.
          Only bodies more massive than {bodyMass.toFixed(4)} M☉ are valid.
        </p>

        {/* Warning / success */}
        <AnimatePresence>
          {warning && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex gap-2 items-start mb-3 p-3 bg-red-500/10 border border-red-500/25 rounded-xl text-red-300 text-[10px] leading-relaxed">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              {warning}
            </motion.div>
          )}
          {success && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mb-3 p-3 bg-green-500/10 border border-green-500/25 rounded-xl text-green-300 text-[10px] text-center">
              ✓ {success}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {/* Free float option */}
          {body.parentId && (
            <button
              onClick={() => handleSelect(null)}
              className="w-full flex items-center gap-3 p-3 rounded-xl border border-white/8 bg-white/3 hover:bg-white/8 hover:border-white/15 transition-all text-left"
            >
              <div className="w-7 h-7 rounded-lg bg-white/6 border border-white/10 flex items-center justify-center shrink-0">
                <GitBranch className="w-3.5 h-3.5 text-white/40" />
              </div>
              <div>
                <div className="text-white/70 text-xs">Release to free space</div>
                <div className="text-white/30 text-[10px] font-mono">detach from current orbit</div>
              </div>
            </button>
          )}

          {candidates.map(c => (
            <button
              key={c.id}
              onClick={() => c.canOrbit ? handleSelect(c.id) : setWarning(
                `${body.name} (${bodyMass.toFixed(4)} M☉) is too massive to orbit ${c.name} (${c.effectiveMass.toFixed(4)} M☉).`
              )}
              className={cn(
                'w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left',
                c.id === body.parentId
                  ? 'border-blue-500/30 bg-blue-500/8'
                  : c.canOrbit
                    ? 'border-white/8 bg-white/3 hover:bg-white/8 hover:border-white/15'
                    : 'border-white/4 bg-white/2 opacity-50 cursor-not-allowed'
              )}
            >
              <div className={cn(
                'w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 text-[9px] font-mono',
                c.canOrbit ? 'bg-white/8 border-white/15 text-white/60' : 'bg-white/3 border-white/8 text-white/25'
              )}>
                {c.type.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className={cn('text-xs truncate', c.canOrbit ? 'text-white/80' : 'text-white/30')}>
                  {c.name}
                  {c.id === body.parentId && <span className="ml-2 text-blue-400/60 text-[9px]">current</span>}
                </div>
                <div className="text-[10px] font-mono text-white/30">
                  {c.type.replace('_', ' ')} · {c.effectiveMass.toFixed(4)} M☉
                  {!c.canOrbit && <span className="text-red-400/60 ml-1">— too light</span>}
                </div>
              </div>
              {c.canOrbit && c.id !== body.parentId && (
                <Orbit className="w-3.5 h-3.5 text-white/20 shrink-0" />
              )}
            </button>
          ))}

          {candidates.length === 0 && !body.parentId && (
            <div className="text-center text-white/25 text-xs py-4">No valid orbit targets in the system.</div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

export function UIOverlay() {
  const {
    coins, totalCreditsEarned, mode, bodies, selectedBodyId,
    spendCoins, updateBody, removeBody, chapter, turnCount,
    pendingPlacement, setPendingPlacement, unlockedTypes,
    storyOutcomes, setOrbitInclination,
  } = useGameStore()
  const selectBody = useGameStore(s => s.selectBody)

  const [showSettings, setShowSettings] = useState(false)
  const [showPlacementModal, setShowPlacementModal] = useState<BodyType | null>(null)
  const [showUnlockModal, setShowUnlockModal] = useState<BodyType | null>(null)
  const [showReOrbit, setShowReOrbit] = useState(false)
  const [showRoster, setShowRoster] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [renameVal, setRenameVal] = useState('')
  const [toast, setToast] = useState<{ msg: string; type: 'info' | 'success' | 'warning' } | null>(null)
  const prevCoins = useRef(coins)

  // Listen for keyboard shortcut placement events from App.tsx
  useEffect(() => {
    const handler = (e: Event) => {
      const { type, cost } = (e as CustomEvent<{ type: BodyType; cost: number }>).detail
      handleBodyTypeClick(type, cost)
    }
    window.addEventListener('kbShortcutPlace', handler)
    return () => window.removeEventListener('kbShortcutPlace', handler)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coins, unlockedTypes])

  useEffect(() => {
    if (coins > prevCoins.current) {
      showToast(`+${coins - prevCoins.current} Credits`, 'success')
    }
    prevCoins.current = coins
  }, [coins])

  const showToast = (msg: string, type: 'info' | 'success' | 'warning') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2500)
  }

  const selectedBody = bodies.find(b => b.id === selectedBodyId)

  const chapterLabel = useMemo(() => {
    const labels: Record<number, string> = { 1: 'Genesis', 2: 'Expansion', 3: 'Conflict', 4: 'Reckoning' }
    return labels[chapter] || `Chapter ${chapter}`
  }, [chapter])

  const handleBodyTypeClick = (type: BodyType, cost: number) => {
    if (!unlockedTypes.includes(type)) {
      setShowUnlockModal(type)
      return
    }
    if (!spendCoins(cost)) {
      showToast('Insufficient Credits', 'warning')
      return
    }
    setShowPlacementModal(type)
    soundManager.playSelect()
  }

  const handlePlacementConfirm = (name: string) => {
    if (!showPlacementModal) return
    setPendingPlacement({ type: showPlacementModal, cost: 0, name })
    setShowPlacementModal(null)
    showToast('Click in space to place', 'info')
  }

  const handleRename = () => {
    if (selectedBody && renameVal.trim()) {
      updateBody(selectedBody.id, { name: renameVal.trim() })
      setRenaming(false)
      soundManager.playSelect()
    }
  }

  const handleRemove = () => {
    if (selectedBody) {
      removeBody(selectedBody.id)
      selectBody(null)
    }
  }

  const toastColors = { success: 'text-green-400 border-green-500/30', info: 'text-blue-400 border-blue-500/30', warning: 'text-yellow-400 border-yellow-500/30' }

  return (
    <>
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className={`fixed top-6 left-1/2 z-[300] px-5 py-2 bg-black/90 border rounded-full text-sm font-mono backdrop-blur-md ${toastColors[toast.type]}`}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Placement modal */}
      <AnimatePresence>
        {showPlacementModal && (
          <PlacementModal
            type={showPlacementModal}
            onConfirm={handlePlacementConfirm}
            onCancel={() => { setShowPlacementModal(null); /* refund */ }}
          />
        )}
      </AnimatePresence>

      {/* Unlock modal */}
      <AnimatePresence>
        {showUnlockModal && (
          <UnlockModal
            type={showUnlockModal}
            cost={UNLOCK_COSTS[showUnlockModal] || 0}
            onClose={() => setShowUnlockModal(null)}
          />
        )}
      </AnimatePresence>

      {/* Settings */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <SettingsMenu onClose={() => setShowSettings(false)} />
          </div>
        )}
      </AnimatePresence>

      {/* Re-orbit modal */}
      <AnimatePresence>
        {showReOrbit && selectedBody && (
          <ReOrbitModal body={selectedBody} onClose={() => setShowReOrbit(false)} />
        )}
      </AnimatePresence>

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-4 pointer-events-none">
        <div className="flex items-center gap-4">
          <div className="text-white/80 font-mono text-xs uppercase tracking-widest">
            {mode === 'story' ? `${chapterLabel} · Cycle ${turnCount}` : `Open World · ${bodies.length} Bodies`}
          </div>
          {mode === 'story' && (
            <div className="text-white/30 text-[10px] font-mono">
              {storyOutcomes.length > 0 && `Last: ${storyOutcomes[storyOutcomes.length - 1].slice(0, 40)}...`}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="flex items-center gap-2 bg-black/60 border border-white/10 rounded-full px-4 py-1.5 backdrop-blur-md">
            <span className="text-yellow-400 font-mono text-sm">{coins.toLocaleString()}</span>
            <span className="text-white/30 text-[10px] uppercase tracking-wider">Credits</span>
            <span className="text-white/15 text-[9px] font-mono">/ {totalCreditsEarned.toLocaleString()} earned</span>
          </div>
          <button
            onClick={() => setShowRoster(r => !r)}
            className={cn(
              'p-2 border rounded-full backdrop-blur-md transition-colors',
              showRoster
                ? 'bg-white/15 border-white/25 text-white'
                : 'bg-black/60 border-white/10 hover:bg-white/10 text-white/60'
            )}
            title="System Roster"
          >
            <List className="w-4 h-4" />
          </button>
          <button onClick={() => setShowSettings(true)}
            className="p-2 bg-black/60 border border-white/10 rounded-full backdrop-blur-md hover:bg-white/10 transition-colors">
            <Settings className="w-4 h-4 text-white/60" />
          </button>
        </div>
      </div>

      {/* System Roster panel */}
      <AnimatePresence>
        {showRoster && (
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
            className="absolute left-4 top-16 z-20 w-64 bg-black/90 border border-white/12 rounded-2xl backdrop-blur-xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
              <span className="text-[10px] font-mono text-white/40 uppercase tracking-[0.3em]">
                System Roster · {bodies.length}
              </span>
              <button onClick={() => setShowRoster(false)} className="text-white/25 hover:text-white/60 transition-colors">
                ✕
              </button>
            </div>

            {/* Body list */}
            <div className="max-h-[60vh] overflow-y-auto">
              {bodies.length === 0 ? (
                <div className="px-4 py-6 text-center text-white/25 text-xs">No bodies in system</div>
              ) : (
                // Group: root bodies first, then children indented
                (() => {
                  const roots = bodies.filter(b => !b.parentId)
                  const childrenOf = (id: string) => bodies.filter(b => b.parentId === id)

                  const stateColor = (state: string) => {
                    if (state === 'critical') return 'bg-red-500'
                    if (state === 'stressed') return 'bg-yellow-500'
                    if (state === 'evolving') return 'bg-green-400'
                    return 'bg-blue-400'
                  }

                  const eqColor = (eq: number) => {
                    if (eq < 25) return 'bg-red-500'
                    if (eq < 50) return 'bg-yellow-500'
                    return 'bg-green-400'
                  }

                  const renderBody = (body: typeof bodies[0], depth = 0) => {
                    const isSelected = selectedBodyId === body.id
                    const children = childrenOf(body.id)
                    return (
                      <div key={body.id}>
                        <button
                          onClick={() => {
                            selectBody(body.id)
                            soundManager.playSelect()
                          }}
                          className={cn(
                            'w-full flex items-center gap-2.5 px-4 py-2.5 transition-all text-left hover:bg-white/6',
                            isSelected && 'bg-white/8 border-l-2 border-blue-400',
                            !isSelected && 'border-l-2 border-transparent',
                          )}
                          style={{ paddingLeft: `${16 + depth * 16}px` }}
                        >
                          {/* State dot */}
                          <div className={cn('w-1.5 h-1.5 rounded-full shrink-0', stateColor(body.state))} />

                          {/* Name + type */}
                          <div className="flex-1 min-w-0">
                            <div className={cn('text-xs truncate', isSelected ? 'text-white' : 'text-white/70')}>
                              {body.name}
                            </div>
                            <div className="text-[9px] text-white/30 font-mono capitalize">
                              {body.type.replace('_', ' ')}
                              {body.parentId && (
                                <span className="text-white/20"> · orbiting {bodies.find(b => b.id === body.parentId)?.name}</span>
                              )}
                            </div>
                          </div>

                          {/* Equilibrium mini-bar */}
                          <div className="w-10 shrink-0">
                            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                              <div
                                className={cn('h-full rounded-full transition-all', eqColor(body.equilibrium))}
                                style={{ width: `${body.equilibrium}%` }}
                              />
                            </div>
                            <div className="text-[8px] text-white/25 font-mono text-right mt-0.5">
                              {Math.round(body.equilibrium)}%
                            </div>
                          </div>
                        </button>

                        {/* Children indented */}
                        {children.map(c => renderBody(c, depth + 1))}
                      </div>
                    )
                  }

                  return roots.map(r => renderBody(r))
                })()
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Open World: Body placement toolbar */}
      {mode === 'open_world' && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 120 }}
          className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 flex gap-2 bg-black/80 border border-white/10 rounded-2xl p-3 backdrop-blur-xl shadow-2xl"
        >
          {BODY_DEFS.map(({ type, label, icon: Icon, desc, key }) => {
            const cost = BODY_COSTS[type]
            const unlocked = unlockedTypes.includes(type)
            const canAfford = coins >= cost
            const isPending = pendingPlacement?.type === type
            return (
              <motion.button
                key={type}
                whileHover={{ scale: 1.08, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleBodyTypeClick(type, cost)}
                title={`${label} — ${cost} credits\n${desc}${key ? ` [${key}]` : ''}`}
                className={cn(
                  'relative flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all text-center min-w-[56px]',
                  isPending ? 'bg-blue-600/40 border border-blue-400/60' :
                  !unlocked ? 'bg-white/3 border border-white/5 opacity-60' :
                  !canAfford ? 'bg-white/3 border border-white/5 opacity-40' :
                  'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20'
                )}
              >
                {!unlocked && <Lock className="absolute top-1 right-1 w-2.5 h-2.5 text-yellow-400" />}
                {key && unlocked && (
                  <span className="absolute top-1 left-1 text-[8px] font-mono text-white/30 leading-none">{key}</span>
                )}
                <Icon className={cn('w-5 h-5', !canAfford && unlocked ? 'text-white/30' : 'text-white/80')} />
                <span className="text-[9px] text-white/50 uppercase tracking-wider leading-none">{label}</span>
                <span className={cn('text-[9px] font-mono', canAfford && unlocked ? 'text-yellow-400' : 'text-white/20')}>
                  {cost}
                </span>
              </motion.button>
            )
          })}
        </motion.div>
      )}

      {/* Pending placement indicator */}
      <AnimatePresence>
        {pendingPlacement && (() => {
          // Mirror Hill sphere SOI logic from placeBodyAt to show which body will be parent
          const placedMass = defaultMass[pendingPlacement.type] ?? 0.001
          let parentName: string | null = null
          // Find the most massive body heavier than placed (simplified hint — no click pos yet)
          let bestHill = Infinity
          bodies.forEach((b) => {
            const bMass = (b.mass || defaultMass[b.type] || 0.001) * (b.mergeScale || 1)
            if (bMass <= placedMass) return
            // Use orbit radius as proxy for hill sphere size
            const hill = b.parentId ? (b.orbitRadius || 10) * Math.cbrt(bMass / 3) : 200
            if (hill < bestHill) { bestHill = hill; parentName = b.name }
          })
          return (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-36 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 bg-blue-900/80 border border-blue-400/40 rounded-full px-5 py-2 backdrop-blur-md"
            >
              <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              <span className="text-blue-200 text-xs font-mono">
                Click to place "{pendingPlacement.name}"
                {parentName
                  ? <span className="text-blue-400/70"> → click near {parentName} to orbit it</span>
                  : <span className="text-blue-400/50"> → free-floating (no parent found)</span>
                }
              </span>
              <button onClick={() => setPendingPlacement(null)} className="text-blue-400/60 hover:text-blue-200 text-xs ml-2">✕</button>
            </motion.div>
          )
        })()}
      </AnimatePresence>

      {/* Selected body panel — right side, vertically centered */}
      <AnimatePresence>
        {selectedBody && (
          <motion.div
            key={selectedBody.id}
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 26 }}
            className="absolute right-4 top-16 z-20 w-72 bg-black/92 border border-white/15 rounded-2xl p-4 backdrop-blur-xl shadow-2xl max-h-[calc(100vh-8rem)] overflow-y-auto"
          >
            {/* Header row */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                {renaming ? (
                  <div className="flex gap-2">
                    <input autoFocus value={renameVal} onChange={e => setRenameVal(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setRenaming(false) }}
                      className="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm font-mono w-36 outline-none focus:border-blue-400"
                    />
                    <button onClick={handleRename} className="text-green-400 text-xs px-2 py-1 bg-green-900/30 rounded hover:bg-green-900/50">✓</button>
                  </div>
                ) : (
                  <button onClick={() => { setRenameVal(selectedBody.name); setRenaming(true) }}
                    className="text-white font-light text-base tracking-wide hover:text-blue-200 transition-colors text-left truncate max-w-[200px] block">
                    {selectedBody.name}
                  </button>
                )}
                <div className="text-white/35 text-[10px] uppercase tracking-widest mt-0.5 flex items-center gap-2">
                  <span>{selectedBody.type.replace(/_/g, ' ')}</span>
                  <span className={cn('font-mono',
                    selectedBody.state === 'critical' ? 'text-red-400' :
                    selectedBody.state === 'stressed' ? 'text-yellow-400' :
                    selectedBody.state === 'evolving' ? 'text-green-400' : 'text-blue-300/70'
                  )}>· {selectedBody.state}</span>
                </div>
              </div>
              <button onClick={() => selectBody(null)} className="text-white/25 hover:text-white transition-colors text-lg leading-none ml-2 shrink-0">✕</button>
            </div>

            {/* Stats grid — 2 columns */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-3">
              <div>
                <div className="text-[9px] text-white/30 uppercase tracking-wider">Mass</div>
                <div className="text-xs text-white/70 font-mono">{selectedBody.mass?.toFixed(4)} M☉</div>
              </div>
              <div>
                <div className="text-[9px] text-white/30 uppercase tracking-wider">Merge ×</div>
                <div className="text-xs text-white/70 font-mono">{(selectedBody.mergeCount ?? 0) + 1}</div>
              </div>
              {selectedBody.orbitRadius > 0 && <>
                <div>
                  <div className="text-[9px] text-white/30 uppercase tracking-wider">Orbit Radius</div>
                  <div className="text-xs text-white/70 font-mono">{selectedBody.orbitRadius.toFixed(1)} AU</div>
                </div>
                <div>
                  <div className="text-[9px] text-white/30 uppercase tracking-wider">Orbital Speed</div>
                  <div className="text-xs text-white/70 font-mono">{selectedBody.orbitSpeed.toFixed(3)} r/s</div>
                </div>
              </>}
              {selectedBody.parentId && (
                <div className="col-span-2">
                  <div className="text-[9px] text-white/30 uppercase tracking-wider">Orbiting</div>
                  <div className="text-xs text-white/60 font-mono truncate">
                    {bodies.find(b => b.id === selectedBody.parentId)?.name ?? '—'}
                  </div>
                </div>
              )}
            </div>

            {/* Equilibrium bar */}
            <EquilibriumBar value={selectedBody.equilibrium} />

            {/* Orbit tilt slider */}
            {selectedBody.parentId && (
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-[9px] text-white/30 uppercase tracking-wider">
                  <span>Orbit Tilt</span>
                  <span className="font-mono text-white/40">{((selectedBody.orbitInclination ?? 0) * 180 / Math.PI).toFixed(0)}°</span>
                </div>
                <input
                  type="range" min={0} max={Math.PI} step={0.01}
                  value={selectedBody.orbitInclination ?? 0}
                  onChange={e => setOrbitInclination(selectedBody.id, parseFloat(e.target.value))}
                  className="w-full h-1 accent-blue-400 cursor-pointer"
                />
                <div className="flex justify-between text-[8px] text-white/15 font-mono">
                  <span>flat</span><span>polar</span><span>retrograde</span>
                </div>
              </div>
            )}

            {/* Drag hint */}
            {!selectedBody.parentId && mode === 'open_world' && (
              <div className="text-[9px] text-white/20 text-center mt-2">drag to reposition</div>
            )}

            {/* Action buttons */}
            {mode !== 'story' && (
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => setShowReOrbit(true)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-900/20 hover:bg-blue-900/40 border border-blue-500/20 rounded-lg text-blue-400 text-[10px] uppercase tracking-wider transition-colors"
                >
                  <Orbit className="w-3 h-3" />
                  Change Orbit
                </button>
                <button onClick={handleRemove}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-900/20 hover:bg-red-900/40 border border-red-500/20 rounded-lg text-red-400 text-[10px] uppercase tracking-wider transition-colors">
                  <Trash2 className="w-3 h-3" />
                  Disintegrate
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Next Cycle button */}
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="absolute bottom-6 right-6 z-20"
      >
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => { soundManager.init(); useGameStore.getState().nextTurn() }}
          className="px-6 py-3 bg-white/8 hover:bg-white/15 border border-white/15 rounded-xl text-white/80 text-xs uppercase tracking-widest backdrop-blur-md transition-all shadow-lg"
        >
          Next Cycle →
        </motion.button>
      </motion.div>

      {/* Story mode: outcomes log */}
      {mode === 'story' && storyOutcomes.length > 0 && (
        <motion.div
          initial={{ x: -300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="absolute left-4 bottom-16 z-20 w-64 bg-black/70 border border-white/10 rounded-xl p-4 backdrop-blur-md"
        >
          <div className="text-white/40 text-[10px] uppercase tracking-widest mb-3">Chronicle</div>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {storyOutcomes.map((o, i) => (
              <div key={i} className="text-white/60 text-[10px] leading-relaxed border-l border-white/10 pl-2">
                {o}
              </div>
            ))}
          </div>
        </motion.div>
      )}


    </>
  )
}
