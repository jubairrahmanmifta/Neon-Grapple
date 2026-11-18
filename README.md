# Neon Grapple

A one-button grapple-swing endless runner through a neon cyberpunk city. Built
with plain JavaScript ES modules and Canvas 2D — no dependencies, no build step.

**Current state:** Stage 2 (grapple + swing physics). The player starts airborne
and falls under gravity. Press and hold Space, the left mouse button, or touch to
fire a cyan tether at the nearest yellow anchor ahead and swing on it; release to
fly forward with a small momentum boost. Chain swings by grabbing the next anchor
in mid-air. See [GAME_SPEC.md](./GAME_SPEC.md) for the concept and the full stage
roadmap.

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
src/player.js       gravity, momentum, tether constraint, placeholder art
src/camera.js       horizontal follow + eased vertical framing
src/world.js        decorative ground, scrolling markers, static anchors
src/grapple.js      anchor selection, rope constraint, release boost
GAME_SPEC.md        concept, stage roadmap 0–8, constraints, changelog
README.md           this file
```

## Verify Stage 2

1. Run the server and open the URL above.
2. The cyan player starts near the left third and falls under gravity; the
   camera eases down with it and keeps the yellow anchors in view.
3. Press and hold Space, left-click, or touch: a glowing cyan line fires to the
   nearest yellow anchor ahead and the player swings beneath it like a pendulum.
4. Release: the tether disappears and the player flies forward with the swing
   momentum, boosted slightly by `swingSpeedBoost`.
5. While flying, press again as the next anchor comes into range to chain swings.
6. The `FPS 60` readout stays in the top-left, the ground markers scroll, and the
   console stays empty.
7. Resize the window: the canvas refills the viewport and stays sharp.
8. There is still no collision, death, score, audio, or persistence — those
   arrive in later stages.
