# NEON GRAPPLE — Game Specification

**Status:** Stage 0 — Scaffold
**Platform:** CrazyGames (HTML5, desktop + mobile web)
**Genre:** One-button grapple-swing endless runner

---

## 1. Concept

Neon Grapple is a fast, one-button, side-view endless runner set in a procedurally
generated neon cyberpunk city. The player never runs on the ground: they fire a
grappling line at a skyline anchor, swing on the tether, release at the right
moment, and carry their momentum into the next swing.

The fantasy is flow: chain clean swings, skim past hazards, and build speed through
a city that never repeats. There is no finish line — the goal is a longer run, a
higher multiplier, and a better score.

### Pillars

1. **One button, deep timing.** The whole game is press → hold → release. Skill
   comes from *when* you attach and *when* you let go, not from complex inputs.
2. **Momentum is the reward.** Speed is preserved through swings; a good release
   launches farther and faster. Hesitation costs height and distance.
3. **Near-miss combo.** Danger is the scoring engine. Skimming a hazard without
   touching it extends the combo window and raises the multiplier.
4. **Instant readability.** Neon silhouettes, strong parallax, and clear anchor
   highlights keep a 100 km/h scene legible on a phone.

### Core loop

- Automatic forward travel; the world scrolls toward the player.
- **Press/hold:** fire a tether at the best available anchor ahead and swing.
- **Release:** detach, keep the tangential velocity, and fly to the next anchor.
- Avoiding rooftops, beams, drones, and other hazards keeps the run alive.
- One collision ends the run; distance, near-misses, and swing chains determine
  the final score.

### Controls

| Action | Desktop | Mobile |
| --- | --- | --- |
| Fire / hold grapple | Space, left mouse, touch | Tap and hold |
| Release grapple | Release the key/button | Lift finger |
| Pause | Esc / P (planned) | Pause button (planned) |

The game must be fully playable with one finger and one input at a time.

### Scoring model (target)

- **Distance:** points per meter travelled, growing with speed.
- **Near-miss:** passing close to a hazard without collision awards a small burst
  and refreshes the combo timer.
- **Combo multiplier:** each near-miss or clean swing inside the combo window
  increases the multiplier; letting the window expire resets it.
- **Best run:** persisted locally (and via the platform SDK once integrated).

---

## 2. Stage Roadmap

Each stage must ship a playable, bug-free build and leave the previous stage's
behavior intact.

### Stage 0 — Scaffold ✅

Fullscreen Canvas 2D page, config module, fixed-timestep loop, math utilities,
placeholder title and live FPS HUD, project documentation.
**Done when:** page loads with no console errors, FPS is stable, and resizing
keeps the canvas sharp without scrollbars.

### Stage 1 — Player & Grapple Prototype

Player body with gravity, input handling, target selection among nearby anchors,
pendulum/tether constraint, swing release with preserved momentum, and a basic
follow camera. Temporary flat-colour debug world.
**Done when:** a player can chain several swings in an empty test level and the
motion feels smooth and predictable.

### Stage 2 — Procedural City & Camera

Layered procedural skyline (fog/parallax), generated anchor points, building
geometry, endless recycling, and a deadzone camera that leads the player.
**Done when:** flying in one direction for several minutes never reveals an edge,
a repeated layout, or a hitch while new chunks spawn.

### Stage 3 — Hazards & Run Lifecycle

Hazard shapes (rooftops, signs, drones, beams), collision detection, death,
run start/restart flow, and a minimal HUD. No meta-progression yet.
**Done when:** collisions are fair and readable, and restart is instant.

### Stage 4 — Momentum, Near-Miss & Scoring

Distance and speed scoring, near-miss detection, combo timer/multiplier, score
popups, best-score persistence, and a results screen.
**Done when:** skilled play visibly produces a higher multiplier and score, and
the combo window feels earned rather than random.

### Stage 5 — Game Feel & Visual Polish

