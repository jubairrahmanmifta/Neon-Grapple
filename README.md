# Neon Grapple

A one-button grapple-swing endless runner through a neon cyberpunk city. Built
with plain JavaScript ES modules and Canvas 2D — no dependencies, no build step.

**Current state:** Stage 0 (scaffold). The page shows the game title and a live
FPS counter; there is no gameplay yet. See [GAME_SPEC.md](./GAME_SPEC.md) for the
concept and the full stage roadmap.

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
src/main.js         entry point: viewport handling, title + FPS render
src/config.js       all tunable constants in one exported CONFIG object
src/loop.js         fixed-timestep 60 Hz loop with interpolated rendering
src/utils.js        clamp, lerp, rand, and AABB helpers
GAME_SPEC.md        concept, stage roadmap 0–8, constraints, changelog
README.md           this file
```

## Verify Stage 0

1. Run the server and open the URL above.
2. The canvas fills the window with a dark background, the glowing
   **NEON GRAPPLE** title centered, and an `FPS 60` readout in the top-left.
3. No scrollbars appear, even when the content would overflow.
4. Resize the window or change zoom/monitor: the title stays centered, the
   canvas refills the viewport, and text remains sharp.
5. The browser console should be empty.

## Stage 1 preview

Next up is the player + grapple prototype: gravity, a swingable tether, momentum
preservation, and a follow camera in a flat test world.
