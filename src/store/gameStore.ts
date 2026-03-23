import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import { createClient } from '@supabase/supabase-js'
import { soundManager } from '../lib/sound'
import { ensureSaveSlots } from '../db/migrate'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
export const supabase = createClient(supabaseUrl || '', supabaseKey || '')

export type GameMode = 'intro' | 'menu' | 'story' | 'open_world'
export type BodyType =
  | 'star' | 'planet' | 'moon' | 'gas_giant' | 'black_hole' | 'nebula'
  | 'neutron_star' | 'asteroid_belt' | 'comet' | 'pulsar' | 'white_dwarf' | 'supernova'
export type BodyState = 'stable' | 'evolving' | 'stressed' | 'critical'

export const UNLOCK_COSTS: Partial<Record<BodyType, number>> = {
  neutron_star: 500, pulsar: 800, white_dwarf: 600,
  supernova: 1200, comet: 300, asteroid_belt: 400,
}

export const BODY_COSTS: Record<BodyType, number> = {
  star: 50, planet: 30, moon: 10, gas_giant: 40,
  black_hole: 200, nebula: 100, neutron_star: 80,
  asteroid_belt: 25, comet: 15, pulsar: 120,
  white_dwarf: 90, supernova: 300,
}

export interface CelestialBody {
  id: string
  type: BodyType
  x: number; y: number; z: number
  equilibrium: number
  state: BodyState
  name: string
  parentId: string | null
  orbitRadius: number
  orbitSpeed: number
  orbitAngle: number
  orbitInclination: number  // tilt of the orbital plane in radians (0 = flat, π/2 = polar)
  rotationSpeed: number
  axialTilt: number
  mass: number
  mergeScale: number   // visual size multiplier from merges, starts at 1
  mergeCount: number   // how many times merged
}

// Scientific fusion rules: what two body types produce when merged
export const FUSION_RULES: Partial<Record<string, BodyType>> = {
  'planet+planet':       'gas_giant',
  'gas_giant+gas_giant': 'star',
  'star+star':           'neutron_star',
  'neutron_star+neutron_star': 'black_hole',
  'star+nebula':         'supernova',
  'planet+moon':         'planet',       // moon absorbed, planet grows
  'white_dwarf+planet':  'neutron_star',
  'star+black_hole':     'black_hole',
  'nebula+nebula':       'star',
  'comet+planet':        'planet',
  'asteroid_belt+planet':'planet',
  'pulsar+neutron_star': 'black_hole',
  'gas_giant+planet':    'gas_giant',
  'moon+moon':           'planet',
}

export interface GameEvent {
  id: string
  bodyId: string
  title: string
  description: string
  isStoryEvent?: boolean
  choices: {
    label: string
    description: string
    type: 'genesis' | 'equilibrium' | 'collapse'
    effect: (body: CelestialBody) => Partial<CelestialBody>
    coinReward: number
    outcome: string
  }[]
}

interface GameSettings {
  volume: number
  motionSensitivity: number
  showOrbits: boolean
  showLabels: boolean
  graphicsQuality: 'low' | 'medium' | 'high'
  bloomIntensity: number
}

interface GameState {
  sessionId: string | null
  mode: GameMode
  coins: number
  totalCreditsEarned: number
  unlockedTypes: BodyType[]
  chapter: number
  turnCount: number
  bodies: CelestialBody[]
  selectedBodyId: string | null
  isPaused: boolean
  currentEvent: GameEvent | null
  gameOver: { isOver: boolean; reason: string } | null
  settings: GameSettings
  pendingPlacement: { type: BodyType; cost: number; name: string } | null
  storyOutcomes: string[]
  narratorMessage: string | null
  narratorFocusBodyId: string | null  // camera zooms to this body when narrator speaks
  narratorDone: boolean               // true once typewriter finishes
  mergeFlash: string | null  // bodyId that just merged, for animation trigger
  bigBang: boolean           // catastrophic collision — triggers full-screen animation + restart
  initSession: () => Promise<void>
  setMode: (mode: GameMode) => Promise<void>
  addBody: (body: Omit<CelestialBody, 'id'>) => Promise<void>
  restartGame: () => void
  updateBody: (id: string, updates: Partial<CelestialBody>) => Promise<void>
  removeBody: (id: string) => Promise<void>
  selectBody: (id: string | null) => void
  addCoins: (amount: number) => void
  spendCoins: (amount: number) => boolean
  nextTurn: () => void
  resolveEvent: (choiceIndex: number) => void
  togglePause: () => void
  updateSettings: (settings: Partial<GameSettings>) => void
  setPendingPlacement: (p: { type: BodyType; cost: number; name: string } | null) => void
  unlockBodyType: (type: BodyType) => boolean
  placeBodyAt: (x: number, z: number) => Promise<void>
  checkMerge: (newBodyId: string) => Promise<void>
  setNarrator: (msg: string | null, focusBodyId?: string | null) => void
  setNarratorDone: () => void
  triggerBigBang: () => void
  moveBody: (id: string, x: number, z: number) => void
  setOrbitInclination: (id: string, inclination: number) => void
  reassignOrbit: (bodyId: string, newParentId: string | null) => { ok: boolean; reason?: string }
  // Save / Load
  saveProgress: (slotIndex: 1 | 2 | 3, label?: string) => Promise<void>
  loadSave: (slotIndex: 1 | 2 | 3) => Promise<boolean>
  deleteSave: (slotIndex: 1 | 2 | 3) => Promise<void>
  listSaves: () => Promise<SaveSlot[]>
}

export interface SaveSlot {
  slot_index: 1 | 2 | 3
  label: string
  mode: GameMode
  coins: number
  chapter: number
  turn_count: number
  total_credits: number
  body_count: number
  saved_at: string
}

const keplerOrbitSpeed = (radius: number, parentMass = 1) =>
  (0.8 * Math.sqrt(parentMass)) / Math.sqrt(Math.max(radius, 0.5))

