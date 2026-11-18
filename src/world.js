import { CONFIG } from './config.js';

/** Spacing of the ground tick marks, in world pixels. */
const MARKER_SPACING = 100;
/** Every Nth marker is taller and brighter to give a sense of scale. */
const MAJOR_EVERY = 5;

const COLORS = {
  ground: '#1a0a2e',
  rim: '#8a3cff',
  marker: 'rgba(146, 88, 255, 0.35)',
  markerMajor: 'rgba(200, 165, 255, 0.85)',
  anchor: '#ffe94a',
  anchorCore: '#fffbe0',
};

const ANCHOR_RADIUS = 9;
const ANCHOR_CORE_RADIUS = 3;

/**
 * Static swing anchors. Stage 3 will generate these procedurally; for now they
 * are a hand-placed chain so the pendulum can be tuned.
 */
export const ANCHORS = Object.freeze([
  Object.freeze({ x: 800, y: 200 }),
  Object.freeze({ x: 1500, y: 250 }),
  Object.freeze({ x: 2200, y: 150 }),
  Object.freeze({ x: 3000, y: 300 }),
]);

/**
 * Placeholder world renderer.
 *
 * Draws a dark purple ground plane below CONFIG.groundY and repeating vertical
 * markers so forward motion is visible. Only the slice of world currently on
 * screen is drawn, so the plane is effectively infinite without cost.
 *
 * Call with the camera translation already applied; `cameraX`/`cameraY` are
 * passed in so the visible range can be derived.
 */
export class World {
  render(ctx, cameraX, cameraY, view) {
    const top = CONFIG.groundY;
    const left = cameraX;
    const right = cameraX + view.width;
    const viewBottom = cameraY + view.height;
    const bottom = Math.max(viewBottom, top + 1);

    ctx.fillStyle = COLORS.ground;
    ctx.fillRect(left, top, view.width, bottom - top);

    const first = Math.floor(left / MARKER_SPACING) * MARKER_SPACING;
    for (let x = first; x <= right; x += MARKER_SPACING) {
      const major = Math.abs(x) % (MARKER_SPACING * MAJOR_EVERY) === 0;
      ctx.fillStyle = major ? COLORS.markerMajor : COLORS.marker;
      ctx.fillRect(x, top, major ? 2 : 1, major ? 44 : 22);
    }

    // Neon rim along the horizon line.
    ctx.fillStyle = COLORS.rim;
    ctx.fillRect(left, top - 2, view.width, 2);

    this.renderAnchors(ctx, left, right, cameraY, viewBottom);
  }

  /** Bright yellow pucks with a hot inner dot; only visible ones are drawn. */
  renderAnchors(ctx, left, right, top, bottom) {
    for (const anchor of ANCHORS) {
      if (anchor.x < left - 40 || anchor.x > right + 40) continue;
      if (anchor.y < top - 40 || anchor.y > bottom + 40) continue;

      ctx.save();
      ctx.shadowColor = 'rgba(255, 233, 74, 0.9)';
      ctx.shadowBlur = 18;
      ctx.fillStyle = COLORS.anchor;
      ctx.beginPath();
      ctx.arc(anchor.x, anchor.y, ANCHOR_RADIUS, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.fillStyle = COLORS.anchorCore;
      ctx.beginPath();
      ctx.arc(anchor.x, anchor.y, ANCHOR_CORE_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}
