# The-Cartography

A browser-based space simulation game where you shape the fate of the universe — one celestial body at a time.

Built with React, Three.js, and Supabase. Runs entirely in the browser with no install required.

---

## What is Cartography?

Cartography puts you in the role of a cosmic architect. You place stars, planets, moons, and other celestial bodies into a living universe, then guide their evolution through meaningful choices. Every decision shifts the balance between Genesis (thriving) and Collapse (destruction). Push a body too far in either direction and face the consequences — or the rewards.

The game offers two modes:

- **Story Mode** — a scripted narrative campaign across multiple chapters, each with a predefined solar system and escalating cosmic challenges.
- **Open World Mode** — a freeform sandbox where you build and manage your own universe at your own pace.

---

## Gameplay Instructions

### Getting Started

1. Launch the game and watch the intro cinematic (skippable after 3 seconds).
2. From the Main Menu, choose **Story Mode** or **Open World Mode**.
3. In Open World Mode, click any empty space to open the placement menu and add your first celestial body.

### Placing Celestial Bodies (Open World)

- Click empty canvas space to open the placement menu.
- Choose from: Star, Planet, Moon, Gas Giant, Black Hole, or Nebula Cluster.
- Drag placed bodies to reposition them.
- Moons automatically orbit the nearest planet. If no planet exists, they become rogue moons.

### The Equilibrium Bar

Every celestial body has an Equilibrium Bar with three zones:

- **Collapse** (left, red) — the body is deteriorating. Reach the far end and it's destroyed.
- **Equilibrium** (center, blue/white) — stable and self-sustaining.
- **Genesis** (right, gold/green) — thriving and evolving. Reach the far end for an evolution event and a big coin bonus.

The bar needle moves based on your choices each turn. Watch the body's appearance change in real time to reflect its current state.

### Making Choices

- Each turn, one or more bodies will pulse with a glow, signaling a choice event.
- Click the body to open its detail panel and read the scenario.
- Pick from 2–3 options. Each subtly hints at whether it leans toward Genesis, Equilibrium, or Collapse — but nothing is labeled outright.
- If a turn timer is enabled and you don't choose in time, an Equilibrium choice is auto-selected.

### Coins & Progression

- Bodies passively generate coins each turn based on how close they are to Genesis.
- Genesis choices award bonus coins. Collapse choices award nothing (or a penalty).
- Spend coins to place new bodies or unlock cosmetic upgrades.
- If you run out of coins with no active bodies, a starter Star is gifted to get you back in the game.

### Camera Controls

- **Click and hold** anywhere on the canvas to set a pivot point, then **drag** to rotate the view 360 degrees.
- **Scroll wheel** or **pinch** to zoom in and out.
- The HUD stays fixed on screen regardless of camera rotation.

### Story Mode

- Each chapter opens with a predefined solar system — you interact with existing bodies rather than placing new ones.
- Every 3–5 turns, you receive a detailed state briefing for a specific entity with contextual choices based on its current condition.
- Scripted events (solar flares, rogue asteroids) layer on top of the choice system.
- Progress saves automatically at each chapter checkpoint.

### Rare Game-Over Events

- **Singularity** — if a Black Hole reaches full Genesis or two Black Holes are placed too close together, a gravitational cascade consumes the entire canvas. Session ends with a score summary.
- **Universal Collapse** — if all bodies reach full Collapse simultaneously, a Big Bang Reset is offered with a coin bonus to restart.

These events are intentionally rare (≤5% chance per qualifying turn) — treat them as high-stakes surprises, not routine outcomes.

### Pause & Settings

- Press **Escape** or the pause button at any time to access the Pause menu.
- Adjust audio volumes (ambient music, sound effects) and visual quality independently.
- Return to the Main Menu without losing your auto-saved progress.

---

## Tech Stack

- React 19 + TypeScript
- Three.js / React Three Fiber
- Zustand (state management)
- Framer Motion + GSAP (animations)
- Tone.js (audio)
- Supabase (backend / persistence)
- Vite + Tailwind CSS

---

## Project Structure

```
src/
├── components/
│   ├── game/          # Core game UI (EquilibriumBar, ChoiceModal, etc.)
│   ├── GameView.tsx   # Main game canvas
│   ├── MainMenu.tsx
│   ├── UIOverlay.tsx
│   └── ...
├── store/
│   └── gameStore.ts   # Global game state (Zustand)
├── lib/
│   ├── sound.ts       # Audio engine
│   └── utils.ts
├── db/
│   └── supabase.ts    # Supabase client
└── App.tsx
```

---

## Deployment

