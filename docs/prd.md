# Requirements Document

## 1. Application Overview

- **Application Name:** Cosmogenesis
- **Description:** Cosmogenesis is an artistic, immersive space simulation game where players explore and interact with a procedurally generated open universe filled with stars, galaxies, nebulae, and celestial bodies. Players can create and nurture their own cosmic entities, make meaningful choices that drive evolution or collapse, and experience a rich narrative through Story Mode or freely explore in Open World Mode. The game features reference-image-based visuals for stars, planets, and moons, 360-degree camera rotation, contextual sound effects, rare game-over events, and a refined friendly UI.

---

## 2. User & Use Scenarios

- **Target Users:** Casual and mid-core gamers who enjoy simulation, strategy, and exploration genres; players drawn to artistic and visually immersive experiences.
- **Core Use Scenarios:**
  - A player launches the game, watches the cinematic intro sequence, and chooses between Story Mode and Open World Mode.
  - In Open World Mode, a player freely places stars, planets, and moons, rotates the view by clicking and holding to pivot 360 degrees, then makes choices each turn to guide their celestial bodies toward Genesis or away from Collapse.
  - In Story Mode, a player interacts with a predefined solar system layout, receives contextual choices based on the current state of each entity, and navigates scripted narrative events.
  - A player hears distinct sound effects when a planet collapses, an asteroid strikes, or an important notification fires, reinforcing immersion.
  - A rare game-over event triggers when a black hole is inadvertently created, ending the current session dramatically.

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
│   ├── Mode Indicator
│   └── Notification Feed
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
- UI layout is clean, spacious, and friendly — buttons use rounded corners, soft glow highlights on hover, and legible sans-serif typography with generous spacing.
- Options displayed with elegant fade-in animations:
  - **Story Mode** — begins the guided narrative campaign.
  - **Open World Mode** — enters the free-form sandbox universe.
  - **Settings** — audio, visual quality, and control preferences.
- Hovering over a mode previews a short looping visual teaser for that mode.
- Mode selection triggers a cinematic zoom-into-space transition into the game world.

### 3.4 Open World Mode

- **Universe Canvas:** An infinite-feeling 2D/2.5D scrollable and zoomable space environment populated with procedurally placed background stars, distant galaxies, and nebula clouds.
- **360-Degree Camera Rotation:**
  - Player can click and hold anywhere on the canvas to set a pivot point, then drag to rotate the view 360 degrees around that pivot.
  - Rotation is smooth and inertia-dampened for a natural feel.
  - Scroll wheel or pinch gesture controls zoom level independently of rotation.
- **Celestial Body Visuals (Reference Images):**
  - Stars, planets, and moons use reference images sourced from publicly available NASA/ESA image libraries (fetched at runtime or bundled as assets) to ensure realistic and recognizable appearances.
  - Each body type maps to a curated set of reference images (e.g., a Sun-like star uses a solar surface image; a rocky planet uses a Mars/Moon-like texture; a gas giant uses a Jupiter-like banded image).
  - Gas Giants, Black Holes, and Nebula Clusters retain procedurally generated or stylized visuals.
  - On placement, the body spawns with its reference image applied, wrapped onto a sphere or disc representation with appropriate glow/atmosphere effects layered on top.
- **Celestial Body Placement:**
  - Player can tap/click empty space to open a placement menu.
  - Placement menu options: Star, Planet, Moon, Gas Giant, Black Hole, Nebula Cluster.
  - Each placed object appears with a satisfying spawn animation (e.g., a star ignites with a burst of light; a planet coalesces from swirling dust).
  - Objects can be repositioned by drag-and-drop.
- **Turn System:**
  - Each in-game cycle (turn) triggers a choice event for one or more of the player's active celestial bodies.
  - The player is notified via a subtle pulsing glow on the body requiring a decision, accompanied by a soft notification chime.
- **Coins / Points:**
  - Earned per turn based on the health and state of celestial bodies.
  - Bonus coins awarded for Genesis-aligned choices.
  - Coins can be spent to place new celestial bodies or unlock visual customizations (color palettes, particle effects).
- **Rare Game-Over Events (Open World):**
  - Certain rare combinations of player choices or entity states can trigger catastrophic game-over scenarios (see Section 4.5).

### 3.5 Story Mode

- A scripted narrative campaign set across multiple chapters, each introducing new cosmic challenges and lore.
- **Predefined System Layout:**
  - Each chapter opens with a fixed, designer-authored solar system layout (e.g., one central star, two planets, one moon orbiting a planet, one asteroid belt) that the player cannot freely rearrange.
  - The layout is visually presented as a living scene the player observes and interacts with, not a blank canvas.
  - Entity positions, types, and initial Equilibrium Bar states are set by the chapter design.
- **Player Interaction with the Predefined System:**
  - The player interacts with the existing entities rather than placing new ones.
  - 360-degree camera rotation (click-and-hold pivot, same as Open World Mode) is available to inspect the system from any angle.
  - Selecting an entity opens the Celestial Body Detail Panel showing its current state and available choices.
