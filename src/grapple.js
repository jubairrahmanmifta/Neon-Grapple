import { CONFIG } from './config.js';

/**
 * One-button tether.
 *
 * The grapple picks a single anchor ahead of the player, remembers the rope
 * length at the moment of attachment, and then keeps the player on that circle
 * while gravity supplies the swing. Releasing keeps the tangential velocity and
 * adds a small boost so a well-timed detach carries into the next anchor.
 *
 * All distances are measured from the player's centre, matching the point the
 * tether is drawn from.
 */
export class Grapple {
  constructor() {
    this.isAttached = false;
    this.anchor = null;
    this.ropeLength = 0;
  }

  /**
   * Attaches to the nearest anchor ahead of the player that is in range.
   * Returns true when a tether was created.
   *
   * @param {import('./player.js').Player} player
   * @param {ReadonlyArray<{ x: number, y: number }>} anchors
   */
  fire(player, anchors) {
    if (this.isAttached) return false;

    const rangeSq = CONFIG.grappleRange * CONFIG.grappleRange;
    let best = null;
    let bestDistSq = rangeSq;

    for (const anchor of anchors) {
      // Only anchors in front of the player are valid targets.
      if (anchor.x <= player.x) continue;

      const dx = anchor.x - player.centerX;
      const dy = anchor.y - player.centerY;
      const distSq = dx * dx + dy * dy;

      if (distSq <= bestDistSq) {
        best = anchor;
        bestDistSq = distSq;
      }
    }

    if (!best) return false;

    this.isAttached = true;
    this.anchor = best;
    // The rope is exactly as long as the gap at attach time; the player then
    // swings on that radius for the rest of the hold.
    this.ropeLength = Math.sqrt(bestDistSq);
    return true;
  }

  /**
   * Detaches and carries the current velocity into free flight with a small
   * momentum reward. Returns true when a tether was released.
   *
   * @param {import('./player.js').Player} player
   */
  release(player) {
    if (!this.isAttached) return false;

    player.vx *= CONFIG.swingSpeedBoost;
    player.vy *= CONFIG.swingSpeedBoost;

    this.isAttached = false;
    this.anchor = null;
    this.ropeLength = 0;
    return true;
  }

  /**
   * Enforces the pendulum constraint for one fixed step. The player has already
   * integrated gravity and its velocity by the time this runs; this method only
   * corrects the resulting overstretch and redirects the velocity along the arc.
   *
   * @param {import('./player.js').Player} player
   * @param {number} dt
   */
  update(player, dt) {
    if (!this.isAttached) return;

    const dx = player.centerX - this.anchor.x;
    const dy = player.centerY - this.anchor.y;
    const distance = Math.hypot(dx, dy);

    // Slack rope: the player is inside the circle and falls freely.
    if (distance <= this.ropeLength) return;

    // Normalise the damping for the step so the softness feels identical if the
    // fixed timestep ever changes.
    const steps = dt * CONFIG.loop.updatesPerSecond;
    const damping = 1 - Math.pow(1 - CONFIG.ropeConstraintDamping, steps);
    player.applyGrappleConstraint(this.anchor, this.ropeLength, damping);
  }
}
