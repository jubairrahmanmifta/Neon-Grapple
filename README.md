# Neon Grapple

A one-button grapple-swing endless runner through a neon cyberpunk city. Built
with plain JavaScript ES modules and Canvas 2D — no dependencies, no build step.

**Current state:** Stage 6 (save/load, bolts, menu and game-over flow). The game
opens on a neon Main Menu showing your saved High Score and bolt bank. Space,
left click, or touch starts a run: auto-run right across an endless chain of
rooftops, press and hold to swing from the yellow anchors, and release to land.
The score climbs with distance and earns bolts (1 bolt per 20 score); the gold
top-right counter tracks the current run. Fall into a gap to see a Game Over
summary with the run's score, bolts earned, and all-time best. Space or click
returns to the menu; the record is saved in localStorage and survives a reload.
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
src/world.js        procedural rooftops, gaps, and gap anchors
src/grapple.js      anchor selection, rope constraint, release boost
src/hud.js          score, streak, and game-over screen-space overlay
src/particles.js    glowing bursts with gravity, used for impact feedback
src/save.js         guarded localStorage persistence (high score + bolts)
GAME_SPEC.md        concept, stage roadmap 0–8, constraints, changelog
README.md           this file
```

## Verify Stage 6

1. Run the server and open the URL above. The game starts on the `NEON GRAPPLE`
   menu with `High Score: 0` and `Bolts: 0` on a fresh browser profile; no city
   is drawn behind it and the play prompt gently pulses.
2. Press Space or click: the run starts at x = 400 with the score at top-left,
   the streak at top-centre, and a gold `BOLTS` counter at top-right. The FPS
   readout sits just below the bolts counter.
3. Let the score climb: `BOLTS` rises by roughly one per 20 score (50 per 1000).
4. Fall into a gap without grappling. The `GAME OVER` overlay lists the run's
   score, `Bolts Earned: +N`, and your all-time `Best`.
5. Press Space or click on the summary: the menu returns with the High Score and
   total Bolts updated to include the run you just finished.
6. Refresh the browser: the menu still shows the same High Score and total
   Bolts (stored under `neonGrappleSave` in localStorage).
7. Resize the window: text scales down instead of clipping on narrow phones, and
   the console stays empty.
8. Grapple physics, particles, shake, trail, and death behaviour are unchanged
   from Stage 5. There is still no slow-mo, audio, hazard collision, unlocks,
   missions, or daily seed.