- **Contextual Choices Based on Open World Placement Variables:**
  - The Story Mode engine reads predefined variables that mirror the placement conditions a player would set in Open World Mode (entity type, proximity to other bodies, Equilibrium Bar position, current state label).
  - These variables drive which choice events are presented, ensuring choices feel contextually grounded in the system's actual configuration.
  - Example: if the predefined planet is in a close orbit to the star and its bar is in the Stressed zone, the choice event might read: «Intense solar radiation is heating your planet's surface. Do you seed reflective cloud cover, reinforce the magnetosphere, or let nature take its course?»
- **Timed Contextual Choices:**
  - After a set number of turns (configurable per chapter, e.g., every 3–5 turns), the game pauses and presents the player with a detailed state briefing for a specific entity:
    - Current state label (Stable / Evolving / Stressed / Critical).
    - A plain-language explanation of what is happening to the entity and why.
    - Two to three choices describing possible interventions, each with a brief consequence hint.
  - This briefing-and-choice rhythm gives the player a sense of informed agency over the predefined system.
- **Scripted Events & Narrative:**
  - Chapters include scripted trigger events (e.g., a rogue asteroid approaches, a solar flare erupts) that overlay on top of the choice system.
  - Choices made during the story affect the narrative outcome and ending.
- **Story progression** is saved automatically.
- Chapters are unlocked sequentially; each chapter begins with a short cinematic cutscene.
- **Rare Game-Over Events (Story):** Same catastrophic conditions apply (see Section 4.5); story-specific game-over cinematics play before offering a retry.

### 3.6 Celestial Body Detail Panel

- Opens when the player selects a celestial body.
- Displays:
  - Body name (auto-generated or player-named).
  - Type icon and visual representation (reference image thumbnail for stars, planets, moons).
  - Current state label: Stable, Evolving, Stressed, Critical.
  - **Equilibrium Bar** (see Section 4.1).
  - **Choice Interface** (see Section 4.2).
  - Accumulated points/coins generated by this body.
- Panel design uses rounded cards, soft translucent backgrounds, and clear iconography for a friendly, readable feel.

### 3.7 HUD (Heads-Up Display)

- Always visible during gameplay, minimal and non-intrusive.
- Displays:
  - Total Coins / Points (top-right corner, animated counter on change).
  - Current Mode label (top-left).
  - Mini-map or universe overview toggle (bottom-right).
  - **Notification Feed** (bottom-left): a small, auto-dismissing toast area that surfaces important entity alerts (e.g., «Your star is entering Critical state», «Asteroid impact detected on Planet Kael»). Each notification is accompanied by its corresponding sound effect.
- HUD elements fade to low opacity when not interacted with, restoring on hover/touch.
- HUD uses friendly rounded UI components consistent with the Main Menu style.

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
- Visual feedback: the celestial body's appearance changes to reflect its bar position (e.g., a star near Collapse dims and flickers; a star near Genesis blazes brightly with corona effects). Reference images are tinted or overlaid with particle effects to reinforce the state.
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
- In Story Mode, choice events additionally reference the predefined placement variables (proximity, orbit type, chapter-defined conditions) to generate contextually grounded scenarios.
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
| Celestial body placement | Unrestricted | Predefined layout; player interacts, does not place |
| Choice events | Procedurally generated | Scripted + placement-variable-driven |
| Timed state briefings | Standard turn choices | Detailed entity briefings every 3–5 turns |
| Camera rotation | 360° click-and-hold pivot | 360° click-and-hold pivot |
| Progression | Coin-based, open-ended | Chapter unlocks, story endings |
| Saving | Auto-save per turn | Auto-save per chapter checkpoint |

### 4.5 Sound Effects

- **Collapse / Destruction:** A deep, resonant boom with a crackling implosion tail plays when a celestial body reaches full Collapse and is destroyed.
- **Asteroid Impact:** A sharp percussive impact sound with a low-frequency rumble plays when an asteroid strikes a planet (scripted event or rare trigger).
- **Important Notifications:** A distinct, melodic chime (non-intrusive, pleasant) plays whenever a critical alert appears in the Notification Feed (e.g., entity entering Critical state, rare event warning).
- **Genesis Evolution:** A rising, triumphant harmonic tone plays when a body reaches full Genesis and evolves.
- **Choice Selection:** A soft, satisfying click/confirm sound plays on choice confirmation.
- **Ambient Soundtrack:** Continuous orchestral/ambient background music in both modes; volume independently adjustable in Settings.
- All sound effects and music volumes are individually configurable in the Settings overlay.

### 4.6 Rare Game-Over Events

