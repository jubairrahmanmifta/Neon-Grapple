import { CONFIG } from './config.js';
import { lerp } from './utils.js';

/**
 * Follow camera.
 *
 * Horizontally the player is pinned `cameraOffsetX` pixels from the left edge,
 * so the world scrolls past at a constant rate. Vertically the camera eases
 * slowly toward the player's centre: fast enough to keep a swing in frame,
 * slow enough that pendulum arcs do not throw the whole city around.
 *
 * Like the player, the camera keeps the previous step's position so rendering
 * can interpolate between fixed updates.
 */
export class Camera {
  constructor(targetX, targetY, viewHeight) {
    this.x = 0;
    this.prevX = 0;
    this.y = 0;
    this.prevY = 0;
    if (targetX !== undefined) this.snapTo(targetX, targetY, viewHeight);
  }

  /** Positions the camera immediately, without interpolation. */
  snapTo(targetX, targetY, viewHeight) {
    this.x = targetX - CONFIG.cameraOffsetX;
    this.prevX = this.x;
    this.y = this.targetY(targetY, viewHeight);
    this.prevY = this.y;
  }

  /** Snaps back onto the player immediately, used when a run restarts. */
  reset(targetX, targetY, viewHeight) {
    this.snapTo(targetX, targetY, viewHeight);
  }

  update(targetX, targetY, viewHeight, dt) {
    this.prevX = this.x;
    this.prevY = this.y;

    this.x = targetX - CONFIG.cameraOffsetX;

    const target = this.targetY(targetY, viewHeight);
    const follow = 1 - Math.exp(-CONFIG.cameraFollowRate * dt);
    this.y += (target - this.y) * follow;
  }

  /** World Y that puts the tracked point at the configured screen fraction. */
  targetY(targetY, viewHeight) {
    return targetY - viewHeight * CONFIG.cameraOffsetY;
  }

  /** Interpolated camera X for rendering between fixed steps. */
  renderX(alpha) {
    return lerp(this.prevX, this.x, alpha);
  }

  /** Interpolated camera Y for rendering between fixed steps. */
  renderY(alpha) {
    return lerp(this.prevY, this.y, alpha);
  }
}
