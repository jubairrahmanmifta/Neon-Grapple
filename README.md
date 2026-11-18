# Neon Grapple

A one-button grapple-swing endless runner through a neon cyberpunk city. Built
with plain JavaScript ES modules and Canvas 2D — no dependencies, no build step.

**Current state:** Stage 8 (CrazyGames SDK, ads, and rewarded revive). The game
opens on a neon Main Menu showing your saved High Score and bolt bank. Space,
left click, or touch starts a run: auto-run right across an endless chain of
rooftops, press and hold to swing from the yellow anchors, and release to land.
Rooftops may sprout red spike strips, gaps may hold horizontal or vertical
lasers, and drones bob in the skyline. Touching a hazard kills you instantly
with a violent shake and a red particle burst. Falling into a gap does too. The
Game Over summary lists the run's score, bolts earned, and all-time best; Space
or click returns to the menu, and the record survives a reload via localStorage.
The CrazyGames SDK v3 is wired for gameplay signals and ads; on localhost every
call is a logged mock. Die and press R (or tap the gold prompt) to watch a
rewarded ad and revive once per run; every third death requests a midroll break.
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
src/sdk.js          guarded CrazyGames SDK v3 wrapper with localhost mocks
GAME_SPEC.md        concept, stage roadmap 0–8, constraints, changelog
README.md           this file
```

## Verify Stage 8

1. Run the server and open the URL above. The console shows `SDK Mock: init` and
   the menu loads normally; no network or platform account is required.
2. Press Space or click and die once (a gap or any hazard works). The console
   logs `SDK Mock: gameplayStart`, then `SDK Mock: gameplayStop`. The Game Over
   summary shows a gold `Press R to Revive` below `Press Space to Continue`.
3. Press R. The console logs `SDK Mock: showRewarded` and `SDK Mock: gameplayStart`;
   the player pops back into the air with an upward impulse and the score starts
   climbing again. The gold revive prompt is gone.
4. Die again in the same run: the gold prompt does not return, and pressing R
   does nothing (one revive per run).
5. Start another run and die a third time overall: the console logs
   `SDK Mock: showMidroll`. The counter resets on that break.
6. Space or click still returns to the summary to the menu, and High Score and
   Bolts persist across a reload. Hazards, physics, particles, and scoring are
   unchanged from Stage 7. The console has no errors beyond the mock SDK logs.