Swing trails, tether glow, particle bursts, speed lines, screen shake, hit-stop,
parallax tuning, and layered Canvas 2D bloom effects (no WebGL).
**Done when:** the game reads clearly at full speed and every input has immediate
visual feedback, with frame time still inside budget.

### Stage 6 — Audio & Accessibility

Procedural WebAudio music and SFX (tether, release, near-miss, crash), volume and
mute controls, reduced-motion mode, colour-blind-safe accent variants, pause and
focus handling, and full keyboard navigation.
**Done when:** the game is playable muted, playable with reduced motion, and all
audio can be muted in one action.

### Stage 7 — Mobile, Performance & UX

Touch tuning, safe-area-aware HUD, responsive layout from portrait phones to
ultrawide desktop, adaptive quality, visibility pause, and a performance pass
against mid-range mobile hardware.
**Done when:** a steady 60 FPS (or a graceful 30 FPS fallback) on target devices,
with no layout breakage across orientations.

### Stage 8 — CrazyGames Integration & Release

CrazyGames SDK integration (loading state, ads where appropriate, cloud/local
save, mute hooks) behind a guarded adapter, QA matrix across browsers/devices,
store assets and description, and final submission build.
**Done when:** the build passes CrazyGames requirements and runs correctly both
inside the portal and locally without the SDK present.

---

## 3. Technical Constraints

- **Plain JavaScript ES modules.** No npm, bundler, frameworks, or build step.
  The game must run from any static file server.
- **Zero dependencies.** No external libraries, fonts, or art assets.
- **Canvas 2D only.** No WebGL. Visuals are procedural shapes, gradients, and
  glows. Audio (Stage 6) must be synthesized with WebAudio.
- **Fixed 60 Hz logic.** Updates use a fixed timestep; rendering interpolates.
  Frame time is capped and catch-up work is capped to survive tab switches.
- **Small modules.** Keep every source file at or under roughly 200 lines.
- **Mobile + desktop.** Support current Chrome, Edge, Firefox, and Safari, with
  touch and mouse input, arbitrary window sizes, and devicePixelRatio up to 3.
- **Performance budget.** 60 FPS on mid-range mobile; cap the backing-store DPR
  (currently 2) and avoid per-frame allocations in hot paths.
- **Platform-safe.** No external network calls, no `eval`, no storage or SDK use
  before Stage 8; any CrazyGames SDK access must be optional/guarded so local
  development keeps working.

---

## 4. Architecture

```
index.html          fullscreen canvas + page CSS
src/main.js         bootstrap, viewport/DPR handling, placeholder render
src/config.js       all tunable constants (single exported object)
src/loop.js         fixed-timestep loop + interpolated render
src/utils.js        clamp, lerp, rand, AABB helpers
```

Planned additions (introduced only when their stage begins):

```
src/input.js        unified one-button input (keyboard/mouse/touch)
src/player.js       player state and motion
src/grapple.js      anchor selection, tether constraint, release
src/world.js        chunk generation and recycling
src/camera.js       follow/deadzone camera and shake
src/scoring.js      distance, near-miss, combo, persistence
src/audio.js        procedural WebAudio
src/platform.js     guarded CrazyGames SDK adapter
```

`main.js` owns the canvas and drives `update`/`render` through `loop.js`.
Gameplay systems should receive explicit dependencies rather than reading globals.

---

## 5. Changelog

### Stage 0 — Scaffold — 2026-11-17

- Created project structure: `index.html`, `src/main.js`, `src/config.js`,
  `src/loop.js`, `src/utils.js`, `README.md`, `GAME_SPEC.md`.
- Added fullscreen, scrollbar-free Canvas 2D page with a dark background.
- Added DPR-aware resize handling (capped at 2×) with a CSS-pixel drawing space.
- Added a fixed 60 Hz loop with capped frame delta, capped catch-up steps, and
  interpolated render time.
- Added the centered "NEON GRAPPLE" placeholder title and a live FPS counter.
  The title + glow are cached in an offscreen layer and only rebuilt on resize,
  keeping per-frame drawing cheap.
- No gameplay, input, audio, or persistence yet.