export const defaultMass: Record<BodyType, number> = {
  star: 1.0, planet: 0.001, moon: 0.0001, gas_giant: 0.01,
  black_hole: 10, nebula: 0.5, neutron_star: 1.4,
  asteroid_belt: 0.0001, comet: 0.00001, pulsar: 1.5,
  white_dwarf: 0.6, supernova: 5,
}

const BASE_UNLOCKED: BodyType[] = ['star', 'planet', 'moon', 'gas_giant', 'black_hole', 'nebula']

const STORY_EVENTS: GameEvent[] = [
  {
    id: 'story_1', bodyId: '', isStoryEvent: true,
    title: 'The First Light',
    description: 'Sol Prime flickers — a proto-stellar instability threatens ignition. The fate of the system hangs on your first decision.',
    choices: [
      { label: 'Channel Gravitational Pressure', description: 'Compress the core to trigger fusion.',
        type: 'genesis', effect: () => ({ equilibrium: 85, state: 'evolving' as BodyState }), coinReward: 60,
        outcome: 'Sol Prime ignites in a blaze of golden light. The system is born.' },
      { label: 'Stabilize Plasma Currents', description: 'Regulate the magnetic field for a steady burn.',
        type: 'equilibrium', effect: () => ({ equilibrium: 65, state: 'stable' as BodyState }), coinReward: 30,
        outcome: 'Sol Prime burns steadily. A reliable anchor for the system.' },
      { label: 'Allow Natural Collapse', description: 'Let entropy decide the outcome.',
        type: 'collapse', effect: () => ({ equilibrium: 30, state: 'stressed' as BodyState }), coinReward: 5,
        outcome: 'Sol Prime sputters. The system begins in fragility.' },
    ],
  },
  {
    id: 'story_2', bodyId: '', isStoryEvent: true,
    title: 'Terra Nova Awakens',
    description: 'Terra Nova shows signs of geological activity. Tectonic forces are reshaping its surface.',
    choices: [
      { label: 'Accelerate Plate Tectonics', description: 'Encourage mountain formation and volcanic activity.',
        type: 'genesis', effect: () => ({ equilibrium: 75, state: 'evolving' as BodyState }), coinReward: 50,
        outcome: 'Terra Nova becomes geologically rich — a cradle for complexity.' },
      { label: 'Dampen Seismic Activity', description: 'Reduce volatility for a calmer world.',
        type: 'equilibrium', effect: () => ({ equilibrium: 55, state: 'stable' as BodyState }), coinReward: 25,
        outcome: 'Terra Nova settles into a quiet, stable world.' },
      { label: 'Trigger Volcanic Cascade', description: 'Unleash the inner heat — consequences unknown.',
        type: 'collapse', effect: () => ({ equilibrium: 20, state: 'critical' as BodyState }), coinReward: 10,
        outcome: 'Terra Nova erupts in catastrophic volcanism. Stability is shattered.' },
    ],
  },
  {
    id: 'story_3', bodyId: '', isStoryEvent: true,
    title: "Behemoth's Gravity Well",
    description: "Behemoth's immense gravity is pulling nearby asteroids into dangerous trajectories.",
    choices: [
      { label: 'Redirect Asteroid Streams', description: 'Use Behemoth as a gravitational shield.',
        type: 'genesis', effect: () => ({ equilibrium: 70, state: 'stable' as BodyState }), coinReward: 45,
        outcome: "Behemoth becomes the system's guardian, deflecting threats." },
      { label: 'Stabilize Orbital Resonance', description: 'Lock Behemoth into a protective resonance pattern.',
        type: 'equilibrium', effect: () => ({ equilibrium: 50, state: 'stable' as BodyState }), coinReward: 20,
        outcome: 'Orbital resonance achieved. The system finds balance.' },
      { label: 'Let Chaos Reign', description: 'Allow the gravitational chaos to play out.',
        type: 'collapse', effect: () => ({ equilibrium: 25, state: 'stressed' as BodyState }), coinReward: 8,
        outcome: 'Asteroid impacts destabilize the inner system.' },
    ],
  },
]

