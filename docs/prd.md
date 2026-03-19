# Requirements Document

## 1. Application Overview

- **Application Name:** Cosmogenesis
- **Description:** Cosmogenesis is an artistic, immersive space simulation game where players explore and interact with a procedurally generated open universe filled with stars, galaxies, nebulae, and celestial bodies. Players can create and nurture their own cosmic entities, make meaningful choices that drive evolution or collapse, and experience a rich narrative through Story Mode or freely explore in Open World Mode. The game emphasizes stunning visuals, fluid animations, and seamless transitions to deliver a premium gamer experience.

---

## 2. User & Use Scenarios

- **Target Users:** Casual and mid-core gamers who enjoy simulation, strategy, and exploration genres; players drawn to artistic and visually immersive experiences.
- **Core Use Scenarios:**
  - A player launches the game, watches the cinematic intro sequence, and chooses between Story Mode and Open World Mode.
  - In Open World Mode, a player freely places stars, planets, and moons, then makes choices each turn to guide their celestial bodies toward Genesis or away from Collapse.
  - In Story Mode, a player follows a guided narrative with scripted events, choice-driven branching, and escalating cosmic challenges.
  - A player monitors the Equilibrium Bar to assess the state of each celestial body and earns coins/points based on their decisions.

---

## 3. Page Structure & Core Features

### 3.1 Page Overview

```
Cosmogenesis
├── Intro Sequence (Cinematic)
├── Main Menu
│   ├── Story Mode
│   ├── Open World Mode
│   └── Settings
├── Mode Selection Screen
├── Game World (Shared Canvas)
│   ├── Open World Mode View
│   └── Story Mode View
├── Celestial Body Detail Panel
│   ├── Choice Interface
│   └── Equilibrium Bar
├── HUD (Heads-Up Display)
│   ├── Coins / Points Counter
│   └── Mode Indicator
└── Pause / Settings Overlay
```

### 3.2 Intro Sequence (Cinematic)

- Plays automatically on first launch and optionally on subsequent launches (skippable after 3 seconds).
- Depicts the birth of the universe: darkness → a single point of light → explosive expansion → stars forming → galaxies spiraling into existence.
- Accompanied by an orchestral/ambient soundtrack that swells with the visuals.
- Smooth particle-based animations with bloom, lens flare, and nebula color gradients (deep purples, electric blues, warm golds).
- Transitions seamlessly into the Main Menu without a hard cut.

### 3.3 Main Menu

- Background: a live, slowly rotating galaxy with parallax depth layers (foreground stars move faster than background nebulae).
- Options displayed with elegant fade-in animations:
  - **Story Mode** — begins the guided narrative campaign.
  - **Open World Mode** — enters the free-form sandbox universe.
  - **Settings** — audio, visual quality, and control preferences.
- Hovering over a mode previews a short looping visual teaser for that mode.
- Mode selection triggers a cinematic zoom-into-space transition into the game world.

### 3.4 Open World Mode

- **Universe Canvas:** An infinite-feeling 2D/2.5D scrollable and zoomable space environment populated with procedurally placed background stars, distant galaxies, and nebula clouds.
- **Celestial Body Placement:**
  - Player can tap/click empty space to open a placement menu.
  - Placement menu options: Star, Planet, Moon, Gas Giant, Black Hole, Nebula Cluster.
  - Each placed object appears with a satisfying spawn animation (e.g., a star ignites with a burst of light; a planet coalesces from swirling dust).
  - Objects can be repositioned by drag-and-drop.
- **Turn System:**
  - Each in-game cycle (turn) triggers a choice event for one or more of the player's active celestial bodies.
  - The player is notified via a subtle pulsing glow on the body requiring a decision.
- **Coins / Points:**
  - Earned per turn based on the health and state of celestial bodies.
  - Bonus coins awarded for Genesis-aligned choices.
  - Coins can be spent to place new celestial bodies or unlock visual customizations (color palettes, particle effects).

### 3.5 Story Mode

- A scripted narrative campaign set across multiple chapters, each introducing new cosmic challenges and lore.
- The player is guided through specific objectives (e.g., stabilize a dying star, birth a new solar system, prevent a galactic collision).
- Choices made during the story affect the narrative outcome and ending.
- Story progression is saved automatically.
- Chapters are unlocked sequentially; each chapter begins with a short cinematic cutscene.
- The same Equilibrium Bar and choice mechanics apply, but choices are contextually tied to the story.

### 3.6 Celestial Body Detail Panel

- Opens when the player selects a celestial body they own.
- Displays:
  - Body name (auto-generated or player-named).
  - Type icon and visual representation.
  - Current state label: Stable, Evolving, Stressed, Critical.
  - **Equilibrium Bar** (see Section 4).
  - **Choice Interface** (see Section 4).
  - Accumulated points/coins generated by this body.

### 3.7 HUD (Heads-Up Display)

- Always visible during gameplay, minimal and non-intrusive.
- Displays:
  - Total Coins / Points (top-right corner, animated counter on change).
  - Current Mode label (top-left).
  - Mini-map or universe overview toggle (bottom-right).
- HUD elements fade to low opacity when not interacted with, restoring on hover/touch.

### 3.8 Pause / Settings Overlay

- Accessible via Escape key or pause button.
- Options: Resume, Settings (audio/visual), Return to Main Menu.
- Blurs the game world behind the overlay for visual depth.

---

## 4. Business Rules & Logic

### 4.1 Equilibrium Bar

