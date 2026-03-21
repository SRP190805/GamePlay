import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import { createClient } from '@supabase/supabase-js'
import { soundManager } from '../lib/sound'

// Supabase client initialization (Assuming env vars are set by supabase_init)
// Since we don't have direct access to env vars in browser without Vite loading them,
// we rely on Vite's import.meta.env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
export const supabase = createClient(supabaseUrl || '', supabaseKey || '')

export type GameMode = 'intro' | 'menu' | 'story' | 'open_world'
export type BodyType = 'star' | 'planet' | 'moon' | 'gas_giant' | 'black_hole' | 'nebula'
export type BodyState = 'stable' | 'evolving' | 'stressed' | 'critical'

export interface CelestialBody {
  id: string
  type: BodyType
  x: number
  y: number
  z: number
  equilibrium: number // 0-100
  state: BodyState
  name: string
  parentId: string | null
  orbitRadius: number
  orbitSpeed: number
  orbitAngle: number
  rotationSpeed: number
}

interface GameSettings {
  volume: number // 0-100
  motionSensitivity: number // 0.1-2.0
}

interface GameState {
  sessionId: string | null
  mode: GameMode
  coins: number
  chapter: number
  turnCount: number
  bodies: CelestialBody[]
  selectedBodyId: string | null
  isPaused: boolean
  currentEvent: GameEvent | null
  gameOver: { isOver: boolean; reason: string } | null
  settings: GameSettings
  
  // Actions
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
}

export interface GameEvent {
  id: string
  bodyId: string
  title: string
  description: string
  choices: {
    label: string
    type: 'genesis' | 'equilibrium' | 'collapse'
    effect: (body: CelestialBody) => Partial<CelestialBody>
    coinReward: number
  }[]
}

