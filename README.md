# Neon Grapple

A one-button grapple-swing endless runner through a neon cyberpunk city. Built
with plain JavaScript ES modules and Canvas 2D — no dependencies, no build step.

**Current state:** Stage 1 (player auto-runner, camera, placeholder art). A cyan
player runs right on a neon ground plane, jumps with Space/W/Up/click, and the
world scrolls past under a follow camera. There is no grappling yet. See
[GAME_SPEC.md](./GAME_SPEC.md) for the concept and the full stage roadmap.

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
src/main.js         entry point: viewport, input, world/player render
src/config.js       all tunable constants in one exported CONFIG object
src/loop.js         fixed-timestep 60 Hz loop with interpolated rendering
src/utils.js        clamp, lerp, rand, and AABB helpers
src/player.js       auto-runner physics, jump, placeholder art
src/camera.js       horizontal follow camera
src/world.js        placeholder ground plane and scrolling markers
GAME_SPEC.md        concept, stage roadmap 0–8, constraints, changelog
README.md           this file
```

## Verify Stage 1

1. Run the server and open the URL above.
2. The cyan player rectangle sits near the left third of the screen and runs
   right automatically; the ground markers scroll past at a constant rate.
3. Press Space, W, Up Arrow, or left-click: the player jumps and falls back to
   the ground under gravity. Pressing mid-air does nothing.
4. The `FPS 60` readout stays in the top-left and the console stays empty.
5. Resize the window: the canvas refills the viewport and stays sharp.
6. No grappling exists yet — that arrives in Stage 2.
