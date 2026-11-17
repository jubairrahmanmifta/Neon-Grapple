import { CONFIG } from './config.js';
import { clamp, lerp } from './utils.js';

/**
 * The auto-running player.
 *
 * `x`/`y` are the top-left corner of an axis-aligned rectangle in world space.
 * The player is pushed right at a constant speed every step and pulled down by
 * gravity; the bottom edge is clamped to CONFIG.groundY.
 *
 * `prevX`/`prevY` hold the previous logic step so the renderer can interpolate
 * between fixed updates and stay smooth on high-refresh displays.
 */
export class Player {
  constructor(x = 0) {
    this.width = 30;
    this.height = 50;
    this.x = x;
    this.y = CONFIG.groundY - this.height;
    this.vx = CONFIG.playerSpeed;
    this.vy = 0;
    this.grounded = true;
    this.prevX = this.x;
    this.prevY = this.y;
  }

  /** Jumps only from the ground. Returns true when a jump was started. */
  jump() {
    if (!this.grounded) return false;
    this.vy = CONFIG.jumpForce;
    this.grounded = false;
    return true;
  }

  update(dt) {
    this.prevX = this.x;
    this.prevY = this.y;

    // Constant auto-run plus gravity.
    this.vx = CONFIG.playerSpeed;
    this.vy += CONFIG.gravity * dt;

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Keep the feet on (or above) the ground plane.
    const floorY = CONFIG.groundY - this.height;
    this.y = clamp(this.y, -Infinity, floorY);

    if (this.y === floorY && this.vy >= 0) {
      this.vy = 0;
      this.grounded = true;
    } else {
      this.grounded = false;
    }
  }

  /** Interpolated screen/world X for rendering between fixed steps. */
  renderX(alpha) {
    return lerp(this.prevX, this.x, alpha);
  }

  /** Interpolated screen/world Y for rendering between fixed steps. */
  renderY(alpha) {
    return lerp(this.prevY, this.y, alpha);
  }

  /** Placeholder art: a cyan body with a magenta facing marker on the front. */
  render(ctx, alpha) {
    const x = this.renderX(alpha);
    const y = this.renderY(alpha);

    ctx.save();
    ctx.shadowColor = 'rgba(53, 246, 255, 0.7)';
    ctx.shadowBlur = 14;
    ctx.fillStyle = '#35f6ff';
    ctx.fillRect(x, y, this.width, this.height);

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ff2fd0';
    ctx.fillRect(x + this.width - 8, y + 16, 8, 18);
    ctx.restore();
  }
}
