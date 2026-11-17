/**
 * Neon Grapple — central tuning table.
 *
 * Every value that affects timing, layout, colour, or feel lives here so it can
 * be adjusted without hunting through the codebase. Viewport-dependent sizes are
 * expressed as ratios and converted at draw time, keeping the game crisp at any
 * resolution.
 */
export const CONFIG = Object.freeze({
  loop: {
    /** Logic updates per second. Fixed so future physics stays deterministic. */
    updatesPerSecond: 60,
    /** Never simulate more than this much real time in one frame (seconds). */
    maxFrameTime: 0.25,
    /** Hard ceiling on catch-up steps per frame; excess backlog is dropped. */
    maxUpdatesPerFrame: 5,
  },

  // --- Stage 1: auto-runner tuning -----------------------------------------

  /** Constant rightward run speed, in pixels per second. */
  playerSpeed: 300,
  /** Downward acceleration, in pixels per second squared. */
  gravity: 1500,
  /** Upward velocity applied by a jump, in pixels per second (negative = up). */
  jumpForce: -600,
  /** World-space Y of the ground surface; the player's feet rest here. */
  groundY: 500,
  /** Pixels from the left edge where the camera holds the player on screen. */
  cameraOffsetX: 300,

  render: {
    /** Backing-store pixel-ratio cap. Keeps high-DPI phones at a sane cost. */
    maxDPR: 2,
    background: '#05060f',
    fonts: {
      display: '"Arial Black", "Segoe UI", system-ui, -apple-system, sans-serif',
      mono: 'ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace',
    },
  },

  hud: {
    fps: {
      label: 'FPS',
      color: '#86ffc7',
      glow: 'rgba(134, 255, 199, 0.55)',
      weight: 600,
      size: 14,
      margin: 18,
      /** Seconds between rolling FPS samples. */
      sampleWindow: 0.5,
    },
  },
});
