import { CONFIG } from './config.js';
import { lerp } from './utils.js';

/**
 * Horizontal follow camera.
 *
 * The camera holds the player a fixed distance from the left edge of the
 * screen, so the world appears to scroll past while the player stays put.
 * Like the player, it keeps the previous step's X so rendering can interpolate.
 */
export class Camera {
  constructor(targetX) {
    this.x = 0;
    this.prevX = 0;
    if (targetX !== undefined) this.snapTo(targetX);
  }

  /** Positions the camera immediately, without interpolation. */
  snapTo(targetX) {
    this.x = targetX - CONFIG.cameraOffsetX;
    this.prevX = this.x;
  }

  update(targetX) {
    this.prevX = this.x;
    this.x = targetX - CONFIG.cameraOffsetX;
  }

  /** Interpolated camera X for rendering between fixed steps. */
  renderX(alpha) {
    return lerp(this.prevX, this.x, alpha);
  }
}
