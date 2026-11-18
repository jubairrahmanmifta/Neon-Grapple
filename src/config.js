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

  /** Initial rightward speed, in pixels per second. Swings add to it. */
  playerSpeed: 300,
  /** Downward acceleration, in pixels per second squared. */
  gravity: 1500,
  /** World-space Y of the decorative ground plane. Non-colliding until Stage 4. */
  groundY: 700,
  /** Pixels from the left edge where the camera holds the player on screen. */
  cameraOffsetX: 300,
  /** Fraction of viewport height where the camera holds its focus point. */
  cameraOffsetY: 0.5,
  /** Vertical camera catch-up rate; lower is floatier, higher is locked on. */
  cameraFollowRate: 8,
  /** Player spawn position in world space. Starts airborne so gravity acts. */
  spawnX: 400,
  spawnY: 270,

  // --- Stage 2: grapple tuning ---------------------------------------------

  /** Maximum distance from the player's centre to an acceptable anchor. */
  grappleRange: 600,
  /** Fraction of the rope's overstretch corrected each step (soft tether). */
  ropeConstraintDamping: 0.98,
  /** Velocity multiplier applied on release; rewards well-timed detaches. */
  swingSpeedBoost: 1.05,

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
