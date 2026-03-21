# Task: Build Cosmogenesis Space Simulation Game

## Plan
- [ ] Step 1: Project Setup & Database Initialization
  - [ ] Initialize Supabase project
  - [ ] Create database schema (game_sessions, celestial_bodies)
  - [ ] Install necessary dependencies (three, @react-three/fiber, @react-three/drei, zustand, framer-motion, lucide-react)
  - [ ] Configure Tailwind for space theme colors
- [ ] Step 2: Core State Management & Utilities
  - [ ] Create Zustand store (gameStore) for managing coins, mode, celestial bodies, and session ID
  - [ ] Implement Supabase client and service functions for auto-saving
- [ ] Step 3: Cinematic Intro & Main Menu
  - [ ] Create IntroCinematic component (animated particles/text)
  - [ ] Create MainMenu component with mode selection
  - [ ] Implement transition logic between Intro -> Menu -> Game
- [ ] Step 4: Game Canvas & Universe Rendering (Open World)
  - [ ] Setup R3F Canvas with starry background (Stars, Nebulae)
  - [ ] Implement camera controls (Pan/Zoom)
  - [ ] Create CelestialBody 3D components (Star, Planet, Moon, etc.) with shaders/materials
  - [ ] Implement placement logic (click to spawn)
- [ ] Step 5: Game Logic & Systems
  - [ ] Implement Equilibrium Bar logic (Collapse <-> Equilibrium <-> Genesis)
  - [ ] Implement Turn System and Choice Events
  - [ ] Create Choice Interface UI
  - [ ] Implement Coin generation and spending logic
- [ ] Step 6: Story Mode Implementation
  - [ ] Implement Chapter system and progression logic
  - [ ] Create specific narrative events for Story Mode
- [ ] Step 7: HUD & Polish
  - [ ] Build HUD (Coins, Mode, Mini-map toggle)
  - [ ] Add visual effects (Bloom, animated transitions)
  - [ ] Final testing and bug fixes

## Notes
- Theme: Deep purple, electric blue, warm gold.
- No user auth: Use client-side generated UUID for session tracking.
- Critical: Supabase for all data persistence.