export const useGameStore = create<GameState>((set, get) => ({
  sessionId: localStorage.getItem('cosmogenesis_session_id'),
  mode: 'intro',
  coins: 100,
  chapter: 1,
  turnCount: 0,
  bodies: [],
  selectedBodyId: null,
  isPaused: false,
  currentEvent: null,
  gameOver: null,
  settings: {
    volume: 50,
    motionSensitivity: 1.0
  },

  initSession: async () => {
    let sessionId = get().sessionId
    if (!sessionId) {
      sessionId = uuidv4()
      localStorage.setItem('cosmogenesis_session_id', sessionId)
      set({ sessionId })
    }

    // Try to load existing session
    const { data: session } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (session) {
      set({
        coins: session.coins,
        chapter: session.chapter,
        turnCount: session.turn_count,
        mode: 'menu' // Always start at menu if session exists
      })
      
      // Load bodies
      const { data: bodies } = await supabase
        .from('celestial_bodies')
        .select('*')
        .eq('session_id', sessionId)
      
      if (bodies) {
        set({ bodies: bodies.map((b: any) => ({
          ...b,
          parentId: b.parent_id || null,
          orbitRadius: b.orbit_radius || 0,
          orbitSpeed: b.orbit_speed || 0,
          orbitAngle: b.orbit_angle || 0,
          rotationSpeed: b.rotation_speed || 0
        })) })
      }
    } else {
      // Create new session
      await supabase.from('game_sessions').insert({
        id: sessionId,
        mode: 'open_world', // Default, will change
        coins: 100
      })
    }
  },

  updateSettings: (newSettings) => {
    set((state) => ({ settings: { ...state.settings, ...newSettings } }))
    // Apply immediate effects
    if (newSettings.volume !== undefined) {
      soundManager.setVolume(newSettings.volume)
    }
  },

  setMode: async (mode) => {
    set({ mode })
    const { sessionId } = get()
    
    // Open World: Ensure blank slate if switching fresh?
    // User requested: "open world mode it should be left blank"
    // However, if we are returning to game, we might want to keep state.
    // For now, let's assume switching TO open world from menu resets if empty?
    // Or maybe we add a dedicated "New Game" button.
    // Let's just clear if bodies are empty to be safe, but "left blank" implies starting state.
    if (mode === 'open_world' && get().bodies.length === 0) {
        // No pre-filled bodies. Just blank space.
    }

    // Story Mode Initialization
    if (mode === 'story' && get().bodies.length === 0) {
       // Proper Solar System
       const sunId = uuidv4()
       const earthId = uuidv4()
       const jupiterId = uuidv4()
       
       const storyBodies: CelestialBody[] = [
         // The Sun
         { 
            id: sunId,
            type: 'star', 
            x: 0, y: 0, z: 0, 
            equilibrium: 80, 
            state: 'stable', 
            name: 'Sol Prime',
            parentId: null,
            orbitRadius: 0,
            orbitSpeed: 0,
            orbitAngle: 0,
            rotationSpeed: 0.002
         },
         // Earth-like Planet
         { 
            id: earthId,
            type: 'planet', 
            x: 15, y: 0, z: 0, 
            equilibrium: 60, 
            state: 'stable', 
            name: 'Terra Nova',
            parentId: sunId,
            orbitRadius: 15,
            orbitSpeed: 0.2,
            orbitAngle: Math.random() * Math.PI * 2,
            rotationSpeed: 0.01
         },
         // Moon
         { 
            id: uuidv4(),
            type: 'moon', 
            x: 0, y: 0, z: 0, // Position relative to parent will be calculated in view
            equilibrium: 50, 
            state: 'stable', 
            name: 'Luna',
            parentId: earthId,
            orbitRadius: 3,
            orbitSpeed: 0.5,
            orbitAngle: Math.random() * Math.PI * 2,
            rotationSpeed: 0.005
         },
         // Gas Giant
         { 
            id: jupiterId,
            type: 'gas_giant', 
            x: 25, y: 0, z: 0, 
            equilibrium: 50, 
            state: 'stable', 
            name: 'Behemoth',
            parentId: sunId,
            orbitRadius: 25,
            orbitSpeed: 0.1,
            orbitAngle: Math.random() * Math.PI * 2,
            rotationSpeed: 0.008
         },
         // Moon of Gas Giant
         { 
            id: uuidv4(),
            type: 'moon', 
            x: 0, y: 0, z: 0, 
            equilibrium: 40, 
            state: 'stable', 
            name: 'Titanus',
            parentId: jupiterId,
            orbitRadius: 4,
            orbitSpeed: 0.4,
            orbitAngle: Math.random() * Math.PI * 2,
            rotationSpeed: 0.005
         }
       ]
       
       // Bulk add or set
       set({ bodies: storyBodies })
       // Also persist... ideally we loop addBody but direct set is faster for init
       if (sessionId) {
          await supabase.from('celestial_bodies').insert(storyBodies.map(b => ({ ...b, session_id: sessionId })))
       }
    }
  },

  restartGame: async () => {
    const { sessionId } = get()
    set({
      coins: 100,
      turnCount: 0,
      chapter: 1,
      bodies: [],
      selectedBodyId: null,
      gameOver: null,
      mode: 'menu' // Go back to menu or restart immediately?
    })
    
    if (sessionId) {
      // Clean DB
      await supabase.from('celestial_bodies').delete().eq('session_id', sessionId)
      await supabase.from('game_sessions').update({ 
        coins: 100, 
        turn_count: 0, 
        chapter: 1 
      }).eq('id', sessionId)
    }
  },

  addBody: async (bodyData) => {
    const { sessionId } = get()
    if (!sessionId) return

    // Ensure all required fields are present with defaults
    const newBody: CelestialBody = {
      id: uuidv4(),
      ...bodyData
    }

    // Optimistic update
    set((state) => ({ bodies: [...state.bodies, newBody] }))

    // Persist
    await supabase.from('celestial_bodies').insert({
      id: newBody.id,
      session_id: sessionId,
      type: newBody.type,
      x: newBody.x,
      y: newBody.y,
      z: newBody.z,
      equilibrium: newBody.equilibrium,
      state: newBody.state,
      name: newBody.name,
      parent_id: newBody.parentId,
      orbit_radius: newBody.orbitRadius,
      orbit_speed: newBody.orbitSpeed,
      orbit_angle: newBody.orbitAngle,
      rotation_speed: newBody.rotationSpeed
    })
  },

  updateBody: async (id, updates) => {
    set((state) => ({
      bodies: state.bodies.map((b) => (b.id === id ? { ...b, ...updates } : b))
    }))
    
    // Construct safe update object
    const finalDbUpdates: any = {}
    if (updates.x !== undefined) finalDbUpdates.x = updates.x
    if (updates.y !== undefined) finalDbUpdates.y = updates.y
    if (updates.z !== undefined) finalDbUpdates.z = updates.z
    if (updates.equilibrium !== undefined) finalDbUpdates.equilibrium = updates.equilibrium
    if (updates.state !== undefined) finalDbUpdates.state = updates.state
    if (updates.name !== undefined) finalDbUpdates.name = updates.name
    if (updates.parentId !== undefined) finalDbUpdates.parent_id = updates.parentId
    if (updates.orbitRadius !== undefined) finalDbUpdates.orbit_radius = updates.orbitRadius
    if (updates.orbitSpeed !== undefined) finalDbUpdates.orbit_speed = updates.orbitSpeed
    if (updates.orbitAngle !== undefined) finalDbUpdates.orbit_angle = updates.orbitAngle
    if (updates.rotationSpeed !== undefined) finalDbUpdates.rotation_speed = updates.rotationSpeed

    await supabase
      .from('celestial_bodies')
      .update(finalDbUpdates)
      .eq('id', id)
  },

  removeBody: async (id) => {
    set((state) => {
        const idsToRemove = new Set<string>()
        const findChildren = (pid: string) => {
            idsToRemove.add(pid)
            state.bodies.filter(b => b.parentId === pid).forEach(child => findChildren(child.id))
        }
        findChildren(id)
        
        return {
           bodies: state.bodies.filter((b) => !idsToRemove.has(b.id)),
           selectedBodyId: idsToRemove.has(state.selectedBodyId || '') ? null : state.selectedBodyId
        }
    })

    await supabase.from('celestial_bodies').delete().eq('id', id)
  },

  selectBody: (id) => set({ selectedBodyId: id }),

  addCoins: (amount) => {
    set((state) => {
      const newCoins = state.coins + amount
      const { sessionId } = state
      if (sessionId) {
        supabase.from('game_sessions').update({ coins: newCoins }).eq('id', sessionId).then()
      }
      return { coins: newCoins }
    })
  },

  spendCoins: (amount) => {
    const { coins, sessionId } = get()
    if (coins >= amount) {
      const newCoins = coins - amount
      set({ coins: newCoins })
      if (sessionId) {
        supabase.from('game_sessions').update({ coins: newCoins }).eq('id', sessionId).then()
      }
      return true
    }
    return false
  },

  nextTurn: () => {
    const { bodies, turnCount, coins, sessionId, mode } = get()
    let newCoins = coins
    
    // 1. Passive Income
    bodies.forEach(body => {
      // Closer to Genesis (100) = more coins
      // Formula: Base 1 + (Equilibrium / 20)
      const income = Math.floor(1 + (body.equilibrium / 20))
      newCoins += income
    })
    
    let newEvent: GameEvent | null = null

    // 2. Story Progression (Infinite)
    // Removed cap. Just survival.
    // ...

    // 3. Random Event Trigger
    // (30% chance per turn if > 0 bodies AND no story event)
    if (!newEvent && bodies.length > 0 && Math.random() < 0.3) {
       const randomBody = bodies[Math.floor(Math.random() * bodies.length)]
       // More variety
       const scenarios = [
         { title: "Solar Flare", desc: "A massive solar flare threatens the system.", type: "danger" },
         { title: "Cosmic Bloom", desc: "Rare cosmic radiation is accelerating growth.", type: "good" },
         { title: "Gravitational Shift", desc: "Orbits are destabilizing due to dark matter.", type: "neutral" }
       ]
       const scenario = scenarios[Math.floor(Math.random() * scenarios.length)]
       
       newEvent = {
         id: uuidv4(),
         bodyId: randomBody.id,
         title: `${scenario.title}: ${randomBody.name}`,
         description: scenario.desc,
         choices: [
           {
             label: "Stabilize (Equilibrium)",
             type: "equilibrium",
             effect: (b) => ({ equilibrium: 50, state: 'stable' }),
             coinReward: 20
           },
           {
             label: "Evolve (Genesis)",
             type: "genesis",
             effect: (b) => ({ equilibrium: Math.min(100, b.equilibrium + 15), state: 'evolving' }),
             coinReward: 50
           },
           {
             label: "Harvest (Collapse)",
             type: "collapse",
             effect: (b) => ({ equilibrium: Math.max(0, b.equilibrium - 20), state: 'stressed' }),
             coinReward: 5 // Small reward for risk? Or 0.
           }
         ]
       }
    }

    // 4. Game Over Checks
    // Check if black hole exists
    if (bodies.some(b => b.type === 'black_hole')) {
       set({ gameOver: { isOver: true, reason: 'Singularity Event: A Black Hole has consumed the system.' } })
       return
    }
    
    // Check collapse
    if (bodies.length === 0 && turnCount > 1) {
       set({ gameOver: { isOver: true, reason: 'Universal Collapse: No celestial bodies remain.' } })
       return
    }

    // Play Sound
    if (newEvent) {
       soundManager.playSelect() 
    } else {
       soundManager.playHover()
    }

    set({ 
      turnCount: turnCount + 1, 
      coins: newCoins,
      currentEvent: newEvent
    })

    if (sessionId) {
      supabase.from('game_sessions').update({ 
        turn_count: turnCount + 1, 
        coins: newCoins 
      }).eq('id', sessionId).then()
    }
  },

  resolveEvent: (choiceIndex) => {
    const { currentEvent, bodies, updateBody, addCoins } = get()
    if (!currentEvent) return

    const choice = currentEvent.choices[choiceIndex]
    const body = bodies.find(b => b.id === currentEvent.bodyId)
    
    if (body) {
      const updates = choice.effect(body)
      
      // Check for Collapse or Genesis
      if (updates.equilibrium !== undefined) {
        if (updates.equilibrium <= 0) {
          // Collapse: Remove body
          get().removeBody(body.id)
          set({ currentEvent: null })
          return
        } else if (updates.equilibrium >= 100) {
          // Genesis: Bonus and maybe reset or lock
          addCoins(100)
          updates.state = 'evolving' // Visual flair
        }
      }

      updateBody(body.id, updates)
      addCoins(choice.coinReward)
    }

    set({ currentEvent: null })
  },

  togglePause: () => set((state) => ({ isPaused: !state.isPaused }))
}))