export const useGameStore = create<GameState>((set, get) => ({
  sessionId: localStorage.getItem('cartographer_session_id'),
  mode: 'intro',
  coins: 150,
  totalCreditsEarned: 0,
  unlockedTypes: [...BASE_UNLOCKED],
  chapter: 1,
  turnCount: 0,
  bodies: [],
  selectedBodyId: null,
  isPaused: false,
  currentEvent: null,
  gameOver: null,
  pendingPlacement: null,
  storyOutcomes: [],
  narratorMessage: null,
  narratorFocusBodyId: null,
  narratorDone: false,
  mergeFlash: null,
  bigBang: false,
  settings: {
    volume: 50, motionSensitivity: 1.0,
    showOrbits: true, showLabels: true,
    graphicsQuality: 'high', bloomIntensity: 1.0,
  },

  initSession: async () => {
    // Ensure save_slots table and missing columns exist
    await ensureSaveSlots()

    let sessionId = get().sessionId
    if (!sessionId) {
      sessionId = uuidv4()
      localStorage.setItem('cartographer_session_id', sessionId)
      set({ sessionId })
    }
    try {
      const { data: session } = await supabase
        .from('game_sessions').select('*').eq('id', sessionId).single()
      if (session) {
        const restoredMode = (session.mode as GameMode) || 'menu'
        const unlockedTypes: BodyType[] = Array.isArray(session.unlocked_types) && session.unlocked_types.length > 0
          ? session.unlocked_types as BodyType[]
          : [...BASE_UNLOCKED]
        set({
          coins: session.coins ?? 150,
          chapter: session.chapter ?? 1,
          turnCount: session.turn_count ?? 0,
          mode: (restoredMode === 'story' || restoredMode === 'open_world') ? restoredMode : 'menu',
          totalCreditsEarned: session.total_credits ?? 0,
          storyOutcomes: Array.isArray(session.story_outcomes) ? session.story_outcomes as string[] : [],
          unlockedTypes,
        })
        const { data: bodies } = await supabase
          .from('celestial_bodies').select('*').eq('session_id', sessionId)
        if (bodies && bodies.length > 0) {
          set({ bodies: bodies.map((b: Record<string, unknown>) => ({
            id: b.id as string, type: b.type as BodyType,
            x: b.x as number, y: b.y as number, z: b.z as number,
            equilibrium: b.equilibrium as number, state: b.state as BodyState,
            name: b.name as string, parentId: (b.parent_id as string) || null,
            orbitRadius: (b.orbit_radius as number) || 0,
            orbitSpeed: (b.orbit_speed as number) || 0,
            orbitAngle: (b.orbit_angle as number) || 0,
            orbitInclination: (b.orbit_inclination as number) || 0,
            rotationSpeed: (b.rotation_speed as number) || 0,
            axialTilt: (b.axial_tilt as number) || 0,
            mass: (b.mass as number) || 0.001,
            mergeScale: (b.merge_scale as number) || 1,
            mergeCount: (b.merge_count as number) || 0,
          })) })
        }
      } else {
        await supabase.from('game_sessions').insert({
          id: sessionId, coins: 150, total_credits: 0,
          mode: 'menu', story_outcomes: [], unlocked_types: [...BASE_UNLOCKED],
        })
        set({ mode: 'menu' })
      }
    } catch { set({ mode: 'menu' }) }
  },

  updateSettings: (newSettings) => {
    set((state) => ({ settings: { ...state.settings, ...newSettings } }))
    if (newSettings.volume !== undefined) soundManager.setVolume(newSettings.volume)
  },

  setPendingPlacement: (p) => set({ pendingPlacement: p }),

  unlockBodyType: (type: BodyType) => {
    const cost = UNLOCK_COSTS[type]
    if (!cost) return false
    const { totalCreditsEarned, unlockedTypes } = get()
    if (unlockedTypes.includes(type)) return true
    if (totalCreditsEarned >= cost) {
      set((state) => ({ unlockedTypes: [...state.unlockedTypes, type] }))
      soundManager.playUnlock()
      return true
    }
    return false
  },

  setNarrator: (msg, focusBodyId = null) => set({ narratorMessage: msg, narratorFocusBodyId: focusBodyId, narratorDone: false }),
  setNarratorDone: () => set({ narratorDone: true }),

  triggerBigBang: () => {
    soundManager.playBigBangSound()
    set({ bigBang: true })
    // After animation completes (4.5s), restart the current mode
    setTimeout(() => {
      const { mode } = get()
      set({ bigBang: false, bodies: [], selectedBodyId: null,
        currentEvent: null, gameOver: null, mergeFlash: null,
        narratorMessage: null, pendingPlacement: null })
      // Re-enter the same mode fresh
      get().setMode(mode)
    }, 4500)
  },

  checkMerge: async (newBodyId: string) => {
    const { bodies } = get()
    const newBody = bodies.find(b => b.id === newBodyId)
    if (!newBody) return

    const COLLISION_DIST = 2.5  // true physical collision — no merge possible
    const MERGE_DIST = 4        // close enough to merge/fuse

    const nearby = bodies.find(b => {
      if (b.id === newBodyId) return false
      const dx = b.x - newBody.x, dz = b.z - newBody.z
      const dist = Math.sqrt(dx * dx + dz * dz)
      return dist < MERGE_DIST && b.parentId === newBody.parentId
    })
    if (!nearby) return

    const dx = nearby.x - newBody.x, dz = nearby.z - newBody.z
    const dist = Math.sqrt(dx * dx + dz * dz)

    const key1 = `${newBody.type}+${nearby.type}`
    const key2 = `${nearby.type}+${newBody.type}`
    const fusionResult = FUSION_RULES[key1] || FUSION_RULES[key2]
    const sameType = newBody.type === nearby.type

    // True collision: bodies overlap with no merge/fusion rule → Big Bang
    if (dist < COLLISION_DIST && !fusionResult && !sameType) {
      get().triggerBigBang()
      return
    }

    if (fusionResult) {
      soundManager.playFusion()
      const fusedName = `${nearby.name}-${newBody.name}`
      const fusedMass = (nearby.mass || 0.001) + (newBody.mass || 0.001)
      set((state) => ({
        bodies: state.bodies.filter(b => b.id !== newBodyId && b.id !== nearby.id),
        mergeFlash: nearby.id,
      }))
      await get().addBody({
        type: fusionResult,
        x: nearby.x, y: nearby.y, z: nearby.z,
        equilibrium: Math.min(100, (nearby.equilibrium + newBody.equilibrium) / 2 + 10),
        state: 'evolving',
        name: fusedName,
        parentId: nearby.parentId,
        orbitRadius: nearby.orbitRadius,
        orbitSpeed: nearby.orbitSpeed,
        orbitAngle: nearby.orbitAngle,
        orbitInclination: nearby.orbitInclination ?? 0,
        rotationSpeed: nearby.rotationSpeed,
        axialTilt: nearby.axialTilt,
        mass: fusedMass,
        mergeScale: 1.0,
        mergeCount: (nearby.mergeCount || 0) + 1,
      })
      get().addCoins(80)
      setTimeout(() => set({ mergeFlash: null }), 1500)
    } else if (sameType) {
      soundManager.playMerge()
      const newScale = Math.min(3.0, (nearby.mergeScale || 1) + 0.35)
      const newMass = (nearby.mass || 0.001) + (newBody.mass || 0.001)
      set((state) => ({
        bodies: state.bodies.filter(b => b.id !== newBodyId),
        mergeFlash: nearby.id,
      }))
      await get().updateBody(nearby.id, {
        mergeScale: newScale,
        mergeCount: (nearby.mergeCount || 0) + 1,
        mass: newMass,
        equilibrium: Math.min(100, (nearby.equilibrium || 60) + 8),
        state: 'evolving',
      })
      get().addCoins(30)
      setTimeout(() => set({ mergeFlash: null }), 1500)
    }
  },

  placeBodyAt: async (x: number, z: number) => {
    const { pendingPlacement, bodies } = get()
    if (!pendingPlacement) return

    const placedMass = defaultMass[pendingPlacement.type] || 0.001

    // ── Solar-system-accurate parent selection via Hill Sphere (SOI) ──
    //
    // Each body has a gravitational sphere of influence (Hill sphere).
    // A new body placed within a body's Hill sphere orbits THAT body,
    // not the more massive one further away — exactly like our solar system:
    //   Moon is inside Earth's Hill sphere → orbits Earth, not the Sun.
    //
    // Hill sphere radius: r_H = a * (m / 3M)^(1/3)
    //   a = body's orbit radius around its own parent
    //   m = body's mass,  M = parent's mass
    // For root bodies (stars) we use a large fixed SOI.

    // Build a world-position map: root bodies use stored x/z,
    // orbiting bodies approximate their current position as offset from parent.
    // Since we can't know the exact render-time angle, we use the stored orbitAngle
    // as a static snapshot — good enough for SOI containment checks.
    const worldPos = new Map<string, { x: number; z: number }>()
    const getWorldPos = (id: string): { x: number; z: number } => {
      if (worldPos.has(id)) return worldPos.get(id)!
      const b = bodies.find(b => b.id === id)
      if (!b) return { x: 0, z: 0 }
      if (!b.parentId) {
        worldPos.set(id, { x: b.x, z: b.z })
        return { x: b.x, z: b.z }
      }
      const parentWP = getWorldPos(b.parentId)
      const angle = b.orbitAngle || 0
      const r = b.orbitRadius || 0
      const wx = parentWP.x + Math.cos(angle) * r
      const wz = parentWP.z + Math.sin(angle) * r
      worldPos.set(id, { x: wx, z: wz })
      return { x: wx, z: wz }
    }
    bodies.forEach(b => getWorldPos(b.id))

    // Compute Hill sphere radius for each body
    const hillRadius = (b: typeof bodies[0]): number => {
      if (!b.parentId) {
        // Root body (star/black hole etc.) — SOI covers a large region
        return 200
      }
      const parent = bodies.find(p => p.id === b.parentId)
      if (!parent) return 10
      const M = (parent.mass || defaultMass[parent.type] || 1) * (parent.mergeScale || 1)
      const m = (b.mass || defaultMass[b.type] || 0.001) * (b.mergeScale || 1)
      const a = b.orbitRadius || 10
      return a * Math.cbrt(m / (3 * M))
    }

    // Find the smallest Hill sphere that contains the click point.
    // "Smallest" = most local gravitational owner, like Earth vs Sun.
    let parentId: string | null = null
    let smallestHill = Infinity

    bodies.forEach((b) => {
      const bMass = (b.mass || defaultMass[b.type] || 0.001) * (b.mergeScale || 1)
      if (bMass <= placedMass) return  // can't orbit something lighter than itself

      const wp = getWorldPos(b.id)
      const dx = wp.x - x, dz = wp.z - z
      const dist = Math.sqrt(dx * dx + dz * dz)
      const hill = hillRadius(b)

      if (dist <= hill && hill < smallestHill) {
        smallestHill = hill
        parentId = b.id
      }
    })

    // Orbit radius = distance from click to parent's world position, with a minimum
    let orbitRadius = 0
    if (parentId) {
      const parent = bodies.find(b => b.id === parentId)!
      const wp = getWorldPos(parent.id)
      const rawDist = Math.sqrt((wp.x - x) ** 2 + (wp.z - z) ** 2)
      // Minimum orbit: based on parent's visual size
      const minOrbitByType: Partial<Record<BodyType, number>> = {
        star: 8, gas_giant: 5, black_hole: 6, neutron_star: 4,
        pulsar: 4, planet: 2.5, white_dwarf: 3, supernova: 8,
      }
      const minOrbit = minOrbitByType[parent.type] ?? 3
      orbitRadius = Math.max(rawDist, minOrbit)
    }

    const parentBody = parentId ? bodies.find((b) => b.id === parentId) : null
    const parentMass = parentBody
      ? (parentBody.mass || defaultMass[parentBody.type] || 1) * (parentBody.mergeScale || 1)
      : 1
    const speed = parentId ? keplerOrbitSpeed(orbitRadius, parentMass) : 0

    await get().addBody({
      type: pendingPlacement.type,
      x: parentId ? 0 : x, y: 0, z: parentId ? 0 : z,
      equilibrium: 60, state: 'stable',
      name: pendingPlacement.name,
      parentId, orbitRadius: parentId ? orbitRadius : 0,
      orbitSpeed: speed, orbitAngle: Math.random() * Math.PI * 2,
      orbitInclination: 0,
      rotationSpeed: 0.005 + Math.random() * 0.015,
      axialTilt: (Math.random() - 0.5) * 0.5,
      mass: placedMass,
      mergeScale: 1.0, mergeCount: 0,
    })
    soundManager.playSpawn()
    set({ pendingPlacement: null })
    get().addCoins(100)
    const latestBodies = get().bodies
    const justPlaced = latestBodies[latestBodies.length - 1]
    if (justPlaced) setTimeout(() => get().checkMerge(justPlaced.id), 200)
  },

  setMode: async (mode: GameMode) => {
    set({ mode, currentEvent: null, gameOver: null })
    const { sessionId } = get()
    if (sessionId) {
      supabase.from('game_sessions').update({ mode }).eq('id', sessionId).then()
    }
    if (mode === 'open_world') {
      set({ bodies: [], selectedBodyId: null, turnCount: 0, coins: 1000 })
    }
    if (mode === 'story' && get().bodies.length === 0) {
      const sunId = uuidv4()
      const earthId = uuidv4()
      const jupiterId = uuidv4()
      const storyBodies: CelestialBody[] = [
        { id: sunId, type: 'star', x: 0, y: 0, z: 0, equilibrium: 80, state: 'stable',
          name: 'Sol Prime', parentId: null, orbitRadius: 0, orbitSpeed: 0, orbitAngle: 0,
          orbitInclination: 0, rotationSpeed: 0.002, axialTilt: 0.1, mass: 1.0, mergeScale: 1, mergeCount: 0 },
        { id: earthId, type: 'planet', x: 0, y: 0, z: 0, equilibrium: 60, state: 'stable',
          name: 'Terra Nova', parentId: sunId, orbitRadius: 15,
          orbitSpeed: keplerOrbitSpeed(15, 1.0), orbitAngle: 0.5,
          orbitInclination: 0, rotationSpeed: 0.01, axialTilt: 0.41, mass: 0.001, mergeScale: 1, mergeCount: 0 },
        { id: uuidv4(), type: 'moon', x: 0, y: 0, z: 0, equilibrium: 50, state: 'stable',
          name: 'Luna', parentId: earthId, orbitRadius: 3,
          orbitSpeed: keplerOrbitSpeed(3, 0.001), orbitAngle: 1.2,
          orbitInclination: 0, rotationSpeed: 0.005, axialTilt: 0.02, mass: 0.0001, mergeScale: 1, mergeCount: 0 },
        { id: jupiterId, type: 'gas_giant', x: 0, y: 0, z: 0, equilibrium: 50, state: 'stable',
          name: 'Behemoth', parentId: sunId, orbitRadius: 28,
          orbitSpeed: keplerOrbitSpeed(28, 1.0), orbitAngle: 2.1,
          orbitInclination: 0, rotationSpeed: 0.008, axialTilt: 0.05, mass: 0.01, mergeScale: 1, mergeCount: 0 },
        { id: uuidv4(), type: 'moon', x: 0, y: 0, z: 0, equilibrium: 40, state: 'stable',
          name: 'Titanus', parentId: jupiterId, orbitRadius: 5,
          orbitSpeed: keplerOrbitSpeed(5, 0.01), orbitAngle: 3.5,
          orbitInclination: 0, rotationSpeed: 0.005, axialTilt: 0.1, mass: 0.0001, mergeScale: 1, mergeCount: 0 },
      ]
      set({ bodies: storyBodies, coins: 200, turnCount: 0, storyOutcomes: [] })
      // Initial narrator message — focus on the star
      setTimeout(() => get().setNarrator("Welcome, Cartographer. Sol Prime awaits your guidance. Press 'Next Cycle' to begin shaping the cosmos.", sunId), 800)
      const sid = get().sessionId
      if (sid) {
        supabase.from('celestial_bodies').delete().eq('session_id', sid).then()
        supabase.from('celestial_bodies').insert(
          storyBodies.map((b) => ({
            ...b, session_id: sid, parent_id: b.parentId,
            orbit_radius: b.orbitRadius, orbit_speed: b.orbitSpeed,
            orbit_angle: b.orbitAngle, rotation_speed: b.rotationSpeed,
            axial_tilt: b.axialTilt,
          }))
        ).then()
      }
      setTimeout(() => {
        set({ currentEvent: { ...STORY_EVENTS[0], bodyId: sunId } })
      }, 1500)
    }
  },

  restartGame: async () => {
    const { sessionId } = get()
    set({ coins: 150, turnCount: 0, chapter: 1, bodies: [], selectedBodyId: null,
      gameOver: null, mode: 'menu', storyOutcomes: [], currentEvent: null })
    if (sessionId) {
      await supabase.from('celestial_bodies').delete().eq('session_id', sessionId)
      await supabase.from('game_sessions')
        .update({ coins: 150, turn_count: 0, chapter: 1 }).eq('id', sessionId)
    }
  },

  addBody: async (bodyData) => {
    const { sessionId } = get()
    const newBody: CelestialBody = { id: uuidv4(), ...bodyData }
    set((state) => ({ bodies: [...state.bodies, newBody] }))
    if (!sessionId) return
    try {
      await supabase.from('celestial_bodies').insert({
        id: newBody.id, session_id: sessionId, type: newBody.type,
        x: newBody.x, y: newBody.y, z: newBody.z,
        equilibrium: newBody.equilibrium, state: newBody.state, name: newBody.name,
        parent_id: newBody.parentId, orbit_radius: newBody.orbitRadius,
        orbit_speed: newBody.orbitSpeed, orbit_angle: newBody.orbitAngle,
        orbit_inclination: newBody.orbitInclination ?? 0,
        rotation_speed: newBody.rotationSpeed, axial_tilt: newBody.axialTilt,
        mass: newBody.mass,
      })
    } catch { /* silent */ }
  },

  updateBody: async (id, updates) => {
    set((state) => ({ bodies: state.bodies.map((b) => b.id === id ? { ...b, ...updates } : b) }))
    const dbUpdates: Record<string, unknown> = {}
    if (updates.x !== undefined) dbUpdates.x = updates.x
    if (updates.y !== undefined) dbUpdates.y = updates.y
    if (updates.z !== undefined) dbUpdates.z = updates.z
    if (updates.equilibrium !== undefined) dbUpdates.equilibrium = updates.equilibrium
    if (updates.state !== undefined) dbUpdates.state = updates.state
    if (updates.name !== undefined) dbUpdates.name = updates.name
    if (updates.parentId !== undefined) dbUpdates.parent_id = updates.parentId
    if (updates.orbitRadius !== undefined) dbUpdates.orbit_radius = updates.orbitRadius
    if (updates.orbitSpeed !== undefined) dbUpdates.orbit_speed = updates.orbitSpeed
    if (updates.orbitAngle !== undefined) dbUpdates.orbit_angle = updates.orbitAngle
    if (updates.rotationSpeed !== undefined) dbUpdates.rotation_speed = updates.rotationSpeed
    try { await supabase.from('celestial_bodies').update(dbUpdates).eq('id', id) } catch { /* silent */ }
  },

  // Heavy bodies whose removal cascades to children
  removeBody: async (id) => {
    const HEAVY_TYPES: BodyType[] = ['star', 'black_hole', 'nebula', 'neutron_star', 'pulsar', 'supernova', 'white_dwarf']
    const { bodies } = get()
    const target = bodies.find(b => b.id === id)
    set((state) => {
      const idsToRemove = new Set<string>()
      const isHeavy = target && HEAVY_TYPES.includes(target.type)
      if (isHeavy) {
        // Cascade: remove body and all its children recursively
        const findChildren = (pid: string) => {
          idsToRemove.add(pid)
          state.bodies.filter((b) => b.parentId === pid).forEach((c) => findChildren(c.id))
        }
        findChildren(id)
      } else {
        // Light body: just remove itself, orphan its children (they become free-floating)
        idsToRemove.add(id)
      }
      return {
        bodies: state.bodies
          .filter((b) => !idsToRemove.has(b.id))
          .map((b) => b.parentId === id && !isHeavy
            ? { ...b, parentId: null, orbitRadius: 0, orbitSpeed: 0 }
            : b
          ),
        selectedBodyId: idsToRemove.has(state.selectedBodyId || '') ? null : state.selectedBodyId,
      }
    })
    soundManager.playExplosion()
    try { await supabase.from('celestial_bodies').delete().eq('id', id) } catch { /* silent */ }
  },

  selectBody: (id) => { set({ selectedBodyId: id }); if (id) soundManager.playSelect() },

  addCoins: (amount) => {
    set((state) => {
      const newCoins = state.coins + amount
      const newTotal = state.totalCreditsEarned + amount
      if (state.sessionId) {
        supabase.from('game_sessions')
          .update({ coins: newCoins, total_credits: newTotal })
          .eq('id', state.sessionId).then()
      }
      return { coins: newCoins, totalCreditsEarned: newTotal }
    })
  },

  spendCoins: (amount) => {
    const { coins, sessionId } = get()
    if (coins >= amount) {
      const newCoins = coins - amount
      set({ coins: newCoins })
      if (sessionId) supabase.from('game_sessions').update({ coins: newCoins }).eq('id', sessionId).then()
      return true
    }
    soundManager.playError()
    return false
  },

  nextTurn: () => {
    const { bodies, turnCount, coins, sessionId, mode } = get()
    let newCoins = coins
    const updatedBodies = bodies.map((body) => {
      newCoins += Math.floor(1 + body.equilibrium / 20)
      let eq = body.equilibrium
      const nearBlackHole = bodies.some(
        (b) => b.type === 'black_hole' && b.id !== body.id && body.parentId === b.parentId
      )
      if (nearBlackHole) eq = Math.max(0, eq - 5)
      if (body.type === 'planet' || body.type === 'moon') {
        const hasStar = bodies.some(
          (b) => b.type === 'star' && (b.id === body.parentId || body.parentId === b.id)
        )
        if (hasStar) eq = Math.min(100, eq + 0.5)
      }
      return { ...body, equilibrium: eq }
    })
    set({ bodies: updatedBodies })

    let newEvent: GameEvent | null = null
    if (mode === 'story') {
      const idx = Math.floor(turnCount / 3)
      if (turnCount % 3 === 0 && idx < STORY_EVENTS.length) {
        const storyEv = STORY_EVENTS[idx]
        const targetBody =
          bodies.find((b) =>
            idx === 0 ? b.type === 'star' :
            idx === 1 ? b.name === 'Terra Nova' :
            b.name === 'Behemoth'
          ) || bodies[0]
        if (targetBody) {
          newEvent = { ...storyEv, bodyId: targetBody.id }
          // Narrator intro before the choice modal — focus camera on target
          setTimeout(() => get().setNarrator(`Focus: ${targetBody.name} — ${storyEv.description}`, targetBody.id), 200)
        }
      }
    }

    if (!newEvent && bodies.length > 0 && Math.random() < 0.25) {
      const rb = bodies[Math.floor(Math.random() * bodies.length)]
      const scenarios = [
        { title: 'Solar Flare', desc: `A massive coronal ejection erupts from ${rb.name}.` },
        { title: 'Cosmic Bloom', desc: `Rare cosmic radiation accelerates growth around ${rb.name}.` },
        { title: 'Gravitational Anomaly', desc: `Dark matter is warping space near ${rb.name}.` },
        { title: 'Magnetic Storm', desc: `${rb.name}'s magnetic field is fluctuating wildly.` },
        { title: 'Nebular Drift', desc: `A cloud of ionized gas is approaching ${rb.name}.` },
      ]
      const s = scenarios[Math.floor(Math.random() * scenarios.length)]
      newEvent = {
        id: uuidv4(), bodyId: rb.id,
        title: `${s.title}: ${rb.name}`, description: s.desc,
        choices: [
          { label: 'Stabilize', description: 'Regulate the anomaly for steady output.',
            type: 'equilibrium', effect: () => ({ equilibrium: 50, state: 'stable' as BodyState }),
            coinReward: 20, outcome: 'The anomaly is contained. Stability restored.' },
          { label: 'Harness Energy', description: 'Channel the event for maximum growth.',
            type: 'genesis',
            effect: (b) => ({ equilibrium: Math.min(100, b.equilibrium + 15), state: 'evolving' as BodyState }),
            coinReward: 50, outcome: 'Energy harnessed. The body evolves rapidly.' },
          { label: 'Let It Burn', description: 'Allow the event to run its course.',
            type: 'collapse',
            effect: (b) => ({ equilibrium: Math.max(0, b.equilibrium - 20), state: 'stressed' as BodyState }),
            coinReward: 5, outcome: 'The event causes significant damage.' },
        ],
      }
    }

    if (bodies.some((b) => b.type === 'black_hole') && mode === 'story') {
      set({ gameOver: { isOver: true, reason: 'Singularity Event: A Black Hole has consumed the system.' } })
      soundManager.playExplosion(); return
    }
    if (bodies.length === 0 && turnCount > 1) {
      set({ gameOver: { isOver: true, reason: 'Universal Collapse: No celestial bodies remain.' } })
      soundManager.playExplosion(); return
    }

    if (newEvent) soundManager.playEvent()
    else soundManager.playTick()

    // Story narrator hints
    if (mode === 'story') {
      const hints: { msg: string; focusType?: string }[] = [
        { msg: "Observe the equilibrium bars — keep bodies above 30% to avoid collapse.", focusType: 'planet' },
        { msg: "Harness events wisely. Genesis choices grow your system, but risk is real." },
        { msg: "Credits accumulate each cycle. Earn enough to unlock exotic entities." },
        { msg: "Bodies near a black hole lose equilibrium each cycle. Plan carefully.", focusType: 'black_hole' },
        { msg: "Planets orbiting a star slowly gain equilibrium over time.", focusType: 'star' },
        { msg: "Two bodies of the same type placed close together will merge and grow." },
        { msg: "Scientific fusion can produce entirely new entity types. Experiment." },
      ]
      if (turnCount % 4 === 0) {
        const hint = hints[Math.floor(turnCount / 4) % hints.length]
        const focusBody = hint.focusType ? bodies.find(b => b.type === hint.focusType) : null
        get().setNarrator(hint.msg, focusBody?.id ?? null)
      }
    }

    const newChapter = Math.floor(turnCount / 10) + 1
    set({ turnCount: turnCount + 1, coins: newCoins, currentEvent: newEvent, chapter: newChapter })
    if (sessionId) {
      supabase.from('game_sessions')
        .update({ turn_count: turnCount + 1, coins: newCoins, chapter: newChapter, mode })
        .eq('id', sessionId).then()
    }
  },

  resolveEvent: (choiceIndex: number) => {
    const { currentEvent, bodies, mode } = get()
    if (!currentEvent) return
    const choice = currentEvent.choices[choiceIndex]
    const body = bodies.find((b) => b.id === currentEvent.bodyId)
    if (body) {
      const updates = choice.effect(body)
      if (updates.equilibrium !== undefined && updates.equilibrium <= 0) {
        if (mode !== 'story') get().removeBody(body.id)
        else get().updateBody(body.id, { equilibrium: 5, state: 'critical' })
      } else if (updates.equilibrium !== undefined && updates.equilibrium >= 100) {
        get().addCoins(100)
        get().updateBody(body.id, { ...updates, state: 'evolving' })
      } else {
        get().updateBody(body.id, updates)
      }
      get().addCoins(choice.coinReward)
      if (choice.type === 'genesis') soundManager.playSuccess()
      else if (choice.type === 'collapse') soundManager.playExplosion()
      else soundManager.playSelect()
    }
    if (currentEvent.isStoryEvent) {
      set((state) => ({ storyOutcomes: [...state.storyOutcomes, choice.outcome] }))
      // Narrator follow-up after story event, focus on the affected body
      setTimeout(() => get().setNarrator(choice.outcome + " What will you do next?", currentEvent.bodyId), 400)
    }
    set({ currentEvent: null })
  },

  togglePause: () => set((state) => ({ isPaused: !state.isPaused })),

  moveBody: (id, x, z) => {
    set((state) => ({ bodies: state.bodies.map(b => b.id === id ? { ...b, x, z } : b) }))
    supabase.from('celestial_bodies').update({ x, z }).eq('id', id).then()
  },

  setOrbitInclination: (id, inclination) => {
    set((state) => ({ bodies: state.bodies.map(b => b.id === id ? { ...b, orbitInclination: inclination } : b) }))
    supabase.from('celestial_bodies').update({ orbit_inclination: inclination }).eq('id', id).then()
  },

  reassignOrbit: (bodyId, newParentId) => {
    const { bodies } = get()
    const body = bodies.find(b => b.id === bodyId)
    if (!body) return { ok: false, reason: 'Body not found' }

    const bodyMass = (body.mass || defaultMass[body.type] || 0.001) * (body.mergeScale || 1)

    if (newParentId) {
      const newParent = bodies.find(b => b.id === newParentId)
      if (!newParent) return { ok: false, reason: 'Target not found' }

      // Physics check: body must be less massive than its parent
      const parentMass = (newParent.mass || defaultMass[newParent.type] || 0.001) * (newParent.mergeScale || 1)
      if (bodyMass >= parentMass) {
        return {
          ok: false,
          reason: `${body.name} (${bodyMass.toFixed(4)} M☉) is too massive to orbit ${newParent.name} (${parentMass.toFixed(4)} M☉). Only lighter bodies can orbit heavier ones.`,
        }
      }

      // Prevent circular orbits (can't orbit your own child)
      const isDescendant = (ancestorId: string, targetId: string): boolean => {
        const children = bodies.filter(b => b.parentId === ancestorId)
        return children.some(c => c.id === targetId || isDescendant(c.id, targetId))
      }
      if (isDescendant(bodyId, newParentId)) {
        return { ok: false, reason: `${newParent.name} already orbits ${body.name} — circular orbit not allowed.` }
      }

      // Calculate a sensible default orbit radius (just outside the parent's visual size)
      const BODY_SIZES: Partial<Record<BodyType, number>> = {
        star: 3, gas_giant: 2.2, black_hole: 1.5, nebula: 4,
        neutron_star: 0.6, pulsar: 0.7, supernova: 3.5, white_dwarf: 0.5,
      }
      const parentSize = BODY_SIZES[newParent.type] ?? 1
      const orbitRadius = Math.max(parentSize * 4, 8)
      const orbitSpeed = keplerOrbitSpeed(orbitRadius, parentMass)

      const updates: Partial<CelestialBody> = {
        parentId: newParentId,
        orbitRadius,
        orbitSpeed,
        orbitAngle: Math.random() * Math.PI * 2,
        orbitInclination: 0,
        x: 0, y: 0, z: 0,
      }
      set((state) => ({ bodies: state.bodies.map(b => b.id === bodyId ? { ...b, ...updates } : b) }))
      supabase.from('celestial_bodies').update({
        parent_id: newParentId,
        orbit_radius: orbitRadius,
        orbit_speed: orbitSpeed,
        orbit_angle: updates.orbitAngle,
        orbit_inclination: 0,
        x: 0, y: 0, z: 0,
      }).eq('id', bodyId).then()
    } else {
      // Release to free float — detach from parent
      const updates: Partial<CelestialBody> = {
        parentId: null,
        orbitRadius: 0, orbitSpeed: 0, orbitAngle: 0, orbitInclination: 0,
        x: (Math.random() - 0.5) * 40,
        y: 0,
        z: (Math.random() - 0.5) * 40,
      }
      set((state) => ({ bodies: state.bodies.map(b => b.id === bodyId ? { ...b, ...updates } : b) }))
      supabase.from('celestial_bodies').update({
        parent_id: null,
        orbit_radius: 0, orbit_speed: 0, orbit_angle: 0, orbit_inclination: 0,
        x: updates.x, y: 0, z: updates.z,
      }).eq('id', bodyId).then()
    }

    soundManager.playSelect()
    return { ok: true }
  },

  saveProgress: async (slotIndex, label) => {
    const { sessionId, mode, coins, chapter, turnCount, totalCreditsEarned,
      storyOutcomes, unlockedTypes, bodies } = get()
    if (!sessionId) return
    const slotLabel = label || `${mode === 'story' ? 'Story' : 'Open World'} — Turn ${turnCount}`
    const bodiesSnapshot = bodies.map(b => ({
      id: b.id, type: b.type, x: b.x, y: b.y, z: b.z,
      equilibrium: b.equilibrium, state: b.state, name: b.name,
      parentId: b.parentId, orbitRadius: b.orbitRadius, orbitSpeed: b.orbitSpeed,
      orbitAngle: b.orbitAngle, rotationSpeed: b.rotationSpeed, axialTilt: b.axialTilt,
      mass: b.mass, mergeScale: b.mergeScale, mergeCount: b.mergeCount,
    }))

    // Also persist full state to game_sessions so refresh restores it
    await supabase.from('game_sessions').update({
      mode, coins, chapter, turn_count: turnCount,
      total_credits: totalCreditsEarned,
      story_outcomes: storyOutcomes,
      unlocked_types: unlockedTypes,
    }).eq('id', sessionId)

    const { error } = await supabase.from('save_slots').upsert({
      session_id: sessionId,
      slot_index: slotIndex,
      label: slotLabel,
      mode,
      coins,
      chapter,
      turn_count: turnCount,
      total_credits: totalCreditsEarned,
      story_outcomes: storyOutcomes,
      unlocked_types: unlockedTypes,
      bodies_snapshot: bodiesSnapshot,
      saved_at: new Date().toISOString(),
    }, { onConflict: 'session_id,slot_index' })

    if (error) console.error('[saveProgress] error:', error)
  },

  loadSave: async (slotIndex) => {
    const { sessionId } = get()
    if (!sessionId) return false
    const { data } = await supabase
      .from('save_slots')
      .select('*')
      .eq('session_id', sessionId)
      .eq('slot_index', slotIndex)
      .single()
    if (!data) return false
    const bodies: CelestialBody[] = (data.bodies_snapshot as Record<string, unknown>[]).map((b) => ({
      id: b.id as string, type: b.type as BodyType,
      x: b.x as number, y: b.y as number, z: b.z as number,
      equilibrium: b.equilibrium as number, state: b.state as BodyState,
      name: b.name as string, parentId: (b.parentId as string) || null,
      orbitRadius: (b.orbitRadius as number) || 0,
      orbitSpeed: (b.orbitSpeed as number) || 0,
      orbitAngle: (b.orbitAngle as number) || 0,
      orbitInclination: (b.orbitInclination as number) || 0,
      rotationSpeed: (b.rotationSpeed as number) || 0.01,
      axialTilt: (b.axialTilt as number) || 0,
      mass: (b.mass as number) || 0.001,
      mergeScale: (b.mergeScale as number) || 1,
      mergeCount: (b.mergeCount as number) || 0,
    }))
    set({
      mode: data.mode as GameMode,
      coins: data.coins,
      chapter: data.chapter,
      turnCount: data.turn_count,
      totalCreditsEarned: data.total_credits,
      storyOutcomes: (data.story_outcomes as string[]) || [],
      unlockedTypes: (data.unlocked_types as BodyType[]) || [...BASE_UNLOCKED],
      bodies,
      selectedBodyId: null,
      currentEvent: null,
      gameOver: null,
      isPaused: false,
    })
    // Sync session row
    await supabase.from('game_sessions').update({
      mode: data.mode, coins: data.coins, chapter: data.chapter,
      turn_count: data.turn_count, total_credits: data.total_credits,
    }).eq('id', sessionId)
    // Sync celestial_bodies
    await supabase.from('celestial_bodies').delete().eq('session_id', sessionId)
    if (bodies.length > 0) {
      await supabase.from('celestial_bodies').insert(
        bodies.map(b => ({
          id: b.id, session_id: sessionId, type: b.type,
          x: b.x, y: b.y, z: b.z, equilibrium: b.equilibrium,
          state: b.state, name: b.name, parent_id: b.parentId,
          orbit_radius: b.orbitRadius, orbit_speed: b.orbitSpeed,
          orbit_angle: b.orbitAngle, rotation_speed: b.rotationSpeed,
          axial_tilt: b.axialTilt, mass: b.mass,
          merge_scale: b.mergeScale, merge_count: b.mergeCount,
        }))
      )
    }
    return true
  },

  deleteSave: async (slotIndex) => {
    const { sessionId } = get()
    if (!sessionId) return
    await supabase.from('save_slots')
      .delete()
      .eq('session_id', sessionId)
      .eq('slot_index', slotIndex)
  },

  listSaves: async () => {
    const { sessionId } = get()
    if (!sessionId) return []
    const { data, error } = await supabase
      .from('save_slots')
      .select('slot_index, label, mode, coins, chapter, turn_count, total_credits, bodies_snapshot, saved_at')
      .eq('session_id', sessionId)
      .order('slot_index')
    if (error) { console.error('[listSaves] error:', error); return [] }
    if (!data) return []
    return data.map(d => ({
      slot_index: d.slot_index as 1 | 2 | 3,
      label: d.label,
      mode: d.mode as GameMode,
      coins: d.coins,
      chapter: d.chapter,
      turn_count: d.turn_count,
      total_credits: d.total_credits,
      body_count: Array.isArray(d.bodies_snapshot) ? d.bodies_snapshot.length : 0,
      saved_at: d.saved_at,
    }))
  },
}))
