# Neon Grapple

A one-button grapple-swing endless runner through a neon cyberpunk city. Built
with plain JavaScript ES modules and Canvas 2D — no dependencies, no build step.

**Current state:** Stage 3 (procedural rooftops + auto-run). The player auto-runs
right across an endless chain of neon rooftops. When a gap approaches, press and
hold Space, the left mouse button, or touch to fire a cyan tether at the yellow
anchor above the gap, swing across, then release to land running on the far side.
Rooftops, gaps, and anchors generate forever. See
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
src/main.js         entry point: viewport, input, world/player/grapple wiring
src/config.js       all tunable constants in one exported CONFIG object
src/loop.js         fixed-timestep 60 Hz loop with interpolated rendering
src/utils.js        clamp, lerp, rand, and AABB helpers
src/player.js       auto-running body, gravity, rooftop landing, placeholder art
src/camera.js       X-locked follow + slow eased vertical camera
src/world.js        procedural rooftops, gaps, and gap anchors
src/grapple.js      anchor selection, rope constraint, release boost
GAME_SPEC.md        concept, stage roadmap 0–8, constraints, changelog
README.md           this file
```

## Verify Stage 3

1. Run the server and open the URL above.
2. The cyan player auto-runs to the right on a neon-edged rooftop while the
   camera holds it 300 px from the left edge.
3. Yellow anchors sit above every gap. As a gap approaches, press and hold Space,
   left-click, or touch: a glowing cyan tether fires at the anchor and the player
   runs off the edge into a pendulum swing.
4. Hold through the bottom of the arc, then release as the player rises on the
   far side. The tether disappears, the player carries its momentum, and it
   should land on the next rooftop.
5. Landing resumes auto-running immediately. Repeat across as many gaps as you
   like: rooftops, gaps (200–400 px), and anchors keep generating ahead while old
   ones are pruned behind.
6. Falling into a gap drops the player below the city — there is no death or
   reset until Stage 4.
7. The `FPS 60` readout stays in the top-left, the camera's vertical follow is
   deliberately slow, and the console stays empty.
8. Resize the window: the canvas refills the viewport and the rooftop/anchor
   layout stays readable at compact sizes.
9. There is still no scoring, death, hazards, audio, or persistence — those
   arrive in later stages.
