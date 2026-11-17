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
};

/**
 * Placeholder world renderer.
 *
 * Draws a dark purple ground plane below CONFIG.groundY and repeating vertical
 * markers so forward motion is visible. Only the slice of world currently on
 * screen is drawn, so the plane is effectively infinite without cost.
 *
 * Call with the camera translation already applied; `cameraX` is passed in so
 * the visible horizontal range can be derived.
 */
export class World {
  render(ctx, cameraX, view) {
    const top = CONFIG.groundY;
    const left = cameraX;
    const right = cameraX + view.width;
    const bottom = Math.max(view.height, top + 1);

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
  }
}
