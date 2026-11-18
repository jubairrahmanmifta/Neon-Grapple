# NEON GRAPPLE — Game Specification

**Status:** Stage 3 — Procedural rooftops + auto-run
**Platform:** CrazyGames (HTML5, desktop + mobile web)
**Genre:** One-button grapple-swing endless runner

---

## 1. Concept

Neon Grapple is a fast, one-button, side-view endless runner set in a procedurally
generated neon cyberpunk city. The player auto-runs across an endless chain of
rooftops, fires a grappling line at the skyline anchor above each gap, swings
across, and releases to land running on the far side.

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

- Automatic forward travel along rooftops; the world scrolls toward the player.
- Gaps interrupt the run. **Press/hold:** fire a tether at the best available
  anchor above the next gap and swing across.
- **Release:** detach, keep the tangential velocity, and land running on the far
  rooftop.
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

**Stage 3 controls:** the player auto-runs to the right on rooftops. Space / left
mouse / touch fires the tether at the anchor above the next gap, from the ground
or mid-air; releasing the input detaches. There is no jump.

### Scoring model (target)

- **Distance:** points per meter travelled, growing with speed.
- **Near-miss:** passing close to a hazard without collision awards a small burst
  and refreshes the combo timer.
- **Combo multiplier:** each near-miss or clean swing inside the combo window
  increases the multiplier; letting the window expire resets it.
- **Best run:** persisted locally (and via the platform SDK once integrated).

---

## 2. Stage Roadmap

Stage 0: Scaffold (Done)

Stage 1: Player auto-runner, camera, placeholder art (Done)

Stage 2: Grapple + swing physics (Done)

Stage 3: Procedural chunks: rooftops, gaps, anchors (Current)

Stage 4: Collision, death, score, combo, HUD

Stage 5: Juice: particles, shake, trails, slow-mo

Stage 6: Save/load, bolts, unlocks, missions, daily seed

Stage 7: CrazyGames SDK: rewarded revive, ads, leaderboard

Stage 8: Mobile touch, perf, QA, ship build

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
src/main.js         bootstrap, viewport/DPR handling, input, system wiring
src/config.js       all tunable constants (single exported object)
src/loop.js         fixed-timestep loop + interpolated render
src/utils.js        clamp, lerp, rand, AABB helpers
src/player.js       auto-running body, gravity, rooftop landing, tether art
src/camera.js       X-locked follow camera with slow eased vertical follow
src/world.js        procedural rooftops, gaps, and gap anchors
src/grapple.js      anchor selection, tether constraint, release boost
```

Planned additions (introduced only when their stage begins):

```
src/input.js        unified one-button input (keyboard/mouse/touch)
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

### Stage 1 — Player auto-runner, camera, placeholder art — 2026-11-17

- Added `src/player.js`: 30×50 player body with constant rightward auto-run,
  gravity, ground clamping, and a grounded-only jump.
- Added `src/camera.js`: horizontal follow camera that holds the player
  `cameraOffsetX` pixels from the left edge, with interpolated rendering.
- Added `src/world.js`: dark purple ground plane at `groundY` with scrolling
  marker lines every 100 px (every 5th marker taller/brighter) and a neon rim.
- Wired jump input in `src/main.js` for Space, W, Up Arrow, and left click, with
  key-repeat suppression and default-scroll prevention.
- Rendered the player as a glowing cyan rectangle with a magenta facing marker.
- Removed the centered title and its cached render layer; kept the live FPS HUD.
- Added `playerSpeed`, `gravity`, `jumpForce`, `groundY`, and `cameraOffsetX` to
  `CONFIG`.
- No grappling, collision, scoring, audio, or persistence yet.

### Stage 2 — Grapple + swing physics — 2026-11-18

- Added `src/grapple.js`: selects the nearest anchor ahead within `grappleRange`,
  captures the rope length at attach, enforces the pendulum each step, and
  multiplies velocity by `swingSpeedBoost` on release.
- Added four static anchors in `src/world.js` at (800, 200), (1500, 250),
  (2200, 150), and (3000, 300), rendered as glowing yellow pucks with a hot
  inner dot.
- Replaced jump input with one-button fire/hold/release on Space, left mouse, and
  touch via pointer events; key repeat, pointer cancellation, and focus loss are
  handled.
- Removed jump, ground clamping, and the per-step auto-run velocity reset from
  `src/player.js`. Gravity and the tether are now the only forces; momentum
  carries between swings.
- Added `player.applyGrappleConstraint()`: snaps the body to the tether circle,
  removes outward radial velocity, and leaves a slight elastic give through
  `ropeConstraintDamping`.
- Changed the camera to ease vertically toward the player, and to frame the
  player–anchor midpoint while attached so the full pendulum stays visible.
- Moved the decorative ground down to `groundY: 700` (still non-colliding) so
  normal swings stay in the skyline; there is no death or reset yet.
- Removed `jumpForce`; added `grappleRange`, `ropeConstraintDamping`, and
  `swingSpeedBoost` to `CONFIG`.
- No collision, death, scoring, audio, or persistence yet.

### Stage 3 — Procedural rooftops + auto-run — 2026-11-18

- Rebuilt `src/world.js` as an endless procedural generator. It starts with a
  1000 px rooftop at (0, 600), then appends random gaps (200–400 px), rooftops
  (400–800 px wide, same 600 px surface), and one anchor above the exact middle
  of every gap at a random height of 200–300 px.
- Added generate-ahead / prune-behind streaming: chunks are created until the
  rightmost roof is 2000 px ahead of the camera, and platforms/anchors more than
  1000 px behind it are removed. The arrays stay small on arbitrarily long runs.
- Replaced the static anchor list and scrolling ground markers with rendered
  rooftops: dark purple slabs under a glowing 3 px neon top edge. Anchors keep
  their bright yellow puck + hot core look and are culled off-screen.
- Restored the auto-runner in `src/player.js`. Forward speed accelerates toward
  `runSpeed` whenever it drops below it, and landing snaps it back to
  `runSpeed`, so swings can add momentum while forward motion always recovers.
- Added one-way rooftop landing collision: the player lands on the highest top
  surface crossed while falling, snaps exactly onto it, zeroes `vy`, and sets
  `isGrounded`; without a surface beneath it, the player falls and clears the
  flag. Pressing the grapple works both grounded and airborne.
- Changed the camera to track X rigidly at the usual 300 px offset and follow Y
  with a deliberately slow exponential lerp (`cameraFollowRate: 3`, focus at 70%
  of viewport height). The player–anchor midpoint framing was removed.
- Added `runSpeed`, `runAcceleration`, `rooftopY`, gap/rooftop width ranges,
  anchor height range, and generation distances to `CONFIG`; retired
  `playerSpeed` and `groundY`.
- Verified with Node physics/generation tests and headless Chrome runs across
  multiple keyboard- and mouse-cleared gaps at 1280×581 and 820×500, with an
  empty console.
- Still no death/reset, hazards, scoring, audio, or persistence; falling into a
  gap currently drops the player below the city until Stage 4.