- Rare catastrophic scenarios can end the current session. These are intentionally infrequent and serve as high-stakes moments.
- **Black Hole Creation — Game Over:**
  - If a Black Hole entity is placed (Open World) or triggered by a scripted event (Story), and specific rare conditions are met (e.g., the Black Hole's Equilibrium Bar reaches full Genesis, or two Black Holes are placed in close proximity), a game-over sequence triggers.
  - A dramatic cinematic plays: the black hole expands, consuming all nearby entities in a gravitational cascade, until the entire canvas is swallowed.
  - The player is shown a «Singularity Reached» game-over screen with their final score and an option to restart or return to the Main Menu.
- **Universal Collapse — Game Over:**
  - If all celestial bodies reach full Collapse simultaneously, a «Universal Collapse» cinematic plays, followed by a «Big Bang Reset» offer (restart with a coin bonus).
- Other rare events (e.g., rogue asteroid chain reaction destroying all planets) may trigger session-ending cinematics at the chapter designer's discretion in Story Mode.
- Rare events are flagged internally with a low probability trigger (e.g., ≤5% chance per qualifying turn) to ensure they remain surprising rather than routine.

---

## 5. Exceptions & Edge Cases

| Scenario | Handling |
|---|---|
| Player places a Moon without a parent Planet | Moon orbits the nearest existing planet automatically; if none exists, it becomes a rogue moon with reduced coin generation |
| All celestial bodies reach Collapse simultaneously | Universal Collapse game-over cinematic plays; player offered Big Bang Reset with coin bonus |
| Player runs out of coins with no active bodies | A starter Star is gifted to the player with a short tutorial prompt to re-engage |
| Story Mode chapter objective fails | Player is shown a failure cinematic and offered to retry the chapter from the last checkpoint |
| Player attempts to place a body outside the visible canvas | Placement is snapped to the nearest valid canvas position |
| Turn timer expires without a choice | Equilibrium Choice is auto-selected; a subtle notification chime and toast message inform the player |
| Two celestial bodies overlap on placement | Bodies are nudged apart with a gentle physics-based separation animation |
| Reference image fails to load for a star/planet/moon | A stylized procedural fallback texture is applied; no error is shown to the player |
| Black Hole rare game-over conditions are met | Singularity game-over cinematic triggers; session ends with score summary and restart option |
| Player rotates camera to extreme angle obscuring HUD | HUD remains fixed in screen space and is unaffected by world-space camera rotation |

---

## 6. Acceptance Criteria

- The intro cinematic plays on launch, is skippable after 3 seconds, and transitions seamlessly into the Main Menu without any visible loading break.
- Both Story Mode and Open World Mode are accessible from the Main Menu and load without crashes or frame drops.
- Stars, planets, and moons display reference images (realistic textures sourced from public NASA/ESA libraries or equivalent) rather than generic procedural shapes.
- Players can place at least six types of celestial bodies (Star, Planet, Moon, Gas Giant, Black Hole, Nebula Cluster) in Open World Mode.
- Each placed celestial body displays its own Equilibrium Bar with three clearly distinguishable zones (Collapse, Equilibrium, Genesis).
- The Equilibrium Bar needle moves visibly and smoothly in response to every player choice.
- Celestial body visuals change appearance in real time to reflect their current bar position.
- The choice interface presents two to three options per event with contextually appropriate scenario text.
- In Story Mode, choice events reference predefined placement variables (entity type, proximity, orbit, bar state) to generate contextually grounded scenarios.
- In Story Mode, a detailed entity state briefing with explanation and choices is presented every 3–5 turns per entity.
- 360-degree camera rotation is functional in both modes via click-and-hold pivot drag; rotation is smooth and inertia-dampened.
- Collapse/destruction sound effect plays on every body destruction event.
- Asteroid impact sound effect plays on every asteroid strike event.
- Notification chime plays for every critical alert appearing in the Notification Feed.
- Genesis evolution sound plays on every Genesis evolution event.
- All sound volumes are independently adjustable in Settings.
- The rare Black Hole game-over event triggers correctly when qualifying conditions are met, plays the Singularity cinematic, and presents the score summary screen.
- The Universal Collapse game-over event triggers when all bodies reach full Collapse simultaneously.
- Rare game-over events occur with a low frequency (≤5% per qualifying turn) and do not trigger routinely.
- Coins/points are awarded correctly: Genesis choices grant bonus coins, Equilibrium choices grant standard coins, Collapse choices grant zero or negative coins.
- The HUD coin counter updates with an animated increment/decrement on every change.
- The Notification Feed displays auto-dismissing toasts for important entity alerts.
- Story Mode contains at least three playable chapters, each beginning with a cinematic cutscene and opening with a predefined system layout.
- All transitions between screens use smooth animated transitions with no hard cuts or blank screens.
- A Collapse destruction event triggers a visible and audible animation before the body is removed.
- A Genesis evolution event triggers a visible upgrade animation, plays the evolution sound, and grants a coin bonus.
- The game auto-saves progress in both modes without requiring manual save actions.
- The Pause overlay is accessible at any time during gameplay and does not cause state loss.
- The UI across all screens uses rounded components, soft glow effects, clear iconography, and consistent friendly styling.
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
- Custom reference image upload by the player.