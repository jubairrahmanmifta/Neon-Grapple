import { CONFIG } from './config.js';
import { lerp } from './utils.js';

/**
 * The auto-running, swinging player.
 *
 * `x`/`y` are the top-left corner of an axis-aligned rectangle in world space.
 * The player always pushes forward, gravity pulls it down, and the tether
 * redirects that motion into a swing. Rooftops passed in by the world catch the
 * body from above and re-establish the auto-run.
 *
 * `prevX`/`prevY` hold the previous logic step so the renderer can interpolate
 * between fixed updates and stay smooth on high-refresh displays.
 */
export class Player {
  constructor(x = CONFIG.spawnX, y = CONFIG.spawnY) {
    this.width = 30;
    this.height = 50;
    this.x = x;
    this.y = y;
    this.vx = CONFIG.runSpeed;
    this.vy = 0;
    this.isGrounded = false;
    this.prevX = this.x;
    this.prevY = this.y;
  }

  /** Centre X in world space; the tether attaches here, not the top-left. */
  get centerX() {
    return this.x + this.width / 2;
  }

  /** Centre Y in world space; the tether attaches here, not the top-left. */
  get centerY() {
    return this.y + this.height / 2;
  }

  /**
   * Integrates one fixed step and resolves rooftop landings.
   *
   * @param {number} dt
   * @param {ReadonlyArray<{ x: number, y: number, width: number }>} platforms
   */
  update(dt, platforms = []) {
    this.prevX = this.x;
    this.prevY = this.y;

    // Auto-run: never let forward momentum die completely.
    if (this.isGrounded) this.vx = CONFIG.runSpeed;
    if (this.vx < CONFIG.runSpeed) {
      this.vx = Math.min(CONFIG.runSpeed, this.vx + CONFIG.runAcceleration * dt);
    }

    this.vy += CONFIG.gravity * dt;

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    this.resolveRooftop(platforms);
  }

  /**
   * Lands on the highest rooftop whose surface the player crossed downwards
   * this step. Platforms are one-way for now: the player can swing up through
   * them, but cannot fall through a surface from above.
   */
  resolveRooftop(platforms) {
    this.isGrounded = false;
    if (this.vy < 0) return;

    const left = this.x;
    const right = this.x + this.width;
    const previousBottom = this.prevY + this.height;
    const bottom = this.y + this.height;

    let landing = null;
    for (const platform of platforms) {
      if (right <= platform.x || left >= platform.x + platform.width) continue;
      if (previousBottom > platform.y || bottom < platform.y) continue;
      if (!landing || platform.y < landing.y) landing = platform;
    }

    if (!landing) return;

    this.y = landing.y - this.height;
    this.vy = 0;
    this.vx = CONFIG.runSpeed;
    this.isGrounded = true;
  }

  /**
   * Pulls the player onto the circle of `ropeLength` around `anchor` and keeps
   * the velocity tangential so the tether can never be stretched indefinitely.
   *
   * The position correction is softened by `ropeConstraintDamping`, leaving a
   * sliver of stretch each step. That tiny give is what makes the rope feel
   * springy instead of like a rigid steel rod.
   *
   * @param {{ x: number, y: number }} anchor
   * @param {number} ropeLength
   * @param {number} [damping] fraction of the overstretch corrected this step
   */
  applyGrappleConstraint(anchor, ropeLength, damping = CONFIG.ropeConstraintDamping) {
    const dx = this.centerX - anchor.x;
    const dy = this.centerY - anchor.y;
    const distance = Math.hypot(dx, dy);

    // Degenerate case: the player is exactly on the anchor; no direction exists.
    if (distance < 1e-6) return;

    const nx = dx / distance;
    const ny = dy / distance;

    if (distance > ropeLength) {
      const correction = (distance - ropeLength) * damping;
      this.x -= nx * correction;
      this.y -= ny * correction;
    }

    // Remove the component pointing directly away from the anchor. Whatever
    // remains runs along the tangent, so the player swings instead of stretching.
    const radial = this.vx * nx + this.vy * ny;
    if (radial > 0) {
      this.vx -= radial * nx;
      this.vy -= radial * ny;
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