- Each celestial body has its own Equilibrium Bar, a horizontal gradient bar with three zones:
  - **Collapse** (left, deep red/crimson): The body is deteriorating — heading toward destruction, implosion, or death.
  - **Equilibrium** (center, cool blue/white): The body is stable and self-sustaining.
  - **Genesis** (right, radiant gold/green): The body is thriving, evolving, and generating maximum value.
- The bar has a single indicator needle that moves left or right based on choices.
- Visual feedback: the celestial body's appearance changes to reflect its bar position (e.g., a star near Collapse dims and flickers; a star near Genesis blazes brightly with corona effects).
- If the needle reaches the far Collapse end, the body undergoes a destruction event (animated supernova, implosion, etc.) and is removed from the canvas. The player loses its ongoing coin generation.
- If the needle reaches the far Genesis end, the body undergoes an evolution event (e.g., a star becomes a supergiant, a planet develops an atmosphere) and grants a large coin bonus.

### 4.2 Choice System

- Each turn, one or more celestial bodies present the player with a choice event.
- Each choice event displays:
  - A contextual scenario description (e.g., for a star: «A solar flare is building. How do you respond?»).
  - Two to three choice options, each with a brief description.
  - A subtle visual hint (icon or color tint) indicating whether the choice leans toward Genesis, Equilibrium, or Collapse — but not explicitly labeled, preserving player agency.
- Choices are categorized internally:
  - **Genesis Choice:** Moves the bar toward Genesis; awards bonus coins.
  - **Equilibrium Choice:** Keeps the bar stable; awards standard coins.
  - **Collapse Choice:** Moves the bar toward Collapse; awards no coins or a small penalty.
- Choice events are contextually appropriate to the body type (star choices differ from planet choices differ from black hole choices).
- A turn timer (optional, configurable in Settings) can add urgency; if no choice is made, an Equilibrium Choice is auto-selected.

### 4.3 Coins & Points

- **Passive Generation:** Each active celestial body generates coins per turn proportional to its Genesis proximity.
- **Choice Rewards:** Genesis choices grant +bonus coins; Collapse choices grant 0 or negative coins.
- **Milestone Bonuses:** Reaching Genesis evolution or surviving a near-Collapse event grants a one-time large coin reward.
- **Spending:** Coins are spent in the placement menu to add new celestial bodies or unlock cosmetic upgrades.

### 4.4 Mode Differences

| Feature | Open World Mode | Story Mode |
|---|---|---|
| Objective | Free exploration & creation | Chapter-based narrative goals |
| Celestial body placement | Unrestricted | Guided / scripted |
| Choice events | Procedurally generated | Scripted, narrative-tied |
| Progression | Coin-based, open-ended | Chapter unlocks, story endings |
| Saving | Auto-save per turn | Auto-save per chapter checkpoint |

---

## 5. Exceptions & Edge Cases

| Scenario | Handling |
|---|---|
| Player places a Moon without a parent Planet | Moon orbits the nearest existing planet automatically; if none exists, it becomes a rogue moon with reduced coin generation |
| All celestial bodies reach Collapse simultaneously | A dramatic «Universal Collapse» cinematic plays; the player is offered a «Big Bang Reset» to restart the canvas with a coin bonus |
| Player runs out of coins with no active bodies | A starter Star is gifted to the player with a short tutorial prompt to re-engage |
| Story Mode chapter objective fails | Player is shown a failure cinematic and offered to retry the chapter from the last checkpoint |
| Player attempts to place a body outside the visible canvas | Placement is snapped to the nearest valid canvas position |
| Turn timer expires without a choice | Equilibrium Choice is auto-selected; a subtle notification informs the player |
| Two celestial bodies overlap on placement | Bodies are nudged apart with a gentle physics-based separation animation |

---

## 6. Acceptance Criteria

- The intro cinematic plays on launch, is skippable after 3 seconds, and transitions seamlessly into the Main Menu without any visible loading break.
- Both Story Mode and Open World Mode are accessible from the Main Menu and load without crashes or frame drops.
- Players can place at least six types of celestial bodies (Star, Planet, Moon, Gas Giant, Black Hole, Nebula Cluster) in Open World Mode.
- Each placed celestial body displays its own Equilibrium Bar with three clearly distinguishable zones (Collapse, Equilibrium, Genesis).
- The Equilibrium Bar needle moves visibly and smoothly in response to every player choice.
- Celestial body visuals change appearance in real time to reflect their current bar position.
- The choice interface presents two to three options per event with contextually appropriate scenario text.
- Coins/points are awarded correctly: Genesis choices grant bonus coins, Equilibrium choices grant standard coins, Collapse choices grant zero or negative coins.
- The HUD coin counter updates with an animated increment/decrement on every change.
- Story Mode contains at least three playable chapters, each beginning with a cinematic cutscene.
- All transitions between screens (menu → game, chapter → chapter) use smooth animated transitions with no hard cuts or blank screens.
- A Collapse destruction event triggers a visible animation (supernova/implosion) before the body is removed.
- A Genesis evolution event triggers a visible upgrade animation and grants a coin bonus.
- The game auto-saves progress in both modes without requiring manual save actions.
- The Pause overlay is accessible at any time during gameplay and does not cause state loss.
- The game runs stably across an extended session without crashes, memory leaks, or UI freezes.

---

## 7. Out of Scope for This Version

- Multiplayer or co-op universe sharing.
- User accounts, cloud save, or cross-device sync.
- More than three Story Mode chapters at launch.
- Real-time physics simulation (orbital mechanics, gravitational pull between bodies).
- Mobile touch-optimized build (this version targets desktop/web).
- In-app purchases or monetization systems.
- Procedurally generated narrative dialogue beyond choice event descriptions.
- Audio composition tools or custom soundtrack upload.
- Leaderboards or achievement systems.