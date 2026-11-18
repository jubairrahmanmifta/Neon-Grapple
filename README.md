# Neon Grapple

A one-button grapple-swing endless runner through a neon cyberpunk city. Built
with plain JavaScript ES modules and Canvas 2D — no dependencies, no build step.

**Current state:** Stage 7 (procedural hazards and lethal collision). The game
opens on a neon Main Menu showing your saved High Score and bolt bank. Space,
left click, or touch starts a run: auto-run right across an endless chain of
rooftops, press and hold to swing from the yellow anchors, and release to land.
Rooftops may sprout red spike strips, gaps may hold horizontal or vertical
lasers, and drones bob in the skyline. Touching a hazard kills you instantly
with a violent shake and a red particle burst. Falling into a gap does too. The
Game Over summary lists the run's score, bolts earned, and all-time best; Space
or click returns to the menu, and the record survives a reload via localStorage.
See [GAME_SPEC.md](./GAME_SPEC.md) for the concept and the full stage roadmap.

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
src/world.js        procedural rooftops, gaps, anchors, and hazards
src/grapple.js      anchor selection, rope constraint, release boost
src/hud.js          score, streak, and game-over screen-space overlay
src/particles.js    glowing bursts with gravity, used for impact feedback
src/save.js         guarded localStorage persistence (high score + bolts)
src/hazards.js      hazard rendering and sine-wave drone bobbing
GAME_SPEC.md        concept, stage roadmap 0–8, constraints, changelog
README.md           this file
```

## Verify Stage 7

1. Run the server and open the URL above. The game starts on the `NEON GRAPPLE`
   menu with your saved High Score and Bolts; no city is drawn behind it.
2. Press Space or click: the run starts at x = 400 with score top-left, streak
   top-centre, and the gold bolts counter top-right. Keep an eye on the city:
   some rooftops have bright pink/red spike teeth, some gaps are crossed by
   glowing red lasers (horizontal or vertical), and dark drones with red eyes
   bob up and down in the sky.
3. Touch a spike, laser, or drone. The whole city jolts, a cloud of red particles
   bursts from the player, and `GAME OVER` appears immediately with the run's
   score, `Bolts Earned: +N`, and all-time `Best`.
4. Press Space or click on the summary: the menu returns with the High Score and
   total Bolts updated. Refresh the page; the totals persist via localStorage.
5. Fall into a gap instead: the same summary appears and saves the run.
6. Resize the window: hazards and text stay readable on narrow phones, and the
   console stays empty.
7. Grapple physics, particles, shake, trail, scoring, and persistence are
   unchanged from Stage 6. There is still no slow-mo, audio, near-miss scoring,
   unlocks, missions, or daily seed.
