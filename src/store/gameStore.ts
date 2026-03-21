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
  
  // Actions
  initSession: () => Promise<void>
  setMode: (mode: GameMode) => void
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
        set({ bodies: bodies as CelestialBody[] })
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

  setMode: async (mode) => {
    set({ mode })
    
    // Story Mode Initialization
    if (mode === 'story') {
       const { sessionId } = get()
       // Clear existing bodies for fresh story start if needed, or just ensure we have the setup
       // For this version, let's assume if 0 bodies, we populate story starter kit
       if (get().bodies.length === 0 && sessionId) {
         const storyBodies: Omit<CelestialBody, 'id'>[] = [
           { type: 'star', x: 0, y: 0, z: 0, equilibrium: 60, state: 'stable', name: 'Sol Prime' },
           { type: 'planet', x: 8, y: 0, z: 0, equilibrium: 50, state: 'stable', name: 'Terra Nova' },
           { type: 'gas_giant', x: -12, y: 5, z: 0, equilibrium: 40, state: 'stressed', name: 'Behemoth' }
         ]
         
         // Add them one by one (or bulk if we supported it)
         for (const b of storyBodies) {
            await get().addBody(b)
         }
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
      name: newBody.name
    })
  },

  updateBody: async (id, updates) => {
    set((state) => ({
      bodies: state.bodies.map((b) => (b.id === id ? { ...b, ...updates } : b))
    }))
    
    await supabase
      .from('celestial_bodies')
      .update(updates)
      .eq('id', id)
  },

  removeBody: async (id) => {
    set((state) => ({
      bodies: state.bodies.filter((b) => b.id !== id),
      selectedBodyId: state.selectedBodyId === id ? null : state.selectedBodyId
    }))

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

    // 2. Story Progression (Simple Check)
    if (mode === 'story') {
       const { chapter } = get()
       if (chapter === 1 && bodies.length >= 3) {
         // Advance to Chapter 2
         set({ chapter: 2 })
         // Trigger a special event?
         newEvent = {
            id: uuidv4(),
            bodyId: bodies[0].id,
            title: "Chapter 2: Expansion",
            description: "You have established a stable system. Now, look outward. The universe is vast and dangerous.",
            choices: [
              {
                label: "Begin Expansion",
                type: "genesis",
                effect: (b) => ({ equilibrium: b.equilibrium + 10 }), // Small boost
                coinReward: 100
              }
            ]
         }
       }
    }

    // 3. Random Event Trigger (30% chance per turn if > 0 bodies AND no story event)
    if (!newEvent && bodies.length > 0 && Math.random() < 0.3) {
       const randomBody = bodies[Math.floor(Math.random() * bodies.length)]
       const isGood = Math.random() > 0.5
       
       newEvent = {
         id: uuidv4(),
         bodyId: randomBody.id,
         title: isGood ? `Stellar Evolution: ${randomBody.name}` : `Cosmic Instability: ${randomBody.name}`,
         description: isGood 
           ? `The celestial body ${randomBody.name} shows signs of positive evolution. How will you guide it?`
           : `Disturbing gravitational waves detected from ${randomBody.name}. What is your directive?`,
         choices: [
           {
             label: "Nurture (Genesis)",
             type: "genesis",
             effect: (b) => ({ equilibrium: Math.min(100, b.equilibrium + 15), state: 'evolving' }),
             coinReward: 20
           },
           {
             label: "Stabilize (Equilibrium)",
             type: "equilibrium",
             effect: (b) => ({ equilibrium: b.equilibrium + 5, state: 'stable' }),
             coinReward: 10
           },
           {
             label: "Exploit (Collapse)",
             type: "collapse",
             effect: (b) => ({ equilibrium: Math.max(0, b.equilibrium - 20), state: 'stressed' }),
             coinReward: 50 // High short term gain
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
