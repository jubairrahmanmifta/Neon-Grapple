# Neon Grapple

A one-button grapple-swing endless runner through a neon cyberpunk city. Built
with plain JavaScript ES modules and Canvas 2D — no dependencies, no build step.

**Current state:** Stage 5 (game juice). The player auto-runs right across an
endless chain of neon rooftops. When a gap approaches, press and hold Space,
the left mouse button, or touch to fire a cyan tether at the yellow anchor above
the gap, swing across, then release to land running on the far side. The body
now tilts with its velocity and leaves a ghost trail; attaching shakes the
screen and sprays cyan sparks, landing kicks up magenta dust and a smaller
shake. Fall into a gap and the run ends; press Space or click to restart. The
score climbs with distance and the streak grows while you chain swings without
touching a rooftop. See [GAME_SPEC.md](./GAME_SPEC.md) for the concept and the
full stage roadmap.

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
GAME_SPEC.md        concept, stage roadmap 0–8, constraints, changelog
README.md           this file
```

## Verify Stage 5

1. Run the server and open the URL above.
2. While auto-running, the player rectangle is level. As it falls into a gap it
   tips forward (right side down); as a swing lifts it, it tips backward. A
   trail of ten faint, shrinking cyan ghosts follows its every move.
3. Fire the tether at a yellow anchor. The whole city jolts with a short screen
   shake and cyan sparks explode at the anchor puck.
4. Release on the far side and land on a rooftop: a smaller shake fires and
   magenta dust kicks up at the player's feet.
5. The score, streak, and FPS readouts stay perfectly still during every shake;
   only the world layer moves.
6. Fall into a gap without grappling. `GAME OVER` and `Press Space to Restart`
   appear; particles already in the air finish settling while the world freezes.
7. Press Space or click: shake is cleared, particles/trail are clean for the new
   run, and the player starts again at x = 400.
8. Resize the window: the canvas refills the viewport, the HUD remains fixed in
   screen space, and the console stays empty.
9. Physics, scoring, death, and restart behaviour are unchanged from Stage 4.
   There is still no slow-mo, audio, hazard collision, or persistence.
