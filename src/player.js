import { CONFIG } from './config.js';
import { lerp } from './utils.js';

/** Number of ghost samples kept behind the player. */
const TRAIL_SAMPLES = 10;

/**
 * The auto-running, swinging player.
 *
 * `x`/`y` are the top-left corner of an axis-aligned rectangle in world space.
 * `prevX`/`prevY` hold the previous step so rendering can interpolate between
 * fixed updates. Rooftops catch the body from above and restore the auto-run.
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
    this.score = 0;
    this.streak = 0;
    this.bestStreak = 0;
    this.prevX = this.x;
    this.prevY = this.y;
    // Pre-allocated ring buffer so the update loop never allocates.
    this.trail = [];
    for (let i = 0; i < TRAIL_SAMPLES; i += 1) {
      this.trail.push({ x: this.x, y: this.y, angle: 0 });
    }
    this.trailCursor = 0;
    this.trailFilled = 0;
  }

  /** Returns the player to its spawn state and clears the current run's score. */
  reset(x = CONFIG.spawnX, y = CONFIG.spawnY) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.isGrounded = false;
    this.score = 0;
    this.streak = 0;
    this.prevX = this.x;
    this.prevY = this.y;
    this.resetTrail();
  }

  /** Refills the trail with the current position so a new run starts clean. */
  resetTrail() {
    for (const sample of this.trail) {
      sample.x = this.x;
      sample.y = this.y;
      sample.angle = 0;
    }
    this.trailCursor = 0;
    this.trailFilled = 0;
  }

  /** Centre X in world space; the tether attaches here, not the top-left. */
  get centerX() {
    return this.x + this.width / 2;
  }

  /** Centre Y in world space; the tether attaches here, not the top-left. */
  get centerY() {
    return this.y + this.height / 2;
  }

  /** Body tilt in radians, derived from the current velocity direction. */
  get angle() {
    return Math.atan2(this.vy, this.vx);
  }

  /** Integrates one fixed step and resolves rooftop landings. */
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

    // Score only ever climbs: it tracks the furthest point reached this run.
    this.score = Math.max(this.score, Math.floor(this.x * CONFIG.scoreDistanceMultiplier));

    this.recordTrail();
  }

  /** Stores the current position and tilt in the ghost-trail ring buffer. */
  recordTrail() {
    const sample = this.trail[this.trailCursor];
    sample.x = this.x;
    sample.y = this.y;
    sample.angle = this.angle;
    this.trailCursor = (this.trailCursor + 1) % TRAIL_SAMPLES;
    if (this.trailFilled < TRAIL_SAMPLES) this.trailFilled += 1;
  }

  /** Counts a successful airborne attach; touching a rooftop clears the chain. */
  registerSwing() {
    if (this.isGrounded) return;
    this.streak += 1;
    if (this.streak > this.bestStreak) this.bestStreak = this.streak;
  }

  /** Lands on the highest rooftop crossed downwards this step (one-way). */
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
    // Touching down ends the airborne swing chain.
    this.streak = 0;
  }

  /**
   * Pulls the player onto the tether circle and keeps velocity tangential.
   * `damping` leaves a sliver of elastic stretch each step, so the rope springs
   * instead of behaving like a rigid steel rod.
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

  /** Faint, shrinking cyan ghosts tracing the last ten fixed steps. */
  renderTrail(ctx) {
    const length = this.trail.length;
    for (let i = 0; i < this.trailFilled; i += 1) {
      const index = (this.trailCursor - this.trailFilled + i + length) % length;
      const sample = this.trail[index];
      // Oldest sample is faintest; the newest sits just under the body.
      const fade = (i + 1) / this.trailFilled;
      const scale = 0.55 + fade * 0.35;
      const w = this.width * scale;
      const h = this.height * scale;

      ctx.save();
      ctx.globalAlpha = 0.04 + fade * 0.14;
      ctx.fillStyle = '#35f6ff';
      ctx.translate(sample.x + this.width / 2, sample.y + this.height / 2);
      ctx.rotate(sample.angle);
      ctx.fillRect(-w / 2, -h / 2, w, h);
      ctx.restore();
    }
  }

  /** Placeholder art: a cyan body that tilts with velocity, plus its trail. */
  render(ctx, alpha) {
    this.renderTrail(ctx);

    const x = this.renderX(alpha);
    const y = this.renderY(alpha);

    ctx.save();
    ctx.translate(x + this.width / 2, y + this.height / 2);
    ctx.rotate(this.angle);
    ctx.shadowColor = 'rgba(53, 246, 255, 0.7)';
    ctx.shadowBlur = 14;
    ctx.fillStyle = '#35f6ff';
    ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ff2fd0';
    ctx.fillRect(this.width / 2 - 8, -this.height / 2 + 16, 8, 18);
    ctx.restore();
  }
}
