# Neon Grapple

A one-button grapple-swing endless runner through a neon cyberpunk city. Built
with plain JavaScript ES modules and Canvas 2D — no dependencies, no build step.

**Current state:** Stage 4 (death, restart, score, combo, HUD). The player
auto-runs right across an endless chain of neon rooftops. When a gap approaches,
press and hold Space, the left mouse button, or touch to fire a cyan tether at
the yellow anchor above the gap, swing across, then release to land running on
the far side. Fall into a gap and the run ends; press Space or click to restart.
The score climbs with distance and the streak grows while you chain swings
without touching a rooftop. See [GAME_SPEC.md](./GAME_SPEC.md) for the concept
and the full stage roadmap.

## Run locally

Requirements: any modern browser and Python 3 (for a static file server).

From the project root:

```bash
python3 -m http.server 8000
```

Then open:

**http://localhost:8000**

Stop the server with `Ctrl+C`.

> ES modules are blocked by the browser under `file://`, so opening
> `index.html` directly will not work. There is nothing to install or build.

## Project structure

```
index.html          fullscreen canvas page
src/main.js         entry point: viewport, input, world/player/grapple wiring
src/config.js       all tunable constants in one exported CONFIG object
src/loop.js         fixed-timestep 60 Hz loop with interpolated rendering
src/utils.js        clamp, lerp, rand, and AABB helpers
src/player.js       auto-running body, gravity, rooftop landing, placeholder art
src/camera.js       X-locked follow + slow eased vertical camera
src/world.js        procedural rooftops, gaps, and gap anchors
src/grapple.js      anchor selection, rope constraint, release boost
src/hud.js          score, streak, and game-over screen-space overlay
GAME_SPEC.md        concept, stage roadmap 0–8, constraints, changelog
README.md           this file
```

## Verify Stage 4

1. Run the server and open the URL above.
2. The cyan player auto-runs to the right on a neon-edged rooftop while the
   camera holds it 300 px from the left edge. `SCORE` (cyan, top-left) climbs as
   you move right; `FPS` sits in the top-right.
3. Yellow anchors sit above every gap. As a gap approaches, press and hold Space,
   left-click, or touch: a glowing cyan tether fires at the anchor and the player
   runs off the edge into a pendulum swing.
4. Hold through the bottom of the arc, then release as the player rises on the
   far side. The tether disappears, the player carries its momentum, and it
   should land on the next rooftop.
5. Chaining a tether while still airborne shows `STREAK x1`, `x2`, and so on in
   magenta at the top-centre; touching a rooftop hides it again. Grounded
   attaches do not build the streak.
6. Run straight into a gap without grappling. Once the player falls past
   `y = 1000` the run freezes: the screen dims and shows `GAME OVER` plus
   `Press Space to Restart`.
7. Press Space or click. The world is rebuilt, the camera snaps back, and a new
   run starts at x = 400 with the score back at the spawn value (the best streak
   is kept as the run record).
8. Rooftops, gaps (200–400 px), and anchors keep generating ahead while old ones
   are pruned behind. The camera's vertical follow is deliberately slow, and the
   console stays empty.
9. Resize the window: the canvas refills the viewport and the HUD (including the
   game-over title) stays readable at compact sizes.
10. There is still no hazard collision, audio, or persistence — those arrive in
    later stages. Falling below the death plane is the only way to lose.
