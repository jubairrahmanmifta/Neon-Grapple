import { CONFIG } from './config.js';

/**
 * Creates a fixed-timestep game loop.
 *
 * - `update(step)` runs at a constant CONFIG.loop.updatesPerSecond (60 Hz by
 *   default), so future simulation code is deterministic and frame-rate
 *   independent.
 * - `render(alpha, frameDelta)` runs once per animation frame. `alpha` is the
 *   interpolation factor in [0, 1) between the previous and current logic
 *   state; `frameDelta` is the capped frame time in seconds.
 *
 * A tab-switch can produce a multi-second frame. The delta is capped and the
 * per-frame catch-up work is capped, so the loop can never spiral.
 *
 * @param {{ update: (step: number) => void, render: (alpha: number, frameDelta: number) => void }} handlers
 * @returns {{ start: () => void, stop: () => void, isRunning: () => boolean }}
 */
export function createLoop({ update, render }) {
  if (typeof update !== 'function' || typeof render !== 'function') {
    throw new TypeError('createLoop requires update and render functions');
  }

  const STEP = 1 / CONFIG.loop.updatesPerSecond;
  const MAX_FRAME_TIME = CONFIG.loop.maxFrameTime;
  const MAX_UPDATES = CONFIG.loop.maxUpdatesPerFrame;

  let rafId = 0;
  let running = false;
  let lastTime = 0;
  let accumulator = 0;

  function resetClock() {
    lastTime = performance.now();
    accumulator = 0;
  }

  function frame(now) {
    if (!running) return;
    rafId = requestAnimationFrame(frame);

    let frameDelta = (now - lastTime) / 1000;
    lastTime = now;

    if (!Number.isFinite(frameDelta) || frameDelta < 0) frameDelta = 0;
    if (frameDelta > MAX_FRAME_TIME) frameDelta = MAX_FRAME_TIME;

    accumulator += frameDelta;

    let updates = 0;
    while (accumulator >= STEP && updates < MAX_UPDATES) {
      update(STEP);
      accumulator -= STEP;
      updates += 1;
    }

    // Hit the ceiling: discard the leftover backlog rather than falling further
    // behind every frame (the "spiral of death").
    if (updates === MAX_UPDATES) accumulator %= STEP;

    render(accumulator / STEP, frameDelta);
  }

  function start() {
    if (running) return;
    running = true;
    resetClock();
    rafId = requestAnimationFrame(frame);
  }

  function stop() {
    if (!running) return;
    running = false;
    cancelAnimationFrame(rafId);
    rafId = 0;
  }

  function onVisibilityChange() {
    // Returning from a hidden tab: start fresh instead of replaying lost time.
    if (document.visibilityState === 'visible') resetClock();
  }

  document.addEventListener('visibilitychange', onVisibilityChange);

  return {
    start,
    stop,
    isRunning: () => running,
  };
}
