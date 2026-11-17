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

  render: {
    /** Backing-store pixel-ratio cap. Keeps high-DPI phones at a sane cost. */
    maxDPR: 2,
    background: '#05060f',
    fonts: {
      display: '"Arial Black", "Segoe UI", system-ui, -apple-system, sans-serif',
      mono: 'ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace',
    },
  },

  title: {
    text: 'NEON GRAPPLE',
    weight: 900,
    /** Base size = clamp(min(width * widthRatio, height * heightRatio), min, max). */
    size: {
      widthRatio: 0.11,
      heightRatio: 0.2,
      min: 30,
      max: 132,
    },
    /** Long titles shrink to fit within this share of the viewport width. */
    maxWidthRatio: 0.86,
    gradient: ['#54f6ff', '#9b6bff', '#ff3fd0'],
    glowColor: '#7b5cff',
    glowBlur: 26,
    pulseHz: 0.35,
    /** Opacity swing of the cached title glow (0 = static, 1 = full fade). */
    pulseAlpha: 0.12,
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
